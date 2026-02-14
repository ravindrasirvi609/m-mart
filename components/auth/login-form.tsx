"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setOtpSent(true);
    toast.success("OTP sent. Check your email.");
  };

  const verifyOtp = async () => {
    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Logged in successfully.");
    router.replace("/");
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Login to Mmart</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Use Email OTP to sign in. You can also use the magic link from the same email.
      </p>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</span>
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
      </label>

      {!otpSent ? (
        <Button disabled={loading || !email} className="w-full" onClick={sendOtp}>
          {loading ? "Sending..." : "Send OTP"}
        </Button>
      ) : (
        <>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">OTP</span>
            <Input
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              placeholder="Enter OTP"
            />
          </label>

          <Button disabled={loading || !otp} className="w-full" onClick={verifyOtp}>
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>

          <Button variant="ghost" disabled={loading} className="w-full" onClick={sendOtp}>
            Resend OTP
          </Button>
        </>
      )}
    </div>
  );
}
