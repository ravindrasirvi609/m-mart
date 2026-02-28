import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_BASE_URL: z
    .string()
    .url()
    .optional()
    .default("https://mmart4u.com"),
  NEXT_PUBLIC_UPI_ID: z.string().min(3).optional(),
  NEXT_PUBLIC_DEEP_LINK_SCHEME: z.string().min(2).optional().default("mmart"),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1).optional(),
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.email().optional(),
  ADMIN_EMAIL: z.email(),
  VAPID_PRIVATE_KEY: z.string().min(1).optional(),
  VAPID_SUBJECT: z.string().min(1).optional(),
});

export function getPublicEnv() {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_UPI_ID: process.env.NEXT_PUBLIC_UPI_ID,
    NEXT_PUBLIC_DEEP_LINK_SCHEME: process.env.NEXT_PUBLIC_DEEP_LINK_SCHEME,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  });
}

export function getServerEnv() {
  return serverEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_UPI_ID: process.env.NEXT_PUBLIC_UPI_ID,
    NEXT_PUBLIC_DEEP_LINK_SCHEME: process.env.NEXT_PUBLIC_DEEP_LINK_SCHEME,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
    VAPID_SUBJECT: process.env.VAPID_SUBJECT,
  });
}
