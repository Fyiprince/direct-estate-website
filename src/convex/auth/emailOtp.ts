import { Email } from "@convex-dev/auth/providers/Email";
import {
  RandomReader,
  generateRandomString,
} from "@oslojs/crypto/random";

export const emailOtp = Email({
  id: "email-otp",

  maxAge: 60 * 15,

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
    identifier: email,
    token,
  }) {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.error(
        "[EstateDirect] RESEND_API_KEY is not configured",
      );

      throw new Error(
        "Email service is not configured",
      );
    }

    const response = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },

        body: JSON.stringify({
          from: "EstateDirect <noreply@hansdaworld.com>",
          to: [email],
          subject: "Your EstateDirect Login OTP",

          html: `
            <div style="
              font-family: Arial, sans-serif;
              max-width: 500px;
              margin: 40px auto;
              padding: 30px;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
            ">
              <h2 style="color: #172A46;">
                EstateDirect
              </h2>

              <p>Your login verification code is:</p>

              <div style="
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 8px;
                margin: 24px 0;
                padding: 15px;
                background: #f3f4f6;
                text-align: center;
                border-radius: 8px;
              ">
                ${token}
              </div>

              <p>
                This OTP is valid for
                <strong>15 minutes</strong>.
              </p>

              <p>
                If you did not request this code,
                you can safely ignore this email.
              </p>

              <hr style="
                border: 0;
                border-top: 1px solid #e5e7eb;
              " />

              <p style="
                color: #666;
                font-size: 12px;
              ">
                EstateDirect — Direct Property Marketplace
              </p>
            </div>
          `,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();

      console.error(
        "[EstateDirect] Resend email failed:",
        error,
      );

      throw new Error(
        "Failed to send verification email",
      );
    }

    console.log(
      `[EstateDirect] Verification email sent to ${email}`,
    );
  },
});