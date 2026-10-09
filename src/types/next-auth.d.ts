import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      plan: string;
      dodoStatus: string | null;
      /** false until the email code is confirmed (see lib/email-verify.ts). */
      verified: boolean;
    };
  }

  interface User {
    plan?: string;
    dodoStatus?: string | null;
    verified?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    /** Email verified. Missing on tokens issued before verification existed. */
    ev?: boolean;
    plan?: string;
    dodoStatus?: string | null;
  }
}
