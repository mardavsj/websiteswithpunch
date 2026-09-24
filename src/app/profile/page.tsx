import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-medium text-ink">Profile</h1>
      <p className="mt-1 text-sm text-muted">Your account details.</p>
      <ProfileForm initialName={user.name || ""} email={user.email} />
    </div>
  );
}
