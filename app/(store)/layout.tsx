import { MainFooter } from "@/components/site/main-footer";
import { MainHeader } from "@/components/site/main-header";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <MainHeader isAdmin={isAdminEmail(user?.email)} isLoggedIn={Boolean(user)} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
      <MainFooter />
    </div>
  );
}
