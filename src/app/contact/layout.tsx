import { getSession } from "@/lib/auth";
import { Footer } from "@/components/Footer";
import { AppFooter } from "@/components/AppFooter";

/**
 * /contact draws its own main area and footer (SiteChrome passes it through): the session is
 * read here on the server (a cookie decode, no DB), so signed-in visitors get the slim footer and
 * signed-out visitors the big one on first paint, and the centred content never jumps.
 */
export default async function ContactLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <>
      <main className="flex flex-1 flex-col">{children}</main>
      {session?.user ? <AppFooter /> : <Footer />}
    </>
  );
}
