import { Phone } from "@convex-dev/auth/providers/Phone";
import axios from "axios";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

/**
 * Phone OTP provider — sign in with a 6-digit SMS verification code.
 *
 * Delivery:
 * - When TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER are
 *   configured (Keys/API keys tab), the code is sent as a real SMS via the
 *   Twilio Messages REST API.
 * - Otherwise the code is logged to the Convex console as a dev fallback so
 *   the flow stays testable without any SMS credentials.
 */
export const phoneOtp = Phone({
  id: "phone-otp",
  maxAge: 60 * 10, // 10 minutes
  // Normalize to a clean E.164-ish number. Bare 10-digit Indian numbers are
  // prefixed with +91; anything else must carry its own country code.
  normalizeIdentifier(identifier: string) {
    const trimmed = identifier.trim();
    if (trimmed.startsWith("+")) {
      return `+${trimmed.slice(1).replace(/\D/g, "")}`;
    }
    const digits = trimmed.replace(/\D/g, "");
    return digits.length === 10 ? `+91${digits}` : `+${digits}`;
  },
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes: Uint8Array) {
        crypto.getRandomValues(bytes);
      },
    };
    const alphabet = "0123456789";
    return generateRandomString(random, alphabet, 6);
  },
  async sendVerificationRequest({ identifier, token }) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    // Accept both the conventional Twilio name and the legacy name so the
    // key works whichever label the user pastes into the Keys tab.
    const fromNumber =
      process.env.TWILIO_PHONE_NUMBER ?? process.env.TWILIO_FROM_NUMBER;

    const message =
      `EstateDirect: your verification code is ${token}. ` +
      "It expires in 10 minutes. Do not share it with anyone.";

    if (accountSid && authToken && fromNumber) {
      try {
        await axios.post(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          new URLSearchParams({
            To: identifier,
            From: fromNumber,
            Body: message,
          }),
          {
            auth: { username: accountSid, password: authToken },
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          },
        );
      } catch (error) {
        throw new Error(JSON.stringify(error));
      }
    } else {
      // Dev fallback — no SMS provider configured yet.
      console.log(`[EstateDirect] OTP for ${identifier}: ${token}`);
    }
  },
});
