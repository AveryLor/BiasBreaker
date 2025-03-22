'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

interface NavigationItem {
  name: string;
  href: string;
  current: boolean;
}

const navigationItems: NavigationItem[] = [
  { name: 'Home', href: '/', current: true },
  { name: 'News', href: '/news', current: false },
  { name: 'Topics', href: '/topics', current: false },
  { name: 'Explore', href: '/explore', current: false },
  { name: '3D Demo', href: '/three-demo', current: false },
  { name: 'Cityscape', href: '/cityscape-demo', current: false },
];

export default function Navbar() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [navigation, setNavigation] = useState(navigationItems);
  
  // Update current page in navigation
  useEffect(() => {
    setNavigation(nav => 
      nav.map(item => ({
        ...item,
        current: item.href === pathname
      }))
    );
  }, [pathname]);
  
  return (
    <Disclosure as="nav" className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
      {({ open }: { open: boolean }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <Link href="/">
                    <span className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-transparent bg-clip-text">
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
                          ? 'border-indigo-500 text-slate-900 dark:text-white'
                          : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white'
                      } inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium`}
                      aria-current={item.current ? 'page' : undefined}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center">
                <ThemeToggle />
                
                {/* Mobile menu button */}
                <div className="flex items-center sm:hidden ml-4">
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
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
          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 pb-3 pt-2">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as={Link}
                  href={item.href}
                  className={`${
                    item.current
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-slate-800 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                  } block border-l-4 py-2 pl-3 pr-4 text-base font-medium`}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
} 