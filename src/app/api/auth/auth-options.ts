import GithubProvider from "next-auth/providers/github";
import type { AuthOptions } from "next-auth";

// Extend the built-in session type
declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email repo',
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
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      return session;
    },
    async signIn() {
      try {
        // Record the login
        await fetch('/api/logged-in-users', { method: 'POST' });
        return true;
      } catch (error) {
        console.error('Error recording login:', error);
        return true; // Still allow sign in
      }
    },
  },
  debug: true,
}; 