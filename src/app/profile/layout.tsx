import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  return <>{children}</>;
}
