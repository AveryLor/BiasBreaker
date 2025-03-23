import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

// Configuration for the API backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// @ts-ignore: Ignore type errors for now to get functionality working
const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "dummy-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy-client-secret",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
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
            const errorData = await response.json();
            console.error('Auth error details:', errorData);
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
            const userErrorData = await userResponse.json().catch(() => ({}));
            console.error('User fetch error details:', userErrorData);
            return null;
          }

          const userData = await userResponse.json();
          console.log('User data fetched successfully');

          // Return the user object for NextAuth session
          return {
            id: String(userData.id),
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
    // @ts-ignore: Ignore type errors for now
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.userId = user.id;
      }
      return token;
    },
    // @ts-ignore: Ignore type errors for now
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      if (session.user) {
        session.user.id = token.userId;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
    error: '/auth/signin?error=auth',
    verifyRequest: '/auth/verify-request',
    newUser: '/dashboard'
  },
  session: {
    strategy: 'jwt' as const,
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 