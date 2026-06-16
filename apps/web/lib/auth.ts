import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const backendUrl = process.env.NEXTAUTH_BACKEND_URL 
            || "http://api:8000";
          const res = await fetch(
            `${backendUrl}/api/v1/auth/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            }
          );
          if (!res.ok) return null;
          const data = await res.json();
          return {
            id: data.user_id,
            email: credentials.email,
            role: data.role,
            accessToken: data.access_token,
          };
        } catch { return null; }
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.accessToken = (user as any).accessToken;
      }
      return token;
    },
    session: async ({ session, token }) => {
      (session.user as any).id = token.id;
      (session.user as any).role = token.role;
      (session as any).accessToken = token.accessToken;
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    // Match the backend JWT lifetime (JWT_EXPIRE_MINUTES = 1 day) so the
    // next-auth session and the API access token expire together — avoids a
    // "still logged in" cookie whose embedded token is already 401'ing.
    maxAge: 60 * 60 * 24,
  },
  pages: {
    signIn: "/login",
  },
};

