'use client';

import { useState } from 'react';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export default function InfoBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="w-full bg-gray-900/90 border border-indigo-900/40 rounded-lg p-6 my-4 shadow-lg backdrop-blur-sm">
      <div className="flex">
        <div className="flex-shrink-0">
          <InformationCircleIcon className="h-5 w-5 text-cyan-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-base font-medium text-white">About this service</h3>
          <div className="mt-2 text-sm text-gray-300">
            <p className="mb-2">
              BiasBreaker aggregates news from multiple sources and generates balanced articles by:
            </p>
            <ul className="space-y-2 pl-5">
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-cyan-500 rounded-full mt-1.5 mr-2"></span>
                <span>Scanning reputable sources across the ideological spectrum</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-cyan-500 rounded-full mt-1.5 mr-2"></span>
                <span>Prioritizing underrepresented voices and perspectives</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-cyan-500 rounded-full mt-1.5 mr-2"></span>
                <span>Using AI to synthesize balanced, comprehensive coverage</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-cyan-500 rounded-full mt-1.5 mr-2"></span>
                <span>Providing transparent source attribution</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="ml-auto">
          <button
            type="button"
            className="inline-flex rounded-md p-1.5 text-gray-400 hover:text-white hover:bg-gray-800/50 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            onClick={() => setIsVisible(false)}
          >
            <span className="sr-only">Dismiss</span>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
} 