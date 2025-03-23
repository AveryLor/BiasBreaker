'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { emitAuthStateChange } from '@/components/Navbar';

// Configuration for the API backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);

    try {
      console.log("Registering user:", { email, name });
      
      // Register user through FastAPI backend
      const response = await fetch(`${API_URL}/users/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
        }),
      });

      console.log("Registration response status:", response.status);
      
      let data;
      try {
        data = await response.json();
        console.log("Registration response data:", data);
      } catch (e) {
        console.error("Error parsing response:", e);
        data = { detail: "Error parsing server response" };
      }

      if (!response.ok) {
        // Handle different error cases
        if (response.status === 400 && data.detail && data.detail.includes('already registered')) {
          setError('Email already registered. Please sign in or use a different email.');
        } else if (response.status === 500 && data.detail && data.detail.includes('users table does not exist')) {
          setError('Database setup issue: The users table does not exist. Please contact the administrator.');
        } else if (response.status === 500 && data.detail && data.detail.includes('Database error')) {
          setError('Database error: Unable to create user. Please try again later or contact support.');
        } else {
          setError(data.detail || 'Registration failed. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      console.log("Registration successful, attempting sign in");
      
      // Instead of auto-login, just redirect to sign-in page
      router.push('/auth/signin?registered=true');
      
      /* Commented out auto-login which might be causing issues
      // Registration successful, sign in automatically
      const signInResult = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (signInResult?.error) {
        console.error('Auto-login failed after registration:', signInResult.error);
        // Still redirect to login page since registration was successful
        router.push('/auth/signin?registered=true');
      } else {
        // Successfully signed in after registration, redirect to dashboard
        router.push('/dashboard');
      }
      */
    } catch (err) {
      console.error('Registration error:', err);
      setError('An error occurred connecting to the service. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black via-gray-900 to-purple-950">
      <div className="w-full max-w-md space-y-8 bg-black/60 backdrop-blur-md p-8 rounded-xl border border-cyan-900/50 shadow-[0_0_15px_rgba(0,255,255,0.15)]">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-transparent bg-clip-text">
            Create a new account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Or{' '}
            <Link href="/auth/signin" className="font-medium text-cyan-400 hover:text-cyan-300">
              sign in to your existing account
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-500/50 rounded-lg p-4 text-center">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="sr-only">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-gray-900/70 border border-gray-700 relative block w-full rounded-md px-3 py-2 text-gray-200 placeholder-gray-500 focus:z-10 focus:border-cyan-500 focus:outline-none focus:ring-cyan-500 sm:text-sm"
                placeholder="Full name"
              />
            </div>
            
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-900/70 border border-gray-700 relative block w-full rounded-md px-3 py-2 text-gray-200 placeholder-gray-500 focus:z-10 focus:border-cyan-500 focus:outline-none focus:ring-cyan-500 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-900/70 border border-gray-700 relative block w-full rounded-md px-3 py-2 text-gray-200 placeholder-gray-500 focus:z-10 focus:border-cyan-500 focus:outline-none focus:ring-cyan-500 sm:text-sm"
                placeholder="Password"
              />
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-gray-900/70 border border-gray-700 relative block w-full rounded-md px-3 py-2 text-gray-200 placeholder-gray-500 focus:z-10 focus:border-cyan-500 focus:outline-none focus:ring-cyan-500 sm:text-sm"
                placeholder="Confirm password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-gradient-to-r from-cyan-600 to-fuchsia-600 py-2 px-4 text-sm font-medium text-white hover:from-cyan-500 hover:to-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-70"
            >
              {isLoading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-black/60 px-2 text-gray-400">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="flex w-full items-center justify-center gap-3 rounded-md bg-gray-800 py-2 px-4 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2"
            >
              <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                <path
                  d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"
                  fill="currentColor"
                />
              </svg>
              <span className="text-sm font-medium">Google</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 