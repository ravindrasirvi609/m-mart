import { MobileBottomNav } from "@/components/site/mobile-bottom-nav";
import { MainFooter } from "@/components/site/main-footer";
import { MainHeader } from "@/components/site/main-header";
import { PageFade } from "@/components/site/page-fade";
import { getCurrentUser, checkIsAdmin } from "@/lib/auth";
import { getUserLocation } from "@/lib/location";
import { getCurrentUserNotifications } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const isAdmin = await checkIsAdmin(user?.email);
  const [notificationState, userLocation] = await Promise.all([
    user
      ? getCurrentUserNotifications({
          userId: user.id,
          isAdmin,
        })
      : Promise.resolve({ items: [], notificationsAvailable: false }),
    getUserLocation(user?.id),
  ]);

  return (
    <div className="store-grid-bg relative flex min-h-screen flex-col">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#ff7a51]/20 blur-3xl" />
        <div className="absolute -right-20 top-44 h-80 w-80 rounded-full bg-[#d61912]/18 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#f59e0b]/10 blur-3xl" />
      </div>

      <MainHeader
        isAdmin={isAdmin}
        isLoggedIn={Boolean(user)}
        userId={user?.id ?? null}
        initialNotifications={notificationState.items}
        notificationsAvailable={notificationState.notificationsAvailable}
        deliveryArea={userLocation.area}
        deliveryCity={userLocation.city}
      />

      <main className="mobile-safe-padding mx-auto w-full max-w-[1180px] flex-1 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <PageFade>{children}</PageFade>
      </main>

      <MainFooter />
      <MobileBottomNav />
    </div>
  );
}
