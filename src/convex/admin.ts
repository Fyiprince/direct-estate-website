import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { mutation, query, QueryCtx } from "./_generated/server";
import { ROLES } from "./schema";

/**
 * Resolve the signed-in user and enforce the ADMIN role.
 * Returns the user doc on success, or null when not signed in / not admin.
 */
async function requireAdmin(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);

  if (userId === null) {
    return null;
  }

  const me = await ctx.db.get(userId);

  if (me?.role !== ROLES.ADMIN) {
    return null;
  }

  return me;
}

export type AdminProperty = Doc<"properties"> & {
  owner: {
    name: string | null;
    email: string | null;
    phone: string | null;
    isVerified: boolean;
  } | null;
};

/**
 * All listings (any status) with full owner contact.
 * Admins only.
 */
export const allListings = query({
  args: {},

  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);

    if (admin === null) {
      return null;
    }

    const all = await ctx.db
      .query("properties")
      .collect();

    const sorted = [...all].sort(
      (a, b) => b.createdAt - a.createdAt,
    );

    const withOwners = await Promise.all(
      sorted.map(async (p) => {
        const owner = await ctx.db.get(p.ownerId);

        return {
          ...p,

          owner: owner
            ? {
                name: owner.name ?? null,
                email: owner.email ?? null,

                // Property-specific phone number.
                // Only returned to admins.
                phone: p.phoneNumber ?? null,

                isVerified: owner.isVerified ?? false,
              }
            : null,
        } as AdminProperty;
      }),
    );

    return withOwners;
  },
});

/**
 * Delete a property listing.
 * Admins only.
 */
export const deleteListing = mutation({
  args: {
    id: v.id("properties"),
  },

  handler: async (ctx, { id }) => {
    const admin = await requireAdmin(ctx);

    if (admin === null) {
      throw new Error("Admin access required");
    }

    const property = await ctx.db.get(id);

    if (!property) {
      throw new Error("Listing not found");
    }

    await ctx.db.delete(id);

    return {
      ok: true,
    };
  },
});

/**
 * Moderate a listing:
 * PENDING → LIVE
 * Admins only.
 */
export const approveListing = mutation({
  args: {
    id: v.id("properties"),
  },

  handler: async (ctx, { id }) => {
    const admin = await requireAdmin(ctx);

    if (admin === null) {
      throw new Error("Admin access required");
    }

    const property = await ctx.db.get(id);

    if (!property) {
      throw new Error("Listing not found");
    }

    if (property.status !== "pending") {
      throw new Error(
        `Only pending listings can be approved (current: ${property.status})`,
      );
    }

    await ctx.db.patch(id, {
      status: "live",
      updatedAt: Date.now(),
    });

    return {
      ok: true,
    };
  },
});

/**
 * Moderate a listing:
 * PENDING → REJECTED
 * Admins only.
 */
export const rejectListing = mutation({
  args: {
    id: v.id("properties"),
  },

  handler: async (ctx, { id }) => {
    const admin = await requireAdmin(ctx);

    if (admin === null) {
      throw new Error("Admin access required");
    }

    const property = await ctx.db.get(id);

    if (!property) {
      throw new Error("Listing not found");
    }

    if (property.status !== "pending") {
      throw new Error(
        `Only pending listings can be rejected (current: ${property.status})`,
      );
    }

    await ctx.db.patch(id, {
      status: "rejected",
      updatedAt: Date.now(),
    });

    return {
      ok: true,
    };
  },
});

/**
 * Moderation snapshot for the admin dashboard header.
 */
export const stats = query({
  args: {},

  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);

    if (admin === null) {
      return null;
    }

    const all = await ctx.db
      .query("properties")
      .collect();

    let pending = 0;
    let live = 0;
    let rejected = 0;
    let totalViews = 0;

    for (const p of all) {
      if (p.status === "pending") {
        pending += 1;
      }

      if (p.status === "live") {
        live += 1;
      }

      if (p.status === "rejected") {
        rejected += 1;
      }

      totalViews += p.viewCount;
    }

    return {
      total: all.length,
      pending,
      live,
      rejected,
      totalViews,
    };
  },
});