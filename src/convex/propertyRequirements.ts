import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    listingFor: v.union(
      v.literal("rent"),
      v.literal("buy"),
      v.literal("sale"),
    ),

    propertyType: v.union(
      v.literal("flat"),
      v.literal("house"),
      v.literal("pg"),
      v.literal("villa"),
      v.literal("commercial"),
    ),

    location: v.string(),
    budget: v.number(),
    areaSqFt: v.optional(v.number()),

    bhk: v.optional(v.number()),

    furnishing: v.optional(
      v.union(
        v.literal("furnished"),
        v.literal("semi_furnished"),
        v.literal("unfurnished"),
      ),
    ),

    phone: v.string(),
    message: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("You must be logged in to submit an enquiry.");
    }

    const now = Date.now();

    const requirementId = await ctx.db.insert("propertyRequirements", {
      customerId: userId,

      listingFor: args.listingFor,
      propertyType: args.propertyType,

      location: args.location,
      budget: args.budget,
      areaSqFt: args.areaSqFt,


      bhk: args.bhk,
      furnishing: args.furnishing,

      phone: args.phone,
      message: args.message,

      status: "new",

      createdAt: now,
      updatedAt: now,
    });

    return requirementId;
  },
});

export const myRequirements = query({
  args: {},

  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("propertyRequirements")
      .withIndex("by_customer", (q) =>
        q.eq("customerId", userId),
      )
      .order("desc")
      .collect();
  },
});

export const allRequirements = query({
  args: {},

  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("You must be logged in.");
    }

    const user = await ctx.db.get(userId);

    if (!user || user.role !== "admin") {
      throw new Error("Admin access required.");
    }

    const requirements = await ctx.db
      .query("propertyRequirements")
      .withIndex("by_status")
      .order("desc")
      .collect();

    return await Promise.all(
      requirements.map(async (requirement) => {
        const customer = await ctx.db.get(
          requirement.customerId,
        );

        return {
          ...requirement,

          customer: customer
            ? {
                name: customer.name ?? null,
                email: customer.email ?? null,
                phone: customer.phone ?? null,
              }
            : null,
        };
      }),
    );
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("propertyRequirements"),

    status: v.union(
      v.literal("contacted"),
      v.literal("closed"),
    ),
  },

  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("You must be logged in.");
    }

    const user = await ctx.db.get(userId);

    if (!user || user.role !== "admin") {
      throw new Error("Admin access required.");
    }

    const requirement = await ctx.db.get(args.id);

    if (!requirement) {
      throw new Error("Requirement not found.");
    }

    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return true;
  },
});