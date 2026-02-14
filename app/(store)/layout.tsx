import { MobileBottomNav } from "@/components/site/mobile-bottom-nav";
import { MainFooter } from "@/components/site/main-footer";
import { MainHeader } from "@/components/site/main-header";
import { PageFade } from "@/components/site/page-fade";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import { getCurrentUserNotifications } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const isAdmin = isAdminEmail(user?.email);
  const notifications = user
    ? await getCurrentUserNotifications({
        userId: user.id,
        isAdmin,
      })
    : [];

  return (
    <div className="flex min-h-screen flex-col">
      <MainHeader
        isAdmin={isAdmin}
        isLoggedIn={Boolean(user)}
        userId={user?.id ?? null}
        initialNotifications={notifications}
      />
      <main className="mobile-safe-padding mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <PageFade>{children}</PageFade>
      </main>
      <MainFooter />
      <MobileBottomNav />
    </div>
  );
}
