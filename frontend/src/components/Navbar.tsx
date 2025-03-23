'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useTheme } from 'next-themes';
import { usePathname, useRouter } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import Image from 'next/image';

// Define user data type
interface UserData {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

// Custom event for auth state changes
const AUTH_STATE_CHANGE_EVENT = 'auth-state-change';

// Function to emit auth state change event
export function emitAuthStateChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_STATE_CHANGE_EVENT));
  }
}

const navigationItems = [
  { name: 'Home', href: '/', current: true },
  { name: 'Compare', href: '/compare', current: false }
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const [navigation, setNavigation] = useState(navigationItems);
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [manualUser, setManualUser] = useState<UserData | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Update current page in navigation
  useEffect(() => {
    setNavigation(nav => 
      nav.map(item => ({
        ...item,
        current: item.href === pathname
      }))
    );
  }, [pathname]);

  // Function to check manual auth
  const checkManualAuth = () => {
    if (typeof window === 'undefined') return;
    
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        // Store token in cookie for middleware access
        document.cookie = `manual_auth_token=${token}; path=/; max-age=86400; SameSite=Lax`;
        setManualUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error parsing stored user data:', err);
        // If error parsing, clear the invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        document.cookie = 'manual_auth_token=; path=/; max-age=0';
        setManualUser(null);
      }
    } else {
      setManualUser(null);
    }
  };

  // Check if user is authenticated via localStorage on component mount
  useEffect(() => {
    checkManualAuth();
    
    // Listen for auth state changes
    const handleAuthStateChange = () => {
      checkManualAuth();
      setForceUpdate(prev => prev + 1); // Force a re-render
    };
    
    // Listen for focus to check if localStorage changed
    window.addEventListener('focus', checkManualAuth);
    window.addEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthStateChange);
    
    return () => {
      window.removeEventListener('focus', checkManualAuth);
      window.removeEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthStateChange);
    };
  }, []);

  // Determine if user is authenticated - either via NextAuth or manual auth
  // Fix to ensure buttons always show during loading or when not authenticated
  const isAuthenticated = status === 'authenticated' || (manualUser !== null && !!localStorage.getItem('token'));
  const isLoading = status === 'loading' && !manualUser;
  const userData = manualUser || session?.user;

  // Debug auth state
  useEffect(() => {
    console.log('Auth Status:', {
      nextAuthStatus: status,
      hasManualUser: !!manualUser,
      isAuthenticated,
      hasToken: !!localStorage.getItem('token')
    });
  }, [status, manualUser, isAuthenticated]);

  // Handle manual sign out
  const handleSignOut = () => {
    // Clear localStorage auth
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Clear auth cookie
    document.cookie = 'manual_auth_token=; path=/; max-age=0';
    
    setManualUser(null);
    
    // Emit auth state change event
    emitAuthStateChange();
    
    // Also sign out from NextAuth if session exists
    if (session) {
      signOut({ callbackUrl: '/' });
    } else {
      // If using manual auth, redirect to home page
      router.push('/');
    }
  };
  
  return (
    <Disclosure as="nav" className="bg-black/60 backdrop-blur-md border-b border-cyan-900/50 shadow-[0_0_15px_rgba(0,255,255,0.15)] fixed w-full top-0 z-50 py-2">
      {({ open }: { open: boolean }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <Link href="/">
                    <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-transparent bg-clip-text">
                      GenesisAI
                    </span>
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {/* Desktop Navigation */}
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`${
                        item.current
                          ? 'border-fuchsia-500 text-white shadow-[0_5px_10px_-5px_rgba(217,70,219,0.6)]'
                          : 'border-transparent text-gray-300 hover:border-cyan-300 hover:text-white hover:shadow-[0_5px_10px_-5px_rgba(0,255,255,0.6)] transition-all duration-300'
                      } inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium`}
                      aria-current={item.current ? 'page' : undefined}
                    >
                      {item.name}
                    </Link>
                  ))}
                  
                  {isAuthenticated && (
                    <Link
                      href="/dashboard"
                      className={`${
                        pathname === '/dashboard'
                          ? 'border-fuchsia-500 text-white shadow-[0_5px_10px_-5px_rgba(217,70,219,0.6)]'
                          : 'border-transparent text-gray-300 hover:border-cyan-300 hover:text-white hover:shadow-[0_5px_10px_-5px_rgba(0,255,255,0.6)] transition-all duration-300'
                      } inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium`}
                      aria-current={pathname === '/dashboard' ? 'page' : undefined}
                    >
                      Dashboard
                    </Link>
                  )}
                </div>
              </div>
              
              <div className="flex items-center">
                {/* Authentication buttons */}
                {isLoading ? (
                  <div className="h-8 w-8 rounded-full bg-gray-800 animate-pulse"></div>
                ) : !isAuthenticated ? (
                  <div className="flex space-x-4">
                    <Link
                      href="/auth/signin"
                      className="rounded-md bg-gradient-to-r from-cyan-600 to-cyan-700 px-3 py-1.5 text-sm text-white hover:from-cyan-500 hover:to-cyan-600 transition-all duration-300 shadow-[0_0_10px_rgba(0,255,255,0.3)]"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="rounded-md bg-gradient-to-r from-fuchsia-600 to-fuchsia-700 px-3 py-1.5 text-sm text-white hover:from-fuchsia-500 hover:to-fuchsia-600 transition-all duration-300 shadow-[0_0_10px_rgba(217,70,219,0.3)]"
                    >
                      Sign up
                    </Link>
                  </div>
                ) : (
                  <Menu as="div" className="relative">
                    <Menu.Button className="flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2 focus:ring-offset-gray-800">
                      <span className="sr-only">Open user menu</span>
                      {userData?.image ? (
                        <Image
                          className="h-8 w-8 rounded-full"
                          src={userData.image}
                          alt={userData.name || "User profile"}
                          width={32}
                          height={32}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 flex items-center justify-center text-white font-medium">
                          {userData?.name?.charAt(0) || userData?.email?.charAt(0) || 'U'}
                        </div>
                      )}
                    </Menu.Button>
                    <Transition
                      as={React.Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-black/80 backdrop-blur-md border border-cyan-900/50 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="px-4 py-2 border-b border-gray-700">
                          <p className="text-sm font-medium text-cyan-400 truncate">
                            {userData?.name || 'User'}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {userData?.email}
                          </p>
                        </div>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/dashboard"
                              className={`${
                                active ? 'bg-gray-800/70' : ''
                              } block px-4 py-2 text-sm text-gray-200`}
                            >
                              Dashboard
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleSignOut}
                              className={`${
                                active ? 'bg-gray-800/70' : ''
                              } block w-full text-left px-4 py-2 text-sm text-gray-200`}
                            >
                              Sign out
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                )}
                
                {/* Mobile menu button */}
                <div className="flex items-center sm:hidden ml-4">
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-300 hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-fuchsia-500">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          <Disclosure.Panel className="sm:hidden bg-black/80 backdrop-blur-md">
            <div className="space-y-1 pb-3 pt-2">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as={Link}
                  href={item.href}
                  className={`${
                    item.current
                      ? 'bg-gray-900/70 border-fuchsia-500 text-fuchsia-400 shadow-[0_0_10px_rgba(217,70,219,0.3)]'
                      : 'border-transparent text-gray-300 hover:bg-gray-800/70 hover:border-cyan-300 hover:text-white hover:shadow-[0_0_10px_rgba(0,255,255,0.3)] transition-all duration-300'
                  } block border-l-4 py-2 pl-3 pr-4 text-base font-medium`}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
              
              {isAuthenticated && (
                <Disclosure.Button
                  as={Link}
                  href="/dashboard"
                  className={`${
                    pathname === '/dashboard'
                      ? 'bg-gray-900/70 border-fuchsia-500 text-fuchsia-400 shadow-[0_0_10px_rgba(217,70,219,0.3)]'
                      : 'border-transparent text-gray-300 hover:bg-gray-800/70 hover:border-cyan-300 hover:text-white hover:shadow-[0_0_10px_rgba(0,255,255,0.3)] transition-all duration-300'
                  } block border-l-4 py-2 pl-3 pr-4 text-base font-medium`}
                  aria-current={pathname === '/dashboard' ? 'page' : undefined}
                >
                  Dashboard
                </Disclosure.Button>
              )}
              
              {!isAuthenticated && (
                <div className="mt-4 flex items-center justify-center space-x-4 px-4 py-2">
                  <Link
                    href="/auth/signin"
                    className="flex-1 rounded-md bg-gradient-to-r from-cyan-600 to-cyan-700 px-3 py-2 text-sm text-white hover:from-cyan-500 hover:to-cyan-600 transition-all duration-300 shadow-[0_0_10px_rgba(0,255,255,0.3)]"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="flex-1 rounded-md bg-gradient-to-r from-fuchsia-600 to-fuchsia-700 px-3 py-2 text-sm text-white hover:from-fuchsia-500 hover:to-fuchsia-600 transition-all duration-300 shadow-[0_0_10px_rgba(217,70,219,0.3)]"
                  >
                    Sign up
                  </Link>
                </div>
              )}
              
              {isAuthenticated && (
                <div className="mt-3 border-t border-gray-700 pt-4 pb-3">
                  <div className="flex items-center px-5">
                    <div className="flex-shrink-0">
                      {userData?.image ? (
                        <Image
                          className="h-10 w-10 rounded-full"
                          src={userData.image}
                          alt={userData.name || "User profile"}
                          width={40}
                          height={40}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 flex items-center justify-center text-white font-medium">
                          {userData?.name?.charAt(0) || userData?.email?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-white">
                        {userData?.name || 'User'}
                      </div>
                      <div className="text-sm font-medium text-gray-400">
                        {userData?.email}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 px-5">
                    <Disclosure.Button
                      as="a"
                      onClick={handleSignOut}
                      className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-800/50 hover:text-white cursor-pointer"
                    >
                      Sign out
                    </Disclosure.Button>
                  </div>
                </div>
              )}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
} 