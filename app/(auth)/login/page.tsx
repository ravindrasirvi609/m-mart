import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { STORE } from "@/lib/constants";
import { checkIsAdmin, getCurrentUser } from "@/lib/auth";

export const metadata = {
  title: "Login",
};

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getSafeNextPath(nextPath: string | undefined, fallback = "/") {
  if (!nextPath) {
    return fallback;
  }

  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return fallback;
  }

  if (
    nextPath === "/login" ||
    nextPath.startsWith("/login?") ||
    nextPath.startsWith("/auth/callback")
  ) {
    return fallback;
  }

  return nextPath;
}

export default async function LoginPage(props: {
  searchParams: Promise<{
    next?: string | string[];
    error?: string | string[];
  }>;
}) {
  const searchParams = await props.searchParams;
  const nextPath = getSafeNextPath(getParamValue(searchParams.next));
  const initialError = getParamValue(searchParams.error);
  const user = await getCurrentUser();

  if (user) {
    const isAdmin = await checkIsAdmin(user.email);
    const destination = nextPath === "/" && isAdmin ? "/admin" : nextPath;
    redirect(destination);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-6 px-4 py-10 sm:px-6">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e10600]">Welcome to</p>
        <h1 className="font-display text-4xl font-black brand-gradient-text">{STORE.name}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{STORE.location}</p>
      </div>

      <LoginForm nextPath={nextPath} initialError={initialError} />
    </main>
  );
}
