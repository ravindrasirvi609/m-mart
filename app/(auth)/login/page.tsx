import { LoginForm } from "@/components/auth/login-form";
import { STORE } from "@/lib/constants";

export const metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-6 px-4 py-10 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{STORE.name}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{STORE.location}</p>
      </div>

      <LoginForm />
    </main>
  );
}
