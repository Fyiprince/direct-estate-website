import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { ROLES, roleValidator } from "./schema";

/**
 * Promote the signed-in user to ADMIN if their email is in the
 * ESTATEDIRECT_ADMIN_EMAIL allowlist (comma-separated).
 * Admins are never self-assigned without the env gate.
 */
export const claimAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in required");

    const me = await ctx.db.get(userId);
    const email = me?.email?.trim().toLowerCase();
    if (!email) {
      throw new Error("Sign in with an email address to claim admin access");
    }

    // Allowlist comes from the ESTATEDIRECT_ADMIN_EMAIL env var (set in the
    // Keys/API keys tab), and falls back to the project owner's admin email
    // so admin sign-in works out of the box.
    const allowlist = (process.env.ESTATEDIRECT_ADMIN_EMAIL ?? "metaloomart@gmail.com")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (!allowlist.includes(email)) {
      throw new Error(
        "This email is not in the admin allowlist (ESTATEDIRECT_ADMIN_EMAIL).",
      );
    }

    await ctx.db.patch(userId, { role: ROLES.ADMIN });
    return { role: ROLES.ADMIN };
  },
});

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
