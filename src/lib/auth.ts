import { NextAuthOptions, getServerSession, type Session, type User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { MINUTE, clientIp, rateLimit } from "./rate-limit";
import { isVerified, issueCode } from "./email-verify";

/** Compared against when the email has no account, so both paths take the same time. */
const DUMMY_HASH = "$2b$12$r09sNKkp7.i.ZP17a.00aOrsxPh.E3qm/BMw3EiFd6gOb4r09khuO";
/** Login error code the form shows as "too many attempts". */
export const LOGIN_RATE_LIMITED = "RATE_LIMITED";
const SESSION_MAX_AGE = 14 * 24 * 60 * 60; // 14 days

if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET) {
  console.error("[auth] NEXTAUTH_SECRET is not set; sessions cannot be signed.");
}

function withUser(token: JWT, user: User): JWT {
  token.id = user.id;
  token.plan = user.plan || "free";
  token.stripeStatus = user.stripeStatus;
  token.ev = user.verified !== false;
  return token;
}

function session({ session, token }: { session: Session; token: JWT }): Session {
  if (session.user) {
    session.user.id = token.id as string;
    session.user.plan = (token.plan as string) || "free";
    session.user.stripeStatus = (token.stripeStatus as string | null) || null;
    // Sessions from before verification existed carry no flag; those users all predate it.
    session.user.verified = token.ev !== false;
  }
  return session;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE, updateAge: 24 * 60 * 60 },
  jwt: { maxAge: SESSION_MAX_AGE },
  // Secure, __Secure- prefixed cookies whenever the site runs on https (production).
  useSecureCookies: (process.env.NEXTAUTH_URL || "").startsWith("https://"),
  debug: false,
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const email = String(credentials?.email ?? "").toLowerCase().trim().slice(0, 254);
        const password = String(credentials?.password ?? "").slice(0, 200);
        if (!email || !password) return null;
        // Brute-force protection: per address and per IP (shared across instances via Postgres).
        const ip = clientIp({ headers: (req?.headers ?? {}) as Record<string, unknown> });
        const limited = await rateLimit([
          { key: `login:email:${email}`, limit: 10, windowMs: 15 * MINUTE },
          { key: `login:ip:${ip}`, limit: 30, windowMs: 15 * MINUTE },
        ]);
        if (!limited.ok) throw new Error(LOGIN_RATE_LIMITED);
        const user = await prisma.user.findUnique({ where: { email } });
        // Same generic failure (and same bcrypt cost) whether or not the account exists.
        const valid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
        if (!user || !valid) return null;
        const verified = isVerified(user);
        if (verified && !user.emailVerified) {
          // Pre-feature account: record it as verified (from its signup date).
          await prisma.user.update({ where: { id: user.id }, data: { emailVerified: user.createdAt } });
        } else if (!verified) {
          // Unverified: send a fresh code (skipped inside the resend cooldown / rate limits).
          await issueCode(user, ip).catch((e) => console.warn("[verify] login code failed", e));
        }
        return {
          verified,
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
          stripeStatus: user.stripeStatus,
        };
      },
    }),
  ],
  callbacks: {
    /**
     * Runs for the /api/auth/* routes (sign-in, the client's session fetch, update()). It re-reads
     * plan/name from the DB so the navbar sees upgrades; server renders use readOnlyOptions below.
     */
    async jwt({ token, user }) {
      if (user) return withUser(token, user);
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { plan: true, stripeStatus: true, name: true, email: true, emailVerified: true, createdAt: true },
        });
        if (dbUser) {
          token.ev = isVerified(dbUser);
          token.plan = dbUser.plan;
          token.stripeStatus = dbUser.stripeStatus;
          token.name = dbUser.name;
          token.email = dbUser.email;
        }
      }
      return token;
    },
    session,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * Server components and API routes only need the signed-in user's id (pages read plan and
 * limits from the DB themselves), so they decode the JWT cookie without a DB round trip.
 */
const readOnlyOptions: NextAuthOptions = {
  ...authOptions,
  callbacks: { jwt: ({ token }) => token, session },
};

export function getSession() {
  return getServerSession(readOnlyOptions);
}
