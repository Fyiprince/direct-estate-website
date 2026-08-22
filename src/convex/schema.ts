import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// EstateDirect roles: owners list property, tenants/renters search,
// admins moderate. `member`/`user` legacy roles removed.
export const ROLES = {
  ADMIN: "admin",
  OWNER: "owner",
  TENANT: "tenant",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.OWNER),
  v.literal(ROLES.TENANT),
);
export type Role = Infer<typeof roleValidator>;

// --- Property enums (shared with the client via lib/property.ts) ---

export const PROPERTY_TYPES = [
  "flat",
  "house",
  "pg",
  "villa",
  "commercial",
] as const;

export const propertyTypeValidator = v.union(
  ...PROPERTY_TYPES.map((t) => v.literal(t)),
);
export type PropertyType = Infer<typeof propertyTypeValidator>;

export const LISTING_FOR = ["rent", "sale"] as const;

export const listingForValidator = v.union(
  ...LISTING_FOR.map((t) => v.literal(t)),
);
export type ListingFor = Infer<typeof listingForValidator>;

export const FURNISHING = [
  "furnished",
  "semi_furnished",
  "unfurnished",
] as const;

export const furnishingValidator = v.union(
  ...FURNISHING.map((t) => v.literal(t)),
);
export type Furnishing = Infer<typeof furnishingValidator>;

export const LISTING_STATUS = [
  "pending",
  "live",
  "rejected",
  "expired",
] as const;

export const listingStatusValidator = v.union(
  ...LISTING_STATUS.map((t) => v.literal(t)),
);
export type ListingStatus = Infer<typeof listingStatusValidator>;

export const SORT_OPTIONS = [
  "newest",
  "popular",
  "price_asc",
  "price_desc",
] as const;

export const sortValidator = v.union(
  ...SORT_OPTIONS.map((t) => v.literal(t)),
);

const schema = defineSchema(
  {
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      phone: v.optional(v.string()),
      phoneVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),

      role: v.optional(roleValidator),
      isVerified: v.optional(v.boolean()),
    })
      .index("email", ["email"])
      .index("phone", ["phone"]),

    properties: defineTable({
      ownerId: v.id("users"),
      title: v.string(),
      description: v.optional(v.string()),
      type: propertyTypeValidator,
      listingFor: listingForValidator,
      city: v.string(),
      locality: v.string(),
      address: v.string(),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
      bhk: v.optional(v.number()),
      areaSqft: v.number(),
      furnishing: furnishingValidator,
      floor: v.optional(v.number()),
      totalFloors: v.optional(v.number()),
      ageOfProperty: v.optional(v.number()),
      price: v.number(),
      deposit: v.optional(v.number()),
      maintenance: v.optional(v.number()),
      negotiable: v.boolean(),
      amenities: v.array(v.string()),
      photos: v.array(v.string()),
      videoUrl: v.optional(v.string()),

      // Required contact number for every property listing.
      // Stored separately from users.phone because a listing has
      // its own contact information.
      phoneNumber: v.string(),

      status: listingStatusValidator,
      isVerified: v.boolean(),
      isFeatured: v.boolean(),
      viewCount: v.number(),
      availableFrom: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_status", ["status"])
      .index("by_owner", ["ownerId"])
      .index("by_city_status", ["city", "status"])
      .index("by_type_status", ["type", "status"]),

    // Tracks unique property views per browser visitor.
    // Prevents the same visitor from repeatedly inflating
    // a property's view count.
    propertyViews: defineTable({
      propertyId: v.id("properties"),
      visitorId: v.string(),
      createdAt: v.number(),
    }).index("by_property_visitor", ["propertyId", "visitorId"]),

    inquiries: defineTable({
      propertyId: v.id("properties"),
      customerId: v.id("users"),

      name: v.string(),
      email: v.string(),
      phone: v.string(),
      message: v.string(),

      status: v.union(
        v.literal("new"),
        v.literal("contacted"),
        v.literal("closed"),
      ),

      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_property", ["propertyId"])
      .index("by_customer", ["customerId"])
      .index("by_status", ["status"]),
  },
  {
    schemaValidation: true,
  },
);

export default schema;