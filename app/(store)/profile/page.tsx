import { ProfileForm } from "@/components/store/profile-form";
import { Reveal } from "@/components/ui/reveal";
import { requireUser } from "@/lib/auth";
import { getUserProfile } from "@/lib/queries";

export const metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const user = await requireUser("/profile");
  const profile = await getUserProfile(user.id);

  return (
    <div className="space-y-5">
      <Reveal>
        <section className="premium-card soft-red-panel p-5 sm:p-6">
          <h1 className="font-display text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">My Profile</h1>
          <p className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Keep contact details updated for faster checkout.
          </p>
        </section>
      </Reveal>
      <ProfileForm
        email={user.email || ""}
        defaultName={profile?.name || ""}
        defaultPhone={profile?.phone || ""}
        defaultAddress={profile?.address || ""}
      />
    </div>
  );
}
