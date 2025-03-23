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
  const [searchHistory, setSearchHistory] = useState([]);

  useEffect(() => {
    // Check for manually authenticated user first
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        const user = JSON.parse(storedUser);
        setUserData(user);
        setLoading(false);
        return; // Exit early since we have a manually authenticated user
      } catch (err) {
        console.error('Error parsing stored user data:', err);
        // Continue to check NextAuth session
      }
    }
    
    // Check NextAuth session
    if (status === 'loading') {
      return; // Wait for the session to load
    }
    
    if (status === 'unauthenticated') {
      router.push('/auth/signin'); // Redirect to login if not authenticated
    } else if (session?.user) {
      setUserData(session.user);
      setLoading(false);
    }
  }, [status, session, router]);

  // Fetch user's search history when session is available
  useEffect(() => {
    if (session?.accessToken) {
      // Function to fetch search history
      const fetchSearchHistory = async () => {
        try {
          const response = await fetch('http://localhost:8000/search-history/', {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            setSearchHistory(data);
          }
        } catch (error) {
          console.error('Error fetching search history:', error);
        }
      };
      
      fetchSearchHistory();
    }
  }, [session]);

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-transparent bg-clip-text">
            Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-md bg-red-600/80 hover:bg-red-500 transition-colors text-white text-sm"
          >
            Sign Out
          </button>
        </div>
        
        <div className="bg-black/60 backdrop-blur-md rounded-xl border border-cyan-900/50 p-6 shadow-[0_0_15px_rgba(0,255,255,0.15)] mb-8">
          <h2 className="text-xl font-bold mb-4 text-cyan-300">Welcome, {userData?.name || userData?.email || 'User'}</h2>
          <p className="text-gray-300">You are now signed in to your account.</p>
        </div>
        
        {/* Mock Content Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-black/60 backdrop-blur-md rounded-xl border border-cyan-900/50 p-6 shadow-[0_0_15px_rgba(0,255,255,0.15)]">
            <h3 className="text-lg font-medium mb-3 text-fuchsia-300">Search History</h3>
            <p className="text-gray-400 mb-4">Your recent search history will appear here.</p>
            <div className="space-y-2">
              <div className="bg-gray-800/50 p-2 rounded">No recent searches</div>
            </div>
          </div>
          
          <div className="bg-black/60 backdrop-blur-md rounded-xl border border-cyan-900/50 p-6 shadow-[0_0_15px_rgba(0,255,255,0.15)]">
            <h3 className="text-lg font-medium mb-3 text-fuchsia-300">Reading Preferences</h3>
            <p className="text-gray-400 mb-4">Sources and topics that interest you.</p>
            <div className="space-y-2">
              <div className="bg-gray-800/50 p-2 rounded">No preferences set</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 