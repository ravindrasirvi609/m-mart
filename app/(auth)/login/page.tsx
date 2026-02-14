import { LoginForm } from "@/components/auth/login-form";
import { STORE } from "@/lib/constants";

export const metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-6 px-4 py-10 sm:px-6">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e10600]">Welcome to</p>
        <h1 className="font-display text-4xl font-black brand-gradient-text">{STORE.name}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{STORE.location}</p>
      </div>

      <LoginForm />
    </main>
  );
}
