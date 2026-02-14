import { ProfileForm } from "@/components/store/profile-form";
import { Reveal } from "@/components/ui/reveal";
import { requireUser } from "@/lib/auth";
import { getUserProfile } from "@/lib/queries";

export const metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await getUserProfile(user.id);

  return (
    <div className="space-y-5">
      <Reveal>
        <section className="premium-card soft-red-panel p-5">
          <h1 className="font-display text-3xl font-black tracking-tight">My Profile</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Keep your phone and address updated for faster checkout.
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
