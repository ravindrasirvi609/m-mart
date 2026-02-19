"use client";

import { CheckCircle2, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendMagicLinkAction } from "@/actions/auth-actions";
import { isNativeApp } from "@/lib/mobile/capacitor";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const MOBILE_MAGIC_LINK_REDIRECT_URL = "mmart://auth";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getSafeNextPath(nextPath: string | null | undefined, fallback = "/") {
  if (!nextPath) {
    return fallback;
  }

  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return fallback;
  }

  return nextPath;
}

type LoginFormProps = {
  nextPath?: string;
  initialError?: string;
};

export function LoginForm({
  nextPath = "/",
  initialError,
}: LoginFormProps) {
  const safeNextPath = getSafeNextPath(nextPath);
  const [email, setEmail] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initialError) {
      return;
    }

    toast.error(initialError);
  }, [initialError]);

  const sendMagicLink = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      if (isNativeApp()) {
        const mobileRedirectUrl = new URL(MOBILE_MAGIC_LINK_REDIRECT_URL);
        mobileRedirectUrl.searchParams.set("next", safeNextPath);

        const supabase = createBrowserSupabaseClient();
        const { error } = await supabase.auth.signInWithOtp({
          email: normalizedEmail,
          options: {
            emailRedirectTo: mobileRedirectUrl.toString(),
          },
        });

        if (error) {
          toast.error(error.message);
          return;
        }
      } else {
        const result = await sendMagicLinkAction(normalizedEmail, safeNextPath);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
      }

      setEmail(normalizedEmail);
      setLinkSent(true);
      toast.success("Magic link sent. Check your email.");
    } finally {
      setLoading(false);
    }
  };

  if (linkSent) {
    return (
      <div className="premium-card mx-auto w-full max-w-md space-y-4 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 size={24} />
        </div>
        <h1 className="font-heading text-2xl font-bold">Check your email</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          We sent a magic link to <span className="font-semibold text-zinc-900 dark:text-zinc-100">{email}</span>.
        </p>
        <Button variant="outline" className="w-full" onClick={() => setLinkSent(false)}>
          Try another email
        </Button>
      </div>
    );
  }

  return (
    <div className="premium-card mx-auto w-full max-w-md space-y-4 p-6">
      <h1 className="font-heading text-2xl font-bold">Login to Mmart</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Secure one-tap login with email magic link.
      </p>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Email</span>
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
      </label>

      <Button disabled={loading || !email} className="w-full" onClick={sendMagicLink}>
        <Mail size={14} />
        {loading ? "Sending..." : "Send Magic Link"}
      </Button>
    </div>
  );
}
