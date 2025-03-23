'use client';

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Monitor auth state for debugging
  useEffect(() => {
    // Sync localStorage token with cookie when component mounts
    const syncTokenWithCookie = () => {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('Setting manual_auth_token cookie from localStorage');
        // Set a long-lived cookie for better persistence
        document.cookie = `manual_auth_token=${token}; path=/; max-age=2592000; SameSite=Lax`;
      } else {
        // Clear cookie if no token in localStorage
        const hasCookie = document.cookie.includes('manual_auth_token=');
        if (hasCookie) {
          console.log('Clearing manual_auth_token cookie');
          document.cookie = 'manual_auth_token=; path=/; max-age=0';
        }
      }
    };

    // Initial sync on every render to ensure cookie is always set
    syncTokenWithCookie();
    
    // Set an interval to refresh the token cookie periodically to prevent expiration
    const refreshInterval = setInterval(syncTokenWithCookie, 60000); // Refresh every minute

    // Listen for storage events (in case localStorage changes in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user') {
        syncTokenWithCookie();
      }
    };

    // Listen for visibility change events
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncTokenWithCookie();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(refreshInterval);
    };
  }, []);

  return (
    <SessionProvider refetchInterval={5 * 60}>{children}</SessionProvider>
  );
} 