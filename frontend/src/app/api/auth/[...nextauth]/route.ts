import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthConfig } from "next-auth";

// Configuration for the API backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const authConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "dummy-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy-client-secret",
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          console.log('NextAuth attempting auth with email:', credentials.email);
          
          // Login with FastAPI backend
          const formData = new URLSearchParams();
          formData.append('username', credentials.email as string);
          formData.append('password', credentials.password as string);

          const response = await fetch(`${API_URL}/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
          });

          if (!response.ok) {
            console.error('Auth failed with status:', response.status);
            return null;
          }

          const tokenData = await response.json();
          console.log('Token received successfully');

          // Get user data using the token
          const userResponse = await fetch(`${API_URL}/users/me`, {
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`,
            },
          });

          if (!userResponse.ok) {
            console.error('User fetch failed with status:', userResponse.status);
            return null;
          }

          const userData = await userResponse.json();
          console.log('User data fetched successfully');

          // Return the user object for NextAuth session
          return {
            id: String(userData.id || "0"),
            name: userData.name || userData.email,
            email: userData.email,
            accessToken: tokenData.access_token,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        // Add any user properties you want to store in the JWT
        token.accessToken = user.accessToken;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Add properties to the session from the token
      if (token && session.user) {
        session.user.id = token.userId as string || "";
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
    error: '/auth/signin?error=auth',
  },
  session: { strategy: "jwt" },
  debug: process.env.NODE_ENV === 'development',
} satisfies NextAuthConfig;

// Export the NextAuth handler
export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(authConfig); 