import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/ProfileForm";
import { AlertPrefs } from "@/components/alerts/AlertPrefs";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, alertDown: true, alertSsl: true, alertDomain: true },
  });
  if (!user) redirect("/login");

  // Centred between the navbar and the footer (SiteChrome makes <main> a flex column).
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 items-center [align-items:safe_center] px-4 py-10 sm:px-6">
      <div className="w-full">
        <h1 className="font-display text-2xl font-medium text-ink">Profile</h1>
        <p className="mt-1 text-sm text-muted">Your account details and email alerts.</p>
        {/* Profile card left, alerts right on desktop; stacked on mobile. Equal heights via stretch. */}
        <div className="mt-6 grid max-w-4xl gap-6 md:grid-cols-2">
          <ProfileForm initialName={user.name || ""} email={user.email} />
          <AlertPrefs
            email={user.email}
            initial={{ alertDown: user.alertDown, alertSsl: user.alertSsl, alertDomain: user.alertDomain }}
          />
        </div>
      </div>
    </div>
  );
}
