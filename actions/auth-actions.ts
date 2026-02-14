"use server";

import { Resend } from "resend";
import { headers } from "next/headers";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getServerEnv } from "@/lib/env";

export async function sendMagicLinkAction(email: string) {
    try {
        const env = getServerEnv();
        if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
            return { ok: false, error: "Resend is not configured." };
        }

        const supabase = createAdminSupabaseClient();
        const resend = new Resend(env.RESEND_API_KEY);
        const host = (await headers()).get("host");
        const protocol = host?.includes("localhost") ? "http" : "https";
        const origin = `${protocol}://${host}`;

        const { data, error } = await supabase.auth.admin.generateLink({
            type: "magiclink",
            email,
        });

        if (error) {
            console.error("Supabase generateLink error:", error.message);
            return { ok: false, error: error.message };
        }

        const callbackUrl = new URL(`${origin}/auth/callback`);
        callbackUrl.searchParams.set("token_hash", data.properties.hashed_token);
        callbackUrl.searchParams.set("type", "magiclink");
        callbackUrl.searchParams.set("next", "/");

        const { error: resendError } = await resend.emails.send({
            from: env.RESEND_FROM_EMAIL,
            to: email,
            subject: "Your Mmart Magic Link",
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #111827;">Login to Mmart</h2>
          <p style="color: #4b5563; line-height: 1.5;">Click the button below to sign in to your Mmart account. This link will expire in 1 hour.</p>
          <div style="margin: 30px 0;">
            <a href="${callbackUrl.toString()}" 
               style="background-color: #111827; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
               Sign In to Mmart
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 14px;">If you didn't request this email, you can safely ignore it.</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #9ca3af; font-size: 12px;">Mmart - Premium Shopping Experience</p>
        </div>
      `,
        });

        if (resendError) {
            console.error("Resend error:", resendError);
            return { ok: false, error: "Failed to send email. Please try again later." };
        }

        console.log(`Magic link successfully sent to ${email}`);
        return { ok: true };
    } catch (err) {
        console.error("Magic link action error:", err);
        return { ok: false, error: "An unexpected error occurred." };
    }
}
