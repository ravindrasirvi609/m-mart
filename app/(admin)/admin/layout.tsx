import { requireAdmin } from "@/lib/auth";
import { getCurrentUserNotifications, getUserProfile } from "@/lib/queries";
import { AdminShell } from "@/components/admin/admin-shell";

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
    <AdminShell user={adminUser} notificationState={notificationState}>
      {children}
    </AdminShell>
  );
}
