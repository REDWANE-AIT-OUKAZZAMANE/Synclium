import type { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.AUTH_GITHUB_ID || process.env.GITHUB_ID || "",
      clientSecret: process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "synclium-dev-auth-secret-do-not-use-in-production-1234",
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        // GitHub profile contains numeric numeric id and string login
        const ghProfile = profile as { id?: number | string; login?: string };
        token.githubId = String(ghProfile.id || account.providerAccountId);
        token.githubLogin = ghProfile.login;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.githubId || token.sub;
        (session.user as any).login = token.githubLogin;
      }
      return session;
    },
  },
};
