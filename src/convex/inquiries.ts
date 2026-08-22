import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ROLES } from "./schema";
import { rateLimiter } from "./rateLimiter";

const inquiryStatusValidator = v.union(
  v.literal("new"),
  v.literal("contacted"),
  v.literal("closed"),
);

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function cleanName(value: string): string {
  const name = value.trim().replace(/\s+/g, " ");

  if (name.length < 2) {
    throw new Error("Name must be at least 2 characters");
  }

  if (name.length > 80) {
    throw new Error("Name must be under 80 characters");
  }

  return name;
}

function cleanEmail(value: string): string {
  const email = value.trim().toLowerCase();

  if (email.length > 254) {
    throw new Error("Email address is too long");
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    throw new Error("Enter a valid email address");
  }

  return email;
}

function cleanPhone(value: string): string {
  const phone = value.trim();

  if (phone.length < 10) {
    throw new Error("Phone number must be at least 10 digits");
  }

  if (phone.length > 15) {
    throw new Error("Phone number is too long");
  }

  if (!/^[0-9+()\s-]+$/.test(phone)) {
    throw new Error("Enter a valid phone number");
  }

  return phone;
}

function cleanMessage(value: string): string {
  const message = value.trim().replace(/\s+/g, " ");

  if (message.length < 5) {
    throw new Error("Message must be at least 5 characters");
  }

  if (message.length > 2000) {
    throw new Error("Message must be under 2000 characters");
  }

  return message;
}

// ---------------------------------------------------------------------------
// Create inquiry
// ---------------------------------------------------------------------------

/**
 * Customer sends an inquiry for a LIVE property.
 * The inquiry is stored for ADMIN use only.
 */
export const create = mutation({
  args: {
    propertyId: v.id("properties"),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    message: v.string(),
  },

  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      throw new Error("Please sign in to send an inquiry");
    }

    // Rate-limit authenticated users before processing requests.
    await rateLimiter.limit(ctx, "inquiry", {
      key: userId,
      throws: true,
    });

    // Verify property exists.
    const property = await ctx.db.get(args.propertyId);

    if (!property) {
      throw new Error("Property not found");
    }

    // Only live properties can receive inquiries.
    if (property.status !== "live") {
      throw new Error(
        "Inquiries are available only for live properties",
      );
    }

    // Server-side validation.
    const name = cleanName(args.name);
    const email = cleanEmail(args.email);
    const phone = cleanPhone(args.phone);
    const message = cleanMessage(args.message);

    const now = Date.now();

    const inquiryId = await ctx.db.insert("inquiries", {
      propertyId: args.propertyId,
      customerId: userId,

      name,
      email,
      phone,
      message,

      status: "new",

      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      inquiryId,
    };
  },
});

// ---------------------------------------------------------------------------
// Admin inquiry list
// ---------------------------------------------------------------------------

/**
 * Admin-only inquiry list.
 */
export const listForAdmin = query({
  args: {
    status: v.optional(inquiryStatusValidator),
  },

  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      throw new Error("Sign in required");
    }

    const admin = await ctx.db.get(userId);

    if (admin?.role !== ROLES.ADMIN) {
      throw new Error("Admin access required");
    }

    const inquiries = args.status
      ? await ctx.db
          .query("inquiries")
          .withIndex("by_status", (q) =>
            q.eq("status", args.status!),
          )
          .order("desc")
          .take(100)
      : await ctx.db
          .query("inquiries")
          .order("desc")
          .take(100);

    return await Promise.all(
      inquiries.map(async (inquiry) => {
        const property = await ctx.db.get(inquiry.propertyId);
        const customer = await ctx.db.get(inquiry.customerId);

        return {
          ...inquiry,

          property: property
            ? {
                _id: property._id,
                title: property.title,
                city: property.city,
                locality: property.locality,
                price: property.price,
              }
            : null,

          customer: customer
            ? {
                _id: customer._id,
                name: customer.name ?? inquiry.name,
                email: customer.email ?? inquiry.email,
              }
            : null,
        };
      }),
    );
  },
});

// ---------------------------------------------------------------------------
// Admin status update
// ---------------------------------------------------------------------------

/**
 * Admin-only inquiry status update.
 */
export const updateStatus = mutation({
  args: {
    id: v.id("inquiries"),
    status: inquiryStatusValidator,
  },

  handler: async (ctx, { id, status }) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      throw new Error("Sign in required");
    }

    const admin = await ctx.db.get(userId);

    if (admin?.role !== ROLES.ADMIN) {
      throw new Error("Admin access required");
    }

    const inquiry = await ctx.db.get(id);

    if (!inquiry) {
      throw new Error("Inquiry not found");
    }

    await ctx.db.patch(id, {
      status,
      updatedAt: Date.now(),
    });

    return {
      success: true,
    };
  },
});