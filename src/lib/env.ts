import "server-only";

/** Server-side configuration. Optional integrations report whether they are configured. */
export const env = {
  appUrl: (process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  sessionSecret: process.env.SESSION_SECRET ?? "",
  isProd: process.env.NODE_ENV === "production",
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    get enabled() {
      return Boolean(this.clientId && this.clientSecret);
    },
  },
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY ?? "",
    currency: process.env.PAYMENT_CURRENCY ?? "NGN",
    get enabled() {
      return Boolean(this.secretKey);
    },
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY ?? "",
    from: process.env.EMAIL_FROM ?? "VELORA <no-reply@velora.example>",
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
    get enabled() {
      return Boolean(this.cloudName && this.apiKey && this.apiSecret);
    },
  },
};

if (env.isProd && env.sessionSecret.length < 32) {
  console.warn("[velora] SESSION_SECRET is missing or too short. Set a 32+ character secret.");
}
