'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { emitAuthStateChange } from '@/components/Navbar';

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check for registered=true query param to show success message
  useEffect(() => {
    if (searchParams?.get('registered') === 'true') {
      setSuccessMessage('Account created successfully! Please sign in.');
    }
    
    // Check for error param
    const errorType = searchParams?.get('error');
    if (errorType) {
      switch (errorType) {
        case 'CredentialsSignin':
          setError('Invalid email or password. Please try again.');
          break;
        case 'auth':
          setError('Authentication failed. Please check your credentials and try again.');
          break;
        case 'callback':
          setError('Error during authentication. Please try again.');
          break;
        default:
          setError('An error occurred during sign in. Please try again.');
          break;
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      console.log('Attempting sign in with email:', email);
      
      // Get the API URL
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // Try direct backend authentication first
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      console.log('Sending direct token request to backend');
      
      const tokenResponse = await fetch(`${API_URL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });
      
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        console.log('Token received successfully, getting user data');
        
        // Get user data
        const userResponse = await fetch(`${API_URL}/users/me`, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log('User data received, setting in localStorage');
          
          // Store user and token in localStorage for manual auth
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('token', tokenData.access_token);
          
          // Emit auth state change event
          emitAuthStateChange();
          
          // Redirect to dashboard
          console.log('Manual authentication successful, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }
      } else {
        console.error('Backend auth failed, error:', await tokenResponse.text());
        setError('Invalid email or password');
        setIsLoading(false);
        return;
      }
      
      // Fallback to NextAuth if direct approach fails
      console.log('Falling back to NextAuth');
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      console.log('Sign-in result:', result);

      if (result?.error) {
        console.error('Sign-in error:', result.error);
        setError('Invalid email or password');
        setIsLoading(false);
      } else {
        console.log('Sign-in success, redirecting to dashboard');
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Sign-in exception:', err);
      setError('An error occurred connecting to the authentication service. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black via-gray-900 to-purple-950">
      <div className="w-full max-w-md space-y-8 bg-black/60 backdrop-blur-md p-8 rounded-xl border border-cyan-900/50 shadow-[0_0_15px_rgba(0,255,255,0.15)]">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-transparent bg-clip-text">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Or{' '}
            <Link href="/auth/signup" className="font-medium text-cyan-400 hover:text-cyan-300">
              create a new account
            </Link>
          </p>
        </div>
        
        {/* Success message */}
        {successMessage && (
          <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-md">
            {successMessage}
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="-space-y-px rounded-md shadow-sm">
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
                className="bg-gray-900/70 border border-gray-700 relative block w-full rounded-t-md px-3 py-2 text-gray-200 placeholder-gray-500 focus:z-10 focus:border-cyan-500 focus:outline-none focus:ring-cyan-500 sm:text-sm"
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
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-900/70 border border-gray-700 relative block w-full rounded-b-md px-3 py-2 text-gray-200 placeholder-gray-500 focus:z-10 focus:border-cyan-500 focus:outline-none focus:ring-cyan-500 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-gradient-to-r from-cyan-600 to-fuchsia-600 py-2 px-4 text-sm font-medium text-white hover:from-cyan-500 hover:to-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-70"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
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