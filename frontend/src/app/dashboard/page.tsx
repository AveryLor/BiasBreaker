'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Define proper type for user data
interface UserData {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);

  // Function to handle selecting a previous search
  const handleSearchSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const query = e.target.value;
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  useEffect(() => {
    // Check for manually authenticated user first
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    const checkAuth = async () => {
      console.log('Dashboard auth check - NextAuth status:', status);
      console.log('Dashboard auth check - Manual auth:', !!storedUser && !!token);
      
      if (storedUser && token) {
        try {
          const user = JSON.parse(storedUser);
          setUserData(user);
          setLoading(false);
          
          // Ensure cookie is set for middleware
          document.cookie = `manual_auth_token=${token}; path=/; max-age=86400; SameSite=Lax`;
          
          // Begin loading search history
          fetchSearchHistory(token);
          return; // Exit early since we have a manually authenticated user
        } catch (err) {
          console.error('Error parsing stored user data:', err);
          // Clear invalid data
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          document.cookie = 'manual_auth_token=; path=/; max-age=0';
          // Continue to check NextAuth session
        }
      }
      
      // Check NextAuth session
      if (status === 'loading') {
        // Will check again on next status change
        return;
      }
      
      if (status === 'unauthenticated') {
        console.log('Not authenticated, redirecting to login');
        
        // Only redirect if we don't have a manual token - prevents flashing redirects
        if (!token) {
          router.push('/auth/signin'); // Redirect to login if not authenticated
        }
      } else if (status === 'authenticated' && session?.user) {
        console.log('Authenticated via NextAuth');
        setUserData(session.user);
        setLoading(false);
        
        // Begin loading search history with NextAuth token
        if (session.accessToken) {
          fetchSearchHistory(session.accessToken);
        }
      }
    };
    
    checkAuth();
    
    // Set a timeout to handle potential infinite loading issues
    // Increased timeout to avoid premature redirects
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('Auth check timeout - forcing content display');
        setLoading(false);
        
        // Don't force redirect, just stop the loading state
        // Only redirect if we have no authentication at all
        const hasAnyAuth = !!(localStorage.getItem('token') || status === 'authenticated');
        if (!hasAnyAuth) {
          router.push('/auth/signin');
        }
      }
    }, 8000); // Increased to 8 seconds
    
    return () => clearTimeout(timeoutId);
  }, [status, session, router]);

  // Fetch user's search history when session is available
  // Function to fetch search history
  const fetchSearchHistory = async (token: string) => {
    try {
      console.log('Fetching search history with token:', token.substring(0, 10) + '...');
      
      try {
        const response = await fetch('http://localhost:8000/search-history/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          // Check if response is empty
          const text = await response.text();
          if (!text || text.trim() === '') {
            console.log('Empty response from server');
            setSearchHistory([]);
            return;
          }
          
          // Parse JSON if not empty
          const data = JSON.parse(text);
          console.log('Received search history:', data);
          setSearchHistory(Array.isArray(data) ? data : []);
        } else {
          console.error('Error response from server:', response.status, response.statusText);
          // Set empty array to prevent undefined errors
          setSearchHistory([]);
        }
      } catch (fetchError) {
        console.error('Network error fetching search history:', fetchError);
        setSearchHistory([]);
      }
    } catch (error) {
      console.error('Error in fetch search history:', error);
      setSearchHistory([]);
    }
  };

  // Function to handle logout
  const handleLogout = () => {
    // Clear stored authentication data
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Redirect to sign-in page
    router.push('/auth/signin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-purple-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-purple-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 mt-12">

        </div>
        
        <div className="bg-black/60 backdrop-blur-md rounded-xl border border-cyan-900/50 p-6 shadow-[0_0_15px_rgba(0,255,255,0.15)] mb-8">
          <h2 className="text-xl font-bold mb-4 text-cyan-300">Welcome, {userData?.name || userData?.email || 'User'}</h2>
          <p className="text-gray-300">You are now signed in to your account.</p>
        </div>
        
        {/* Mock Content Blocks */}
        <div className="grid gap-6 ">
          <div className="bg-black/60 backdrop-blur-md rounded-xl border border-cyan-900/50 p-6 shadow-[0_0_15px_rgba(0,255,255,0.15)]">
            <h3 className="text-lg font-medium mb-3 text-fuchsia-300">Search History</h3>
            <p className="text-gray-400 mb-4">Your recent search history.</p>
            <div className="space-y-2">
              {searchHistory && searchHistory.length > 0 ? (
                <div className="bg-gray-800/50 p-2 rounded">
                  <select 
                    className="w-full bg-gray-800 p-2 rounded text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500" 
                    onChange={handleSearchSelect}
                    defaultValue=""
                  >
                    <option value="" disabled>Recent searches</option>
                    {searchHistory.map((search: any) => (
                      <option key={search.id} value={search.query}>
                        {search.query}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-2 ">Select a search to view results</p>
                </div>
              ) : (
                <div className="bg-gray-800/50 p-2 rounded">No recent searches</div>
              )}
            </div>
          </div>
          
          
        </div>
      </div>
    </div>
  );
} 