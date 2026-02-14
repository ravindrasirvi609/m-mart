"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { upsertProfileAction } from "@/actions/user-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ProfileFormProps = {
  defaultName: string;
  defaultPhone: string;
  defaultAddress: string;
  email: string;
};

export function ProfileForm({
  defaultName,
  defaultPhone,
  defaultAddress,
  email,
}: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [address, setAddress] = useState(defaultAddress);

  return (
    <form
      className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      onSubmit={(event) => {
        event.preventDefault();

        const formData = new FormData();
        formData.append("name", name);
        formData.append("phone", phone);
        formData.append("address", address);

        startTransition(async () => {
          const result = await upsertProfileAction(formData);

          if (!result.ok) {
            toast.error(result.error);
            return;
          }

          toast.success("Profile updated.");
        });
      }}
    >
      <div className="space-y-1">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Email</p>
        <p className="rounded-xl bg-zinc-100 px-3 py-2 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          {email}
        </p>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Full Name</span>
        <Input required value={name} onChange={(event) => setName(event.target.value)} />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Phone</span>
        <Input required value={phone} onChange={(event) => setPhone(event.target.value)} />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Address</span>
        <Textarea
          required
          rows={4}
          value={address}
          onChange={(event) => setAddress(event.target.value)}
        />
      </label>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
}
