'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/utils/AuthContext';
import { Fragment } from 'react';

const navigationItems = [
  { name: 'Home', href: '/', current: true },
  { name: 'Compare', href: '/compare', current: false }
];

export default function Navbar() {
  const pathname = usePathname();
  const [navigation, setNavigation] = useState(navigationItems);
  const { user, logout, isLoading } = useAuth();
  
  // Update current page in navigation
  useEffect(() => {
    setNavigation(nav => 
      nav.map(item => ({
        ...item,
        current: item.href === pathname
      }))
    );
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
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
                </div>
              </div>
              
              {/* Auth buttons */}
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                {isLoading ? (
                  <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-fuchsia-500 animate-spin"></div>
                ) : user ? (
                  <Menu as="div" className="relative ml-3">
                    <div>
                      <Menu.Button className="relative flex rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 p-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                        <span className="sr-only">Open user menu</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/80">
                          <UserCircleIcon className="h-6 w-6 text-white" aria-hidden="true" />
                        </div>
                      </Menu.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-black/80 backdrop-blur-md shadow-lg border border-cyan-900/50 shadow-[0_0_15px_rgba(0,255,255,0.15)] py-1 focus:outline-none">
                        <Menu.Item>
                          {({ active }) => (
                            <div className="px-4 py-2 text-sm text-gray-200">
                              <div>Signed in as</div>
                              <div className="font-medium truncate">{user.name}</div>
                            </div>
                          )}
                        </Menu.Item>
                        <div className="border-t border-gray-700 my-1"></div>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/dashboard"
                              className={`${
                                active ? 'bg-gray-800/70' : ''
                              } block px-4 py-2 text-sm text-gray-300 hover:text-white`}
                            >
                              Dashboard
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleLogout}
                              className={`${
                                active ? 'bg-gray-800/70' : ''
                              } block w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white`}
                            >
                              Sign out
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <div className="flex items-center space-x-4">
                    <Link
                      href="/login"
                      className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="bg-gradient-to-r from-cyan-500 to-fuchsia-500 hover:from-cyan-600 hover:to-fuchsia-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-all duration-300"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
              
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
              
              {/* Auth links for mobile */}
              {!isLoading && (
                <div className="pt-4 pb-3 border-t border-gray-700">
                  {user ? (
                    <>
                      <div className="flex items-center px-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gradient-to-r from-cyan-500 to-fuchsia-500">
                            <UserCircleIcon className="h-6 w-6 text-white" aria-hidden="true" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-base font-medium text-white">{user.name}</div>
                          <div className="text-sm font-medium text-gray-400">{user.email}</div>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1">
                        <Disclosure.Button
                          as={Link}
                          href="/dashboard"
                          className="block px-4 py-2 text-base font-medium text-gray-300 hover:bg-gray-800/70 hover:text-white transition-all duration-300"
                        >
                          Dashboard
                        </Disclosure.Button>
                        <Disclosure.Button
                          as="button"
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-base font-medium text-gray-300 hover:bg-gray-800/70 hover:text-white transition-all duration-300"
                        >
                          Sign out
                        </Disclosure.Button>
                      </div>
                    </>
                  ) : (
                    <div className="mt-3 space-y-1">
                      <Disclosure.Button
                        as={Link}
                        href="/login"
                        className="block px-4 py-2 text-base font-medium text-gray-300 hover:bg-gray-800/70 hover:text-white transition-all duration-300"
                      >
                        Login
                      </Disclosure.Button>
                      <Disclosure.Button
                        as={Link}
                        href="/register"
                        className="block px-4 py-2 text-base font-medium text-gray-300 hover:bg-gray-800/70 hover:text-white transition-all duration-300"
                      >
                        Sign Up
                      </Disclosure.Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
