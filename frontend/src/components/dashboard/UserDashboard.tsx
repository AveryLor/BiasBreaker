'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/utils/AuthContext';
import { authApi, QueryHistoryItem } from '@/utils/authApi';
import Link from 'next/link';

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchQueryHistory();
  }, [user, router]);

  const fetchQueryHistory = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching user query history...");
      const result = await authApi.getQueryHistory();
      
      if (result.success && result.queries) {
        console.log(`Successfully retrieved ${result.queries.length} search history entries`);
        setQueryHistory(result.queries);
      } else {
        console.error("Failed to load search history:", result.message);
        setError('Failed to load search history');
      }
    } catch (err) {
      console.error("An error occurred while fetching search history:", err);
      setError('An error occurred while fetching your search history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    try {
      const result = await authApi.deleteAccount();
      
      if (result.success) {
        await logout();
        router.push('/');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An error occurred while deleting your account');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (passwordData.new_password.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }
    
    try {
      const result = await authApi.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      
      if (result.success) {
        setPasswordSuccess('Password updated successfully');
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: '',
        });
        
        // Close modal after short delay
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordSuccess('');
        }, 2000);
      } else {
        setPasswordError(result.message);
      }
    } catch (err) {
      setPasswordError('An error occurred while updating your password');
    }
  };

  const reopenQuery = (query: string) => {
    router.push(`/compare?query=${encodeURIComponent(query)}`);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8 text-center dark:text-white">User Dashboard</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-800 text-red-300 rounded-lg">
          {error}
        </div>
      )}
      
      {/* User Profile Section */}
      <div className="bg-black/80 rounded-lg shadow-[0_0_15px_rgba(0,255,255,0.15)] p-6 mb-8 border border-cyan-900/50">
        <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-cyan-400 to-fuchsia-400 text-transparent bg-clip-text">Your Profile</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-gray-900/60 p-5 rounded-lg border border-gray-800">
          <div>
            <p className="text-gray-400">Name</p>
            <p className="font-medium text-gray-200">{user.name}</p>
          </div>
          
          <div>
            <p className="text-gray-400">Email</p>
            <p className="font-medium text-gray-200">{user.email}</p>
          </div>
          
          <div>
            <p className="text-gray-400">Member Since</p>
            <p className="font-medium text-gray-200">
              {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white rounded-md hover:from-cyan-500 hover:to-fuchsia-500 transition-colors shadow-[0_0_5px_rgba(0,255,255,0.3)]"
          >
            Change Password
          </button>
          
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 transition-colors border border-gray-700"
          >
            Sign Out
          </button>
          
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-900/80 text-white rounded-md hover:bg-red-800 transition-colors border border-red-800/50"
          >
            Delete Account
          </button>
        </div>
      </div>
      
      {/* Search History Section */}
      <div className="bg-black/80 rounded-lg shadow-[0_0_15px_rgba(0,255,255,0.15)] p-6 border border-cyan-900/50">
        <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-cyan-400 to-fuchsia-400 text-transparent bg-clip-text">Your Search History</h2>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-b-transparent border-cyan-500"></div>
            <p className="mt-2 text-gray-400">Loading your search history...</p>
          </div>
        ) : queryHistory.length === 0 ? (
          <div className="text-center py-8 bg-gray-900/60 rounded-lg border border-gray-800">
            <p className="text-gray-400">You haven't made any searches yet.</p>
            <Link 
              href="/"
              className="mt-2 inline-block text-cyan-400 hover:text-cyan-300 hover:underline"
            >
              Start searching
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {queryHistory.map((item) => (
              <div 
                key={item.id} 
                className="p-4 border border-gray-800 rounded-lg bg-gray-900/60 hover:bg-gray-800/80 transition-all transform hover:scale-[1.02] hover:shadow-[0_0_8px_rgba(0,255,255,0.2)]"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-200 break-words">{item.query}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => reopenQuery(item.query)}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-md hover:from-cyan-500 hover:to-blue-500 transition-colors shadow-[0_0_5px_rgba(0,255,255,0.3)] whitespace-nowrap"
                  >
                    Reopen Query
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg shadow-[0_0_20px_rgba(255,0,0,0.2)] p-6 max-w-md w-full border border-red-900/50">
            <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-red-400 to-orange-400 text-transparent bg-clip-text">Delete Account</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 transition-colors border border-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-md hover:from-red-500 hover:to-orange-500 transition-colors shadow-[0_0_5px_rgba(255,0,0,0.3)]"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg shadow-[0_0_20px_rgba(0,255,255,0.2)] p-6 max-w-md w-full border border-cyan-900/50">
            <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-fuchsia-400 text-transparent bg-clip-text">Change Password</h3>
            
            {passwordError && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-300 rounded text-sm">
                {passwordError}
              </div>
            )}
            
            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-900/30 border border-green-800 text-green-300 rounded text-sm">
                {passwordSuccess}
              </div>
            )}
            
            <form onSubmit={handlePasswordChange}>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2" htmlFor="current_password">
                  Current Password
                </label>
                <input
                  id="current_password"
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-200"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-300 mb-2" htmlFor="new_password">
                  New Password
                </label>
                <input
                  id="new_password"
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-200"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-300 mb-2" htmlFor="confirm_password">
                  Confirm New Password
                </label>
                <input
                  id="confirm_password"
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-200"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 transition-colors border border-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white rounded-md hover:from-cyan-500 hover:to-fuchsia-500 transition-colors shadow-[0_0_5px_rgba(0,255,255,0.3)]"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 