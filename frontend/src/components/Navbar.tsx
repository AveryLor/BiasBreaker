'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Disclosure } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';

const navigationItems = [
  { name: 'Home', href: '/', current: true },
  { name: 'Compare', href: '/compare', current: false }
];

export default function Navbar() {
  const pathname = usePathname();
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
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
