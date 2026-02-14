import { ProfileForm } from "@/components/store/profile-form";
import { requireUser } from "@/lib/auth";
import { getUserProfile } from "@/lib/queries";

export const metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await getUserProfile(user.id);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">My Profile</h1>
      <ProfileForm
        email={user.email || ""}
        defaultName={profile?.name || ""}
        defaultPhone={profile?.phone || ""}
        defaultAddress={profile?.address || ""}
      />
    </div>
  );
}
