import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isAdminEmail } from "./access";

/** Server pages: verified session whose email is in ADMIN_EMAILS, otherwise a plain 404. */
export async function requireAdmin() {
  const session = await getSession();
  const user = session?.user;
  if (!user?.id || user.verified === false || !isAdminEmail(user.email)) notFound();
  return user;
}

/** Same rule for API routes: returns the admin, or null (answer 404). */
export async function adminOrNull() {
  const session = await getSession();
  const user = session?.user;
  if (!user?.id || user.verified === false || !isAdminEmail(user.email)) return null;
  return user;
}
