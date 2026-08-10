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
export const sortValidator = v.union(...SORT_OPTIONS.map((t) => v.literal(t)));

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // OWNER | TENANT | ADMIN. do not remove
      phone: v.optional(v.string()), // contact number, masked in all API responses
      isVerified: v.optional(v.boolean()), // identity-verified owner badge
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // Property listings — one row per listed property.
    properties: defineTable({
      ownerId: v.id("users"),
      title: v.string(),
      description: v.optional(v.string()),
      type: propertyTypeValidator, // flat | house | pg | villa | commercial
      listingFor: listingForValidator, // rent | sale
      city: v.string(),
      locality: v.string(),
      address: v.string(),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
      bhk: v.optional(v.number()), // bedrooms, n/a for pg/commercial
      areaSqft: v.number(),
      furnishing: furnishingValidator,
      floor: v.optional(v.number()),
      totalFloors: v.optional(v.number()),
      ageOfProperty: v.optional(v.number()), // years
      price: v.number(), // monthly rent (rent) or total price (sale), in rupees
      deposit: v.optional(v.number()), // rent only
      maintenance: v.optional(v.number()), // rent only, monthly
      negotiable: v.boolean(),
      amenities: v.array(v.string()),
      photos: v.array(v.string()), // Convex storage ids or external URLs
      videoUrl: v.optional(v.string()),
      status: listingStatusValidator, // pending | live | rejected | expired
      isVerified: v.boolean(), // owner identity verified
      isFeatured: v.boolean(),
      viewCount: v.number(),
      availableFrom: v.optional(v.number()), // epoch ms
      createdAt: v.number(), // epoch ms
      updatedAt: v.number(), // epoch ms
    })
      .index("by_status", ["status"])
      .index("by_owner", ["ownerId"])
      .index("by_city_status", ["city", "status"])
      .index("by_type_status", ["type", "status"]),

    // add other tables here
  },
  {
    schemaValidation: false,
  },
);

export default schema;
