"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/Toast";

export function ProfileForm({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const router = useRouter();
  const { update } = useSession();
  const { toast } = useToast();
  const [name, setName] = useState(initialName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, string> = {};
      if (name.trim() !== initialName) body.name = name.trim();
      if (newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }
      if (!Object.keys(body).length) {
        setError("Nothing to update.");
        return;
      }
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save.");
        toast(data.error || "Could not save.", "error");
        return;
      }
      toast("Profile updated.", "success");
      setCurrentPassword("");
      setNewPassword("");
      await update();
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 max-w-md space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink">Email</label>
        <p className="mt-1 text-sm text-muted">{email}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-ink" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full border border-rule bg-bg px-3 py-2 text-sm"
        />
      </div>
      <div className="border-t border-rule pt-4">
        <p className="text-sm font-medium text-ink">Change password</p>
        <p className="mt-1 text-xs text-muted">Leave blank to keep your current password.</p>
        <label className="mt-3 block text-sm text-muted" htmlFor="current">
          Current password
        </label>
        <input
          id="current"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="mt-1 w-full border border-rule bg-bg px-3 py-2 text-sm"
        />
        <label className="mt-3 block text-sm text-muted" htmlFor="new">
          New password
        </label>
        <input
          id="new"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={8}
          className="mt-1 w-full border border-rule bg-bg px-3 py-2 text-sm"
        />
      </div>
      {error && <p className="text-sm text-rose-700">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="rounded-none bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
