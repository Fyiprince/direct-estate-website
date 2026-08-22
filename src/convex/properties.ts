import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { z } from "zod";
import { Doc, Id } from "./_generated/dataModel";
import {
  mutation,
  query,
  MutationCtx,
  QueryCtx,
} from "./_generated/server";
import {
  furnishingValidator,
  listingForValidator,
  propertyTypeValidator,
  ROLES,
  sortValidator,
} from "./schema";
import { initials, propertyInputSchema } from "../lib/property";
import { rateLimiter } from "./rateLimiter";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OwnerSummary = {
  name: string;
  initials: string;
  isVerified: boolean;
  phone: string | null;
};

export type PropertyWithOwner = Doc<"properties"> & {
  owner: OwnerSummary | null;
};

// Public property data must never expose direct contact information.
type PublicProperty = Omit<
  Doc<"properties">,
  "phoneNumber" | "ownerId"
> & {
  owner: OwnerSummary | null;
};

// ---------------------------------------------------------------------------
// Server-side photo validation
// ---------------------------------------------------------------------------

async function validatePropertyPhotos(
  ctx: MutationCtx,
  photos: string[],
) {
  const allowedImageTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

  const maxImageSize = 5 * 1024 * 1024;

  for (const photo of photos) {
    const trimmedPhoto = photo.trim();

    if (!trimmedPhoto) {
      throw new Error("Invalid property image");
    }

    if (
      trimmedPhoto.startsWith("https://") ||
      trimmedPhoto.startsWith("http://")
    ) {
      continue;
    }

    let storageId: Id<"_storage">;

    try {
      storageId = trimmedPhoto as Id<"_storage">;

      const metadata = await ctx.db.system.get(
        "_storage",
        storageId,
      );

      if (!metadata) {
        throw new Error("Property image not found");
      }

      if (
        !metadata.contentType ||
        !allowedImageTypes.has(metadata.contentType)
      ) {
        throw new Error(
          "Only JPEG, PNG, and WebP property images are allowed",
        );
      }

      if (metadata.size > maxImageSize) {
        throw new Error(
          "Each property image must be 5 MB or smaller",
        );
      }
    } catch (error) {
      if (
        error instanceof Error &&
        (
          error.message === "Property image not found" ||
          error.message ===
            "Only JPEG, PNG, and WebP property images are allowed" ||
          error.message ===
            "Each property image must be 5 MB or smaller"
        )
      ) {
        throw error;
      }

      throw new Error("Invalid property image");
    }
  }
}

// ---------------------------------------------------------------------------
// Owner helper
// ---------------------------------------------------------------------------

async function ownerSummaryOf(
  ctx: QueryCtx,
  ownerId: Doc<"users">["_id"],
  includeContact = false,
  propertyPhone?: string,
): Promise<OwnerSummary | null> {
  const owner = await ctx.db.get(ownerId);

  if (!owner) {
    return null;
  }

  return {
    name: owner.name ?? "Verified owner",
    initials: initials(owner.name),
    isVerified: owner.isVerified ?? false,
    phone: includeContact
      ? propertyPhone ?? owner.phone ?? null
      : null,
  };
}

// ---------------------------------------------------------------------------
// Public property sanitizer
// ---------------------------------------------------------------------------

function toPublicProperty(
  property: Doc<"properties">,
  owner: OwnerSummary | null,
): PublicProperty {
  const {
    phoneNumber: _phoneNumber,
    ownerId: _ownerId,
    ...safeProperty
  } = property;

  return {
    ...safeProperty,
    owner,
  };
}

// ---------------------------------------------------------------------------
// Public queries
// ---------------------------------------------------------------------------

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
      .withIndex("by_status", (q) =>
        q.eq("status", "live"),
      )
      .collect();

    const needle = args.q?.trim().toLowerCase();

    let items = all;

    if (args.purpose) {
      items = items.filter(
        (p) => p.listingFor === args.purpose,
      );
    }

    if (args.type) {
      items = items.filter(
        (p) => p.type === args.type,
      );
    }

    if (args.city) {
      const city = args.city.trim().toLowerCase();

      items = items.filter(
        (p) => p.city.toLowerCase() === city,
      );
    }

    if (needle) {
      items = items.filter((p) =>
        `${p.title} ${p.locality} ${p.address} ${p.city}`
          .toLowerCase()
          .includes(needle),
      );
    }

    if (args.bhk) {
      items = items.filter(
        (p) => (p.bhk ?? 0) >= args.bhk!,
      );
    }

    if (args.furnishing) {
      items = items.filter(
        (p) => p.furnishing === args.furnishing,
      );
    }

    if (args.minPrice != null) {
      items = items.filter(
        (p) => p.price >= args.minPrice!,
      );
    }

    if (args.maxPrice != null) {
      items = items.filter(
        (p) => p.price <= args.maxPrice!,
      );
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
    const skip = Math.max(args.skip ?? 0, 0);
    const limit = Math.min(
      Math.max(args.limit ?? 12, 1),
      50,
    );

    const page = items.slice(
      skip,
      skip + limit,
    );

    const safeItems = await Promise.all(
      page.map(async (property) => {
        const owner = await ownerSummaryOf(
          ctx,
          property.ownerId,
        );

        return toPublicProperty(
          property,
          owner,
        );
      }),
    );

    return {
      items: safeItems,
      total,
    };
  },
});

// ---------------------------------------------------------------------------
// Single property
// ---------------------------------------------------------------------------

export const get = query({
  args: {
    id: v.id("properties"),
  },

  handler: async (ctx, { id }) => {
    const property = await ctx.db.get(id);

    if (!property) {
      return null;
    }

    const userId = await getAuthUserId(ctx);
    const me = userId
      ? await ctx.db.get(userId)
      : null;

    const isAdmin =
      me?.role === ROLES.ADMIN;

    if (property.status !== "live") {
      if (userId === null) {
        return null;
      }

      const isOwner =
        property.ownerId === userId;

      if (!isAdmin && !isOwner) {
        return null;
      }
    }

    const photos = await Promise.all(
      property.photos.map(async (photo) => {
        if (photo.startsWith("http")) {
          return photo;
        }

        return await ctx.storage.getUrl(
          photo as Id<"_storage">,
        );
      }),
    );

    // Only admins receive direct property contact.
    const owner = await ownerSummaryOf(
      ctx,
      property.ownerId,
      isAdmin,
      property.phoneNumber,
    );

    if (isAdmin) {
      return {
        ...property,
        photos: photos.filter(Boolean),
        owner,
      } as PropertyWithOwner;
    }

    const safeProperty =
      toPublicProperty(property, owner);

    return {
      ...safeProperty,
      photos: photos.filter(Boolean),
    };
  },
});

// ---------------------------------------------------------------------------
// Similar properties
// ---------------------------------------------------------------------------

export const similar = query({
  args: {
    id: v.id("properties"),
    city: v.optional(v.string()),
    type: v.optional(propertyTypeValidator),
    limit: v.optional(v.number()),
  },

  handler: async (
    ctx,
    { id, city, type, limit },
  ) => {
    let items = await ctx.db
      .query("properties")
      .withIndex("by_status", (q) =>
        q.eq("status", "live"),
      )
      .collect();

    items = items.filter(
      (p) => p._id !== id,
    );

    if (city) {
      items = items.filter(
        (p) => p.city === city,
      );
    }

    if (type) {
      items = items.filter(
        (p) => p.type === type,
      );
    }

    items.sort(
      (a, b) => b.viewCount - a.viewCount,
    );

    const safeItems = await Promise.all(
      items
        .slice(0, Math.min(limit ?? 4, 20))
        .map(async (property) => {
          const owner =
            await ownerSummaryOf(
              ctx,
              property.ownerId,
            );

          return toPublicProperty(
            property,
            owner,
          );
        }),
    );

    return safeItems;
  },
});

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export const stats = query({
  args: {},

  handler: async (ctx) => {
    const live = await ctx.db
      .query("properties")
      .withIndex("by_status", (q) =>
        q.eq("status", "live"),
      )
      .collect();

    const byCity: {
      city: string;
      count: number;
    }[] = [];

    const byType: {
      type: string;
      count: number;
    }[] = [];

    const cityMap = new Map<
      string,
      number
    >();

    const typeMap = new Map<
      string,
      number
    >();

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
      byCity.push({
        city,
        count,
      });
    }

    for (const [type, count] of typeMap) {
      byType.push({
        type,
        count,
      });
    }

    byCity.sort(
      (a, b) => b.count - a.count,
    );

    byType.sort(
      (a, b) => b.count - a.count,
    );

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

export const featured = query({
  args: {
    limit: v.optional(v.number()),
  },

  handler: async (ctx, { limit }) => {
    let items = await ctx.db
      .query("properties")
      .withIndex("by_status", (q) =>
        q.eq("status", "live"),
      )
      .collect();

    items = items
      .filter(
        (p) =>
          p.isFeatured ||
          p.viewCount > 0,
      )
      .sort(
        (a, b) =>
          Number(b.isFeatured) -
            Number(a.isFeatured) ||
          b.viewCount - a.viewCount ||
          b.createdAt - a.createdAt,
      );

    const safeItems =
      await Promise.all(
        items
          .slice(0, Math.min(limit ?? 8, 20))
          .map(async (property) => {
            const owner =
              await ownerSummaryOf(
                ctx,
                property.ownerId,
              );

            return toPublicProperty(
              property,
              owner,
            );
          }),
      );

    return safeItems;
  },
});

// ---------------------------------------------------------------------------
// Authenticated queries
// ---------------------------------------------------------------------------

export const myListings = query({
  args: {},

  handler: async (ctx) => {
    const userId =
      await getAuthUserId(ctx);

    if (userId === null) {
      return [];
    }

    const mine = await ctx.db
      .query("properties")
      .withIndex("by_owner", (q) =>
        q.eq("ownerId", userId),
      )
      .collect();

    return mine.sort(
      (a, b) =>
        b.createdAt - a.createdAt,
    );
  },
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function parsePropertyInput(
  input: unknown,
) {
  const parsed =
    propertyInputSchema.safeParse(input);

  if (!parsed.success) {
    const first =
      parsed.error.issues[0];

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
    const userId =
      await getAuthUserId(ctx);

    if (userId === null) {
      throw new Error(
        "Sign in to post a property",
      );
    }

    await rateLimiter.limit(
      ctx,
      "propertyCreate",
      {
        key: userId,
        throws: true,
      },
    );

    const me =
      await ctx.db.get(userId);

    if (!me) {
      throw new Error(
        "User account not found",
      );
    }

    if (me.isAnonymous === true) {
      throw new Error(
        "Guest accounts cannot post properties. Please sign in with email or phone first.",
      );
    }

    if (
      me.role !== ROLES.OWNER &&
      me.role !== ROLES.ADMIN
    ) {
      throw new Error(
        "Owner access is required to post a property.",
      );
    }

    const data =
      parsePropertyInput(input);

    await validatePropertyPhotos(
      ctx,
      data.photos,
    );

    const now = Date.now();

    const id =
      await ctx.db.insert(
        "properties",
        buildPropertyInsert(
          me,
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
  data: z.infer<
    typeof propertyInputSchema
  >,
  ownerId: Doc<"users">["_id"],
  now: number,
): Omit<
  Doc<"properties">,
  "_id" | "_creationTime"
> {
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

    isVerified:
      me?.isVerified ?? false,

    isFeatured: false,
    viewCount: 0,

    createdAt: now,
    updatedAt: now,
  };

  if (data.description) {
    insert.description =
      data.description;
  }

  if (data.latitude != null) {
    insert.latitude =
      data.latitude;
  }

  if (data.longitude != null) {
    insert.longitude =
      data.longitude;
  }

  if (data.bhk != null) {
    insert.bhk = data.bhk;
  }

  if (data.floor != null) {
    insert.floor = data.floor;
  }

  if (data.totalFloors != null) {
    insert.totalFloors =
      data.totalFloors;
  }

  if (data.ageOfProperty != null) {
    insert.ageOfProperty =
      data.ageOfProperty;
  }

  if (data.deposit != null) {
    insert.deposit =
      data.deposit;
  }

  if (data.maintenance != null) {
    insert.maintenance =
      data.maintenance;
  }

  if (data.videoUrl) {
    insert.videoUrl =
      data.videoUrl;
  }

  if (data.availableFrom != null) {
    insert.availableFrom =
      data.availableFrom;
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

  handler: async (
    ctx,
    { id, input },
  ) => {
    const userId =
      await getAuthUserId(ctx);

    if (userId === null) {
      throw new Error(
        "Sign in required",
      );
    }

    await rateLimiter.limit(
      ctx,
      "propertyUpdate",
      {
        key: userId,
        throws: true,
      },
    );

    const property =
      await ctx.db.get(id);

    if (!property) {
      throw new Error(
        "Listing not found",
      );
    }

    const me =
      await ctx.db.get(userId);

    const isOwner =
      property.ownerId === userId;

    const isAdmin =
      me?.role === ROLES.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new Error(
        "You can only edit your own listings",
      );
    }

    const data =
      parsePropertyInput(input);

    await validatePropertyPhotos(
      ctx,
      data.photos,
    );

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
      phoneNumber:
        data.phoneNumber,

      updatedAt: Date.now(),

      ...(data.description !==
        undefined && {
        description:
          data.description,
      }),

      ...(data.latitude !==
        undefined && {
        latitude:
          data.latitude,
      }),

      ...(data.longitude !==
        undefined && {
        longitude:
          data.longitude,
      }),

      ...(data.bhk !==
        undefined && {
        bhk: data.bhk,
      }),

      ...(data.floor !==
        undefined && {
        floor: data.floor,
      }),

      ...(data.totalFloors !==
        undefined && {
        totalFloors:
          data.totalFloors,
      }),

      ...(data.ageOfProperty !==
        undefined && {
        ageOfProperty:
          data.ageOfProperty,
      }),

      ...(data.deposit !==
        undefined && {
        deposit:
          data.deposit,
      }),

      ...(data.maintenance !==
        undefined && {
        maintenance:
          data.maintenance,
      }),

      ...(data.videoUrl !==
        undefined && {
        videoUrl:
          data.videoUrl,
      }),

      ...(data.availableFrom !==
        undefined && {
        availableFrom:
          data.availableFrom,
      }),
    };

    await ctx.db.patch(
      id,
      updatedData,
    );

    return {
      ok: true,
    };
  },
});

// ---------------------------------------------------------------------------
// Generate upload URL
// ---------------------------------------------------------------------------

export const generateUploadUrl =
  mutation({
    args: {},

    handler: async (ctx) => {
      const userId =
        await getAuthUserId(ctx);

      if (userId === null) {
        throw new Error(
          "Sign in required",
        );
      }

      const me =
        await ctx.db.get(userId);

      if (!me) {
        throw new Error(
          "User account not found",
        );
      }

      if (
        me.role !== ROLES.OWNER &&
        me.role !== ROLES.ADMIN
      ) {
        throw new Error(
          "Owner access is required to upload property images.",
        );
      }

      await rateLimiter.limit(
        ctx,
        "upload",
        {
          key: userId,
          throws: true,
        },
      );

      return await ctx.storage.generateUploadUrl();
    },
  });

// ---------------------------------------------------------------------------
// Increment view
// ---------------------------------------------------------------------------

export const incrementView =
  mutation({
    args: {
      id: v.id("properties"),
      visitorId: v.string(),
    },

    handler: async (
      ctx,
      { id, visitorId },
    ) => {
      const cleanVisitorId =
        visitorId.trim();

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      if (
        !uuidRegex.test(
          cleanVisitorId,
        )
      ) {
        return;
      }

      await rateLimiter.limit(
        ctx,
        "view",
        {
          key: cleanVisitorId,
          throws: true,
        },
      );

      const property =
        await ctx.db.get(id);

      if (
        !property ||
        property.status !== "live"
      ) {
        return;
      }

      const existingView =
        await ctx.db
          .query("propertyViews")
          .withIndex(
            "by_property_visitor",
            (q) =>
              q
                .eq(
                  "propertyId",
                  id,
                )
                .eq(
                  "visitorId",
                  cleanVisitorId,
                ),
          )
          .first();

      if (existingView) {
        return;
      }

      await ctx.db.insert(
        "propertyViews",
        {
          propertyId: id,
          visitorId:
            cleanVisitorId,
          createdAt:
            Date.now(),
        },
      );

      await ctx.db.patch(
        id,
        {
          viewCount:
            property.viewCount + 1,
          updatedAt:
            Date.now(),
        },
      );
    },
  });

// ---------------------------------------------------------------------------
// Delete property
// ---------------------------------------------------------------------------

export const deleteProperty =
  mutation({
    args: {
      id: v.id("properties"),
    },

    handler: async (
      ctx,
      { id },
    ) => {
      const userId =
        await getAuthUserId(ctx);

      if (userId === null) {
        throw new Error(
          "Sign in required",
        );
      }

      await rateLimiter.limit(
        ctx,
        "propertyDelete",
        {
          key: userId,
          throws: true,
        },
      );

      const property =
        await ctx.db.get(id);

      if (!property) {
        throw new Error(
          "Listing not found",
        );
      }

      const me =
        await ctx.db.get(userId);

      const isOwner =
        property.ownerId === userId;

      const isAdmin =
        me?.role === ROLES.ADMIN;

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