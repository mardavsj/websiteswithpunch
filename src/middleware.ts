import { withAuth } from "next-auth/middleware";

// Send signed-out visitors straight to our login page (not NextAuth's /api/auth/signin hop).
export default withAuth({ pages: { signIn: "/login" } });

export const config = {
  matcher: ["/dashboard/:path*"],
};
