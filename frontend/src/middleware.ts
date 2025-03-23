import { auth } from './app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  console.log('Middleware running for path:', new URL(request.url).pathname);
  
  // Get session token from NextAuth
  let session;
  try {
    session = await auth();
  } catch (error) {
    console.error('Error getting NextAuth session:', error);
    session = null;
  }
  console.log('NextAuth session exists:', !!session);
  
  // Check for localStorage token through cookies
  // Note: Middleware can't directly access localStorage, but we can check cookies
  const manualToken = request.cookies.get('manual_auth_token')?.value;
  console.log('Manual token exists:', !!manualToken);
  
  // Define routes that require authentication
  const protectedPaths = ['/dashboard', '/profile'];
  const currentPath = new URL(request.url).pathname;
  
  // Check if current path is protected
  const isProtectedPath = protectedPaths.some(path => 
    currentPath.startsWith(path)
  );

  console.log('Is protected path:', isProtectedPath);
  
  // User is authenticated if either NextAuth session exists or manual token exists
  const isAuthenticated = !!session || !!manualToken;
  console.log('Is authenticated:', isAuthenticated);

  // If path is protected and user is not authenticated, redirect to signin
  if (isProtectedPath && !isAuthenticated) {
    console.log('Redirecting to signin page');
    // Store the URL they were trying to visit
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  // Allow access - pass through response with refreshed token cookie
  // This ensures we maintain the manual token state across requests
  const response = NextResponse.next();
  
  // If we have a manual token, ensure it's set in the response cookie to refresh it
  if (manualToken) {
    response.cookies.set('manual_auth_token', manualToken, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false, // Need to be accessible by JavaScript
      sameSite: 'lax'
    });
  }
  
  return response;
}

// Add configuration for the middleware
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /fonts, /examples (inside /public)
     * 4. /favicon.ico, /robots.txt (public files)
     */
    '/((?!api|_next|fonts|examples|favicon.ico|robots.txt).*)',
  ],
}; 