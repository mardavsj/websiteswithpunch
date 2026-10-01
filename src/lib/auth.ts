import { NextAuthOptions, getServerSession, type Session, type User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

function withUser(token: JWT, user: User): JWT {
  token.id = user.id;
  token.plan = user.plan || "free";
  token.stripeStatus = user.stripeStatus;
  return token;
}

function session({ session, token }: { session: Session; token: JWT }): Session {
  if (session.user) {
    session.user.id = token.id as string;
    session.user.plan = (token.plan as string) || "free";
    session.user.stripeStatus = (token.stripeStatus as string | null) || null;
  }
  return session;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return {
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
          select: { plan: true, stripeStatus: true, name: true, email: true },
        });
        if (dbUser) {
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
