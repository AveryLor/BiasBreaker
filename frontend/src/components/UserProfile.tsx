'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function UserProfile() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') {
    return (
      <div className="p-4 rounded-lg bg-gray-800 text-gray-200">
        <p>Loading session...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="p-4 rounded-lg bg-gray-800 text-gray-200">
        <p>You are not signed in</p>
        <div className="mt-2 flex space-x-4">
          <Link href="/auth/signin" className="text-cyan-400 hover:text-cyan-300">
            Sign in
          </Link>
          <Link href="/auth/signup" className="text-cyan-400 hover:text-cyan-300">
            Sign up
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 text-gray-100 shadow-lg border border-gray-700">
      <div className="flex items-center space-x-4 mb-4">
        {session?.user?.image ? (
          <img 
            src={session.user.image} 
            alt={session.user.name || 'User'} 
            className="h-12 w-12 rounded-full border-2 border-cyan-400"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center text-xl font-bold">
            {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || '?'}
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold">{session?.user?.name || 'User'}</h2>
          <p className="text-sm text-gray-400">{session?.user?.email}</p>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-700">
        <h3 className="font-semibold text-cyan-400 mb-2">Session Info</h3>
        <div className="bg-black/40 p-3 rounded text-xs font-mono overflow-auto max-h-40">
          <pre>{JSON.stringify(session, null, 2)}</pre>
        </div>
      </div>

      <button
        onClick={() => signOut({ callbackUrl: '/' })}
        className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
      >
        Sign out
      </button>
    </div>
  );
} 