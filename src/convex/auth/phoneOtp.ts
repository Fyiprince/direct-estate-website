import { Phone } from "@convex-dev/auth/providers/Phone";
import axios from "axios";
import {
  RandomReader,
  generateRandomString,
} from "@oslojs/crypto/random";

export const phoneOtp = Phone({
  id: "phone-otp",

  maxAge: 60 * 10,

  normalizeIdentifier(identifier: string) {
    const trimmed = identifier.trim();

    if (trimmed.startsWith("+")) {
      const digits = trimmed.slice(1).replace(/\D/g, "");

      if (!digits) {
        throw new Error("Invalid phone number");
      }

      return `+${digits}`;
    }

    const digits = trimmed.replace(/\D/g, "");

    if (digits.length === 10) {
      return `+91${digits}`;
    }

    if (digits.length < 10 || digits.length > 15) {
      throw new Error("Invalid phone number");
    }

    return `+${digits}`;
  },

  async generateVerificationToken() {
  const random: RandomReader = {
    read(bytes) {
      crypto.getRandomValues(
        bytes as unknown as Uint8Array<ArrayBuffer>,
      );
    },
  };

  return generateRandomString(
    random,
    "0123456789",
    6,
  );
},

  async sendVerificationRequest({
    identifier,
    token,
  }) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    const fromNumber =
      process.env.TWILIO_PHONE_NUMBER ??
      process.env.TWILIO_FROM_NUMBER;

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
            auth: {
              username: accountSid,
              password: authToken,
            },
            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded",
            },
          },
        );
      } catch (error) {
        console.error(
          "[EstateDirect] SMS delivery failed",
          error,
        );

        throw new Error(
          "Failed to send verification SMS",
        );
      }

      return;
    }

    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SMS service is not configured",
      );
    }

    console.log(
      `[EstateDirect DEV] OTP generated for ${identifier}`,
    );
  },
});