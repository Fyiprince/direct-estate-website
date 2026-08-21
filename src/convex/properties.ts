import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { z } from "zod";
import { Doc } from "./_generated/dataModel";
import { mutation, query, QueryCtx } from "./_generated/server";
import {
  furnishingValidator,
  listingForValidator,
  propertyTypeValidator,
  ROLES,
  sortValidator,
} from "./schema";
import { initials, propertyInputSchema } from "../lib/property";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Owner summary shown alongside a listing.
 * Phone number is returned only when the viewer is allowed to see contact info.
 */
export type OwnerSummary = {
  name: string;
  initials: string;
  isVerified: boolean;
  phone: string | null;
};

export type PropertyWithOwner = Doc<"properties"> & {
  owner: OwnerSummary | null;
};

async function ownerSummaryOf(
  ctx: QueryCtx,
  ownerId: Doc<"users">["_id"],
  includeContact = false,
  propertyPhone?: string,
): Promise<OwnerSummary | null> {
  const owner = await ctx.db.get(ownerId);

  if (!owner) return null;

  return {
    name: owner.name ?? "Verified owner",
    initials: initials(owner.name),
    isVerified: owner.isVerified ?? false,

    // Prefer the phone entered specifically for this property.
    // Fall back to user's phone for older listings.
    phone: includeContact
      ? propertyPhone ?? owner.phone ?? null
      : null,
  };
}

// ---------------------------------------------------------------------------
// Public queries
// ---------------------------------------------------------------------------

/** Faceted search over LIVE listings. All filtering is server-side. */
export const search = query({
  args: {
    purpose: v.optional(listingForValidator),
    type: v.optional(propertyTypeValidator),
    city: v.optional(v.string()),
    q: v.optional(v.string()),
    bhk: v.optional(v.number()),
    furnishing: v.optional(furnishingValidator),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    sort: v.optional(sortValidator),
    limit: v.optional(v.number()),
    skip: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("properties")
      .withIndex("by_status", (q) => q.eq("status", "live"))
      .collect();

    const needle = args.q?.trim().toLowerCase();
    let items = all;

    if (args.purpose) {
      items = items.filter((p) => p.listingFor === args.purpose);
    }

    if (args.type) {
      items = items.filter((p) => p.type === args.type);
    }

    if (args.city) {
      const city = args.city.trim().toLowerCase();
      items = items.filter((p) => p.city.toLowerCase() === city);
    }

    if (needle) {
      items = items.filter((p) =>
        `${p.title} ${p.locality} ${p.address} ${p.city}`
          .toLowerCase()
          .includes(needle),
      );
    }

    if (args.bhk) {
      items = items.filter((p) => (p.bhk ?? 0) >= args.bhk!);
    }

    if (args.furnishing) {
      items = items.filter((p) => p.furnishing === args.furnishing);
    }

    if (args.minPrice != null) {
      items = items.filter((p) => p.price >= args.minPrice!);
    }

    if (args.maxPrice != null) {
      items = items.filter((p) => p.price <= args.maxPrice!);
    }

    const sort = args.sort ?? "newest";

    items = [...items].sort((a, b) => {
      switch (sort) {
        case "price_asc":
          return a.price - b.price;

        case "price_desc":
          return b.price - a.price;

        case "popular":
          return b.viewCount - a.viewCount;

        default:
          return b.createdAt - a.createdAt;
      }
    });

    const total = items.length;
    const skip = args.skip ?? 0;
    const limit = Math.min(args.limit ?? 12, 50);

    const page = items.slice(skip, skip + limit);

    const withOwners = await Promise.all(
      page.map(async (p) => ({
        ...p,
        owner: await ownerSummaryOf(ctx, p.ownerId),
      })),
    );

    return {
      items: withOwners as PropertyWithOwner[],
      total,
    };
  },
});

// ---------------------------------------------------------------------------
// Single property
// ---------------------------------------------------------------------------

/**
 * Single listing with owner summary.
 *
 * Live listings are public.
 * Pending/rejected listings are visible only to:
 * - admin
 * - owner who posted them
 *
 * Phone number is exposed only to admin.
 */
export const get = query({
  args: {
    id: v.id("properties"),
  },

  handler: async (ctx, { id }) => {
    const property = await ctx.db.get(id);

    if (!property) return null;

    const userId = await getAuthUserId(ctx);
    const me = userId ? await ctx.db.get(userId) : null;

    const isAdmin = me?.role === ROLES.ADMIN;

    if (property.status !== "live") {
      if (userId === null) return null;

      const isOwner = property.ownerId === userId;

      if (!isAdmin && !isOwner) return null;
    }

    const photos = await Promise.all(
      property.photos.map(async (photo) => {
        if (photo.startsWith("http")) {
          return photo;
        }

        return await ctx.storage.getUrl(photo as any);
      }),
    );

    const owner = await ownerSummaryOf(
      ctx,
      property.ownerId,
      isAdmin,
      property.phoneNumber,
    );

    return {
      ...property,
      photos: photos.filter(Boolean),
      owner,
    } as PropertyWithOwner;
  },
});

// ---------------------------------------------------------------------------
// Similar properties
// ---------------------------------------------------------------------------

/** Similar live listings in the same city/type, excluding current one. */
export const similar = query({
  args: {
    id: v.id("properties"),
    city: v.optional(v.string()),
    type: v.optional(propertyTypeValidator),
    limit: v.optional(v.number()),
  },

  handler: async (ctx, { id, city, type, limit }) => {
    let items = await ctx.db
      .query("properties")
      .withIndex("by_status", (q) => q.eq("status", "live"))
      .collect();

    items = items.filter((p) => p._id !== id);

    if (city) {
      items = items.filter((p) => p.city === city);
    }

    if (type) {
      items = items.filter((p) => p.type === type);
    }

    items.sort((a, b) => b.viewCount - a.viewCount);

    return items.slice(0, limit ?? 4);
  },
});

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

/** Landing page aggregates over live listings. */
export const stats = query({
  args: {},

  handler: async (ctx) => {
    const live = await ctx.db
      .query("properties")
      .withIndex("by_status", (q) => q.eq("status", "live"))
      .collect();

    const byCity: { city: string; count: number }[] = [];
    const byType: { type: string; count: number }[] = [];

    const cityMap = new Map<string, number>();
    const typeMap = new Map<string, number>();

    let totalViews = 0;
    let verified = 0;

    for (const p of live) {
      totalViews += p.viewCount;

      if (p.isVerified) {
        verified += 1;
      }

      cityMap.set(
        p.city,
        (cityMap.get(p.city) ?? 0) + 1,
      );

      typeMap.set(
        p.type,
        (typeMap.get(p.type) ?? 0) + 1,
      );
    }

    for (const [city, count] of cityMap) {
      byCity.push({ city, count });
    }

    for (const [type, count] of typeMap) {
      byType.push({ type, count });
    }

    byCity.sort((a, b) => b.count - a.count);
    byType.sort((a, b) => b.count - a.count);

    return {
      total: live.length,
      totalViews,
      verifiedProperties: verified,
      byCity,
      byType,
    };
  },
});

// ---------------------------------------------------------------------------
// Featured
// ---------------------------------------------------------------------------

/** Featured/trending listings for the landing carousel. */
export const featured = query({
  args: {
    limit: v.optional(v.number()),
  },

  handler: async (ctx, { limit }) => {
    let items = await ctx.db
      .query("properties")
      .withIndex("by_status", (q) => q.eq("status", "live"))
      .collect();

    items = items
      .filter((p) => p.isFeatured || p.viewCount > 0)
      .sort(
        (a, b) =>
          Number(b.isFeatured) - Number(a.isFeatured) ||
          b.viewCount - a.viewCount ||
          b.createdAt - a.createdAt,
      );

    return items.slice(0, limit ?? 8);
  },
});

// ---------------------------------------------------------------------------
// Authenticated queries
// ---------------------------------------------------------------------------

/** The signed-in owner's own listings, newest first. */
export const myListings = query({
  args: {},

  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      return [];
    }

    const mine = await ctx.db
      .query("properties")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();

    return mine.sort(
      (a, b) => b.createdAt - a.createdAt,
    );
  },
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Validate a listing payload with the shared Zod schema. */
export function parsePropertyInput(input: unknown) {
  const parsed = propertyInputSchema.safeParse(input);

  if (!parsed.success) {
    const first = parsed.error.issues[0];

    throw new Error(
      first
        ? `${first.path.join(".")}: ${first.message}`
        : "Invalid listing data",
    );
  }

  return parsed.data;
}

// ---------------------------------------------------------------------------
// Create property
// ---------------------------------------------------------------------------

export const createProperty = mutation({
  args: {
    input: v.any(),
  },

  handler: async (ctx, { input }) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      throw new Error("Sign in to post a property");
    }

    const data = parsePropertyInput(input);

    const now = Date.now();

    // A renter who lists their first property becomes an Owner.
    const me = await ctx.db.get(userId);

    if (
      me &&
      me.role !== ROLES.OWNER &&
      me.role !== ROLES.ADMIN
    ) {
      await ctx.db.patch(userId, {
        role: ROLES.OWNER,
      });
    }

    const id = await ctx.db.insert(
      "properties",
      buildPropertyInsert(
        me ?? null,
        data,
        userId,
        now,
      ),
    );

    return id;
  },
});

// ---------------------------------------------------------------------------
// Build property insert
// ---------------------------------------------------------------------------

function buildPropertyInsert(
  me: Doc<"users"> | null,
  data: z.infer<typeof propertyInputSchema>,
  ownerId: Doc<"users">["_id"],
  now: number,
): Omit<Doc<"properties">, "_id" | "_creationTime"> {
  const insert: Omit<
    Doc<"properties">,
    "_id" | "_creationTime"
  > = {
    ownerId,
    title: data.title,
    type: data.type,
    listingFor: data.listingFor,
    city: data.city,
    locality: data.locality,
    address: data.address,
    areaSqft: data.areaSqft,
    furnishing: data.furnishing,
    price: data.price,
    negotiable: data.negotiable,
    amenities: data.amenities,
    photos: data.photos,
    phoneNumber: data.phoneNumber,

    status: "pending",

    isVerified: me?.isVerified ?? false,
    isFeatured: false,
    viewCount: 0,

    createdAt: now,
    updatedAt: now,
  };

  // Optional fields.
  // Convex rejects undefined values, so only add them when present.

  if (data.description) {
    insert.description = data.description;
  }

  if (data.latitude != null) {
    insert.latitude = data.latitude;
  }

  if (data.longitude != null) {
    insert.longitude = data.longitude;
  }

  if (data.bhk != null) {
    insert.bhk = data.bhk;
  }

  if (data.floor != null) {
    insert.floor = data.floor;
  }

  if (data.totalFloors != null) {
    insert.totalFloors = data.totalFloors;
  }

  if (data.ageOfProperty != null) {
    insert.ageOfProperty = data.ageOfProperty;
  }

  if (data.deposit != null) {
    insert.deposit = data.deposit;
  }

  if (data.maintenance != null) {
    insert.maintenance = data.maintenance;
  }

  if (data.videoUrl) {
    insert.videoUrl = data.videoUrl;
  }

  if (data.availableFrom != null) {
    insert.availableFrom = data.availableFrom;
  }

  return insert;
}

// ---------------------------------------------------------------------------
// Update property
// ---------------------------------------------------------------------------

export const updateProperty = mutation({
  args: {
    id: v.id("properties"),
    input: v.any(),
  },

  handler: async (ctx, { id, input }) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      throw new Error("Sign in required");
    }

    const property = await ctx.db.get(id);

    if (!property) {
      throw new Error("Listing not found");
    }

    const me = await ctx.db.get(userId);

    const isOwner = property.ownerId === userId;
    const isAdmin = me?.role === ROLES.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new Error(
        "You can only edit your own listings",
      );
    }

    const data = parsePropertyInput(input);

    const updatedData = {
      title: data.title,
      type: data.type,
      listingFor: data.listingFor,
      city: data.city,
      locality: data.locality,
      address: data.address,
      areaSqft: data.areaSqft,
      furnishing: data.furnishing,
      price: data.price,
      negotiable: data.negotiable,
      amenities: data.amenities,
      photos: data.photos,
      phoneNumber: data.phoneNumber,

      updatedAt: Date.now(),

      ...(data.description !== undefined && {
        description: data.description,
      }),

      ...(data.latitude !== undefined && {
        latitude: data.latitude,
      }),

      ...(data.longitude !== undefined && {
        longitude: data.longitude,
      }),

      ...(data.bhk !== undefined && {
        bhk: data.bhk,
      }),

      ...(data.floor !== undefined && {
        floor: data.floor,
      }),

      ...(data.totalFloors !== undefined && {
        totalFloors: data.totalFloors,
      }),

      ...(data.ageOfProperty !== undefined && {
        ageOfProperty: data.ageOfProperty,
      }),

      ...(data.deposit !== undefined && {
        deposit: data.deposit,
      }),

      ...(data.maintenance !== undefined && {
        maintenance: data.maintenance,
      }),

      ...(data.videoUrl !== undefined && {
        videoUrl: data.videoUrl,
      }),

      ...(data.availableFrom !== undefined && {
        availableFrom: data.availableFrom,
      }),
    };

    await ctx.db.patch(id, updatedData);

    return {
      ok: true,
    };
  },
});
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      throw new Error("Sign in to upload photos");
    }

    return await ctx.storage.generateUploadUrl();
  },
});
export const incrementView = mutation({
  args: {
    id: v.id("properties"),
  },

  handler: async (ctx, { id }) => {
    const property = await ctx.db.get(id);

    if (!property) {
      return;
    }

    await ctx.db.patch(id, {
      viewCount: property.viewCount + 1,
      updatedAt: Date.now(),
    });
  },
});

// ---------------------------------------------------------------------------
// Delete property
// ---------------------------------------------------------------------------

export const deleteProperty = mutation({
  args: {
    id: v.id("properties"),
  },

  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      throw new Error("Sign in required");
    }

    const property = await ctx.db.get(id);

    if (!property) {
      throw new Error("Listing not found");
    }

    const me = await ctx.db.get(userId);

    const isOwner = property.ownerId === userId;
    const isAdmin = me?.role === ROLES.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new Error(
        "You can only delete your own listings",
      );
    }

    await ctx.db.delete(id);

    return {
      success: true,
    };
  },
});