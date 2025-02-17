import GithubProvider from "next-auth/providers/github";
import { JWT } from "next-auth/jwt";
import { Account, Session } from "next-auth";

// Extend the built-in session and JWT types
declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const authOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email repo read:org',
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/',
    error: '/error',
  },
  callbacks: {
    async jwt({ token, account }: { token: JWT, account: Account | null }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }: { session: Session, token: JWT }) {
      if (token) {
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
  debug: true,
};