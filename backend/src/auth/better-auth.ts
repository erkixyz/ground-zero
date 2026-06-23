import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import * as nodemailer from "nodemailer";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

// Scrypt with Node.js defaults (N:16384, r:8, p:1) — matches existing DB hashes
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(hash: string, password: string): boolean {
  const parts = hash.split(":");
  if (parts.length !== 2) return false;
  const [salt, stored] = parts;
  try {
    const derived = scryptSync(password, salt, 64);
    return timingSafeEqual(Buffer.from(stored, "hex"), derived);
  } catch {
    return false;
  }
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || "localhost",
    port: Number(process.env.MAIL_PORT || 1025),
    secure: process.env.MAIL_SECURE === "true",
    auth: process.env.MAIL_USER
      ? { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
      : undefined,
  });
}

export const auth = betterAuth({
  appName: "Ground Zero",
  baseURL: process.env.BETTER_AUTH_URL || process.env.APP_URL?.replace(/:\d+$/, ":3001") || "http://localhost:3001",
  basePath: "/api/auth",
  secret: process.env.SESSION_SECRET || process.env.BETTER_AUTH_SECRET,

  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 6,
    password: {
      hash: async (password) => hashPassword(password),
      verify: async ({ hash, password }) => verifyPassword(hash, password),
    },
    sendResetPassword: async ({ user, url, token }) => {
      const appUrl = process.env.APP_URL || "http://localhost:3000";
      const backendUrl = process.env.BETTER_AUTH_URL || "http://localhost:3001";
      // Redirect token to frontend reset-password page
      const resetUrl = `${appUrl}/reset-password?token=${token}`;
      const mailer = createTransporter();
      await mailer.sendMail({
        from: process.env.MAIL_FROM || "noreply@localhost",
        to: user.email,
        subject: "Parooli lähtestamine — Ground Zero",
        html: `
          <p>Tere,</p>
          <p>Klõpsa allolevale lingile oma parooli lähtestamiseks:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>Link kehtib 1 tund. Kui sa seda ei taotlenud, ignoreeri seda kirja.</p>
        `,
      });
    },
  },

  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        socialProviders: {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            prompt: "select_account",
          },
        },
      }
    : {}),

  user: {
    additionalFields: {
      firstName: { type: "string", required: false, defaultValue: "" },
      lastName: { type: "string", required: false, defaultValue: "" },
    },
  },

  trustedOrigins: [process.env.CORS_ORIGIN || "http://localhost:3000"],

  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "gz",
  },
});
