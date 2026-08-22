import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { ROLES, roleValidator } from "./schema";

/**
 * Promote the signed-in user to ADMIN only if their email
 * is present in the ESTATEDIRECT_ADMIN_EMAIL allowlist.
 */
export const claimAdmin = mutation({
  args: {},

  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      throw new Error("Sign in required");
    }

    const me = await ctx.db.get(userId);

    if (!me) {
      throw new Error("User account not found");
    }

    // Anonymous accounts can never become admins.
    if (me.isAnonymous === true) {
      throw new Error(
        "Anonymous accounts cannot claim admin access",
      );
    }

    const email = me.email?.trim().toLowerCase();

    if (!email) {
      throw new Error(
        "Sign in with an email address to claim admin access",
      );
    }

    const adminEmailEnv =
      process.env.ESTATEDIRECT_ADMIN_EMAIL;

    if (!adminEmailEnv) {
      throw new Error(
        "Admin access is not configured. Set ESTATEDIRECT_ADMIN_EMAIL in the Convex environment variables.",
      );
    }

    const allowlist = adminEmailEnv
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (!allowlist.includes(email)) {
      throw new Error(
        "This email is not in the admin allowlist.",
      );
    }

    await ctx.db.patch(userId, {
      role: ROLES.ADMIN,
    });

    return {
      role: ROLES.ADMIN,
    };
  },
});

/**
 * Set the account role during onboarding.
 *
 * Normal users may select OWNER or TENANT.
 * ADMIN can only be provisioned through claimAdmin.
 */
export const setRole = mutation({
  args: {
    role: roleValidator,
  },

  handler: async (ctx, { role }) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      throw new Error("Sign in required");
    }

    const me = await ctx.db.get(userId);

    if (!me) {
      throw new Error("User account not found");
    }

    // Anonymous accounts must not be able to obtain
    // an owner/tenant role.
    if (me.isAnonymous === true) {
      throw new Error(
        "Anonymous accounts cannot select an account role",
      );
    }

    // ADMIN can never be assigned through this endpoint.
    if (role === ROLES.ADMIN) {
      throw new Error(
        "Admins are provisioned by EstateDirect",
      );
    }

    // Existing admins cannot be downgraded through
    // the normal onboarding endpoint.
    if (me.role === ROLES.ADMIN) {
      throw new Error(
        "Admin accounts cannot change their role here",
      );
    }

    await ctx.db.patch(userId, {
      role,
    });

    return {
      role,
    };
  },
});

/**
 * Capture/update the user's contact number.
 */
export const setPhone = mutation({
  args: {
    phone: v.string(),
  },

  handler: async (ctx, { phone }) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      throw new Error("Sign in required");
    }

    const me = await ctx.db.get(userId);

    if (!me) {
      throw new Error("User account not found");
    }

    if (me.isAnonymous === true) {
      throw new Error(
        "Anonymous accounts cannot set a phone number",
      );
    }

    const digits = phone.replace(/\D/g, "");

    if (digits.length < 10 || digits.length > 15) {
      throw new Error("Enter a valid phone number");
    }

    const formattedPhone = `+${digits}`;

    await ctx.db.patch(userId, {
      phone: formattedPhone,
    });

    return {
      phone: formattedPhone,
    };
  },
});