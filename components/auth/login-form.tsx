"use client";

import { CheckCircle2, Mail, Shield } from "lucide-react";
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

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

type LoginFormProps = {
  nextPath?: string;
  initialError?: string;
};

export function LoginForm({ nextPath = "/", initialError }: LoginFormProps) {
  const safeNextPath = getSafeNextPath(nextPath);
  const [email, setEmail] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!initialError) {
      return;
    }

    toast.error(initialError);
  }, [initialError]);

  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();

      const redirectTo = isNativeApp()
        ? `mmart://auth?next=${encodeURIComponent(safeNextPath)}`
        : `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNextPath)}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        toast.error(error.message);
        setGoogleLoading(false);
      }
      // If successful, the browser will redirect — no need to reset loading
    } catch {
      toast.error("Something went wrong. Please try again.");
      setGoogleLoading(false);
    }
  };

  const sendMagicLink = async (e?: React.FormEvent) => {
    e?.preventDefault();
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
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          We sent a magic link to{" "}
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {email}
          </span>
          .
        </p>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setLinkSent(false)}
        >
          Try another email
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      {/* Google OAuth */}
      <div className="premium-card space-y-4 p-6">
        <Button
          type="button"
          variant="outline"
          className="w-full gap-3 border-zinc-300 bg-white text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          disabled={googleLoading}
          onClick={signInWithGoogle}
        >
          <GoogleIcon />
          {googleLoading ? "Redirecting to Google..." : "Continue with Google"}
        </Button>
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200 dark:border-zinc-700" />
        </div>
        <span className="relative bg-white px-3 text-xs font-medium uppercase tracking-wider text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500">
          or
        </span>
      </div>

      {/* Magic Link */}
      <form onSubmit={sendMagicLink} className="premium-card space-y-4 p-6">
        <h2 className="font-heading text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Login with Email
        </h2>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Secure one-tap login with email magic link.
        </p>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Email
          </span>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </label>

        <p className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-300">
          <Shield size={13} />
          We only use your email for secure authentication.
        </p>

        <Button type="submit" disabled={loading || !email} className="w-full">
          <Mail size={14} />
          {loading ? "Sending..." : "Send Magic Link"}
        </Button>
      </form>
    </div>
  );
}
