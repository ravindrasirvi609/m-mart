import { requireAdmin } from "@/lib/auth";
import { getCurrentUserNotifications, getUserProfile } from "@/lib/queries";
import { Sidebar } from "@/components/admin/sidebar";
import { Navbar } from "@/components/admin/navbar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  const [profile, notificationState] = await Promise.all([
    getUserProfile(user.id),
    getCurrentUserNotifications({
      userId: user.id,
      isAdmin: true,
    }),
  ]);

  const adminUser = {
    id: user.id,
    email: user.email!,
    name: profile?.name || user.email?.split("@")[0],
  };

  return (
    <div className="flex min-h-screen bg-dashboard text-text-main antialiased dark">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Navbar user={adminUser} notificationState={notificationState} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl animate-page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
