import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { ROLES, roleValidator } from "./schema";

/** Set the account role during onboarding (picked once, can be upgraded later). */
export const setRole = mutation({
  args: { role: roleValidator },
  handler: async (ctx, { role }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in required");

    if (role === ROLES.ADMIN) throw new Error("Admins are provisioned by EstateDirect");

    const me = await ctx.db.get(userId);
    // Downgrades are not allowed — a renter-turned-owner stays an owner.
    if (me?.role === ROLES.OWNER && role === ROLES.TENANT) {
      throw new Error("Owner accounts can't be downgraded to renter");
    }

    await ctx.db.patch(userId, { role });
    return { role };
  },
});

/** Capture/update the verified contact number shown (masked) to renters. */
export const setPhone = mutation({
  args: { phone: v.string() },
  handler: async (ctx, { phone }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in required");

    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) {
      throw new Error("Enter a valid phone number");
    }

    await ctx.db.patch(userId, { phone: `+${digits}` });
    return { phone: `+${digits}` };
  },
});
