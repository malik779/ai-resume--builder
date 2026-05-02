import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db/client";
import { SubscriptionStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// NextAuth v5 configuration
// ─────────────────────────────────────────────────────────────────────────────

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Extend this to implement password hashing (bcrypt)
        if (!credentials?.email) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        return user ?? null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        // Attach subscription tier to JWT for fast access in middleware
        const sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
        token.tier = sub?.tier ?? "FREE";
        token.subscriptionStatus = sub?.status ?? SubscriptionStatus.TRIALING;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
        session.user.tier = token.tier as string;
        session.user.subscriptionStatus = token.subscriptionStatus as string;
      }
      return session;
    },
  },
  events: {
    // Provision free trial subscription on first sign-in
    async createUser({ user }) {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + Number(process.env.FREE_TRIAL_DAYS ?? 14));
      await prisma.subscription.create({
        data: {
          userId: user.id!,
          tier: "FREE",
          status: "TRIALING",
          trialEndsAt,
        },
      });
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
