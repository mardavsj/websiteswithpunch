import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });
  if (!user) redirect("/login");

  // Fills the viewport below the navbar (no footer, see SiteChrome), content centred.
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 items-center [align-items:safe_center] px-4 py-10 sm:px-6">
      <div className="w-full">
        <h1 className="font-display text-2xl font-medium text-ink">Profile</h1>
        <p className="mt-1 text-sm text-muted">Your account details.</p>
        <ProfileForm initialName={user.name || ""} email={user.email} />
      </div>
    </div>
  );
}
