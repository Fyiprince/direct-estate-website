import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ROLES } from "./schema";

const inquiryStatusValidator = v.union(
  v.literal("new"),
  v.literal("contacted"),
  v.literal("closed"),
);

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

    const property = await ctx.db.get(args.propertyId);

    if (!property) {
      throw new Error("Property not found");
    }

    if (property.status !== "live") {
      throw new Error("Inquiries are available only for live properties");
    }

    if (!args.name.trim()) {
      throw new Error("Name is required");
    }

    if (!args.email.trim()) {
      throw new Error("Email is required");
    }

    if (!args.phone.trim()) {
      throw new Error("Phone number is required");
    }

    if (!args.message.trim()) {
      throw new Error("Message is required");
    }

    const now = Date.now();

    const inquiryId = await ctx.db.insert("inquiries", {
      propertyId: args.propertyId,
      customerId: userId,

      name: args.name.trim(),
      email: args.email.trim().toLowerCase(),
      phone: args.phone.trim(),
      message: args.message.trim(),

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

    let inquiries = args.status
      ? await ctx.db
          .query("inquiries")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .collect()
      : await ctx.db.query("inquiries").collect();

    inquiries.sort((a, b) => b.createdAt - a.createdAt);

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

/**
 * Admin-only status update.
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

    return { success: true };
  },
});