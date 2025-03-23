'use client';

import { useState } from 'react';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export default function InfoBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="w-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 my-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300">About this service</h3>
          <div className="mt-2 text-sm text-blue-600 dark:text-blue-200">
            <p className="mb-1">
              BiasBreaker aggregates news from multiple sources and generates balanced articles by:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Scanning reputable sources across the ideological spectrum</li>
              <li>Prioritizing underrepresented voices and perspectives</li>
              <li>Using AI to synthesize balanced, comprehensive coverage</li>
              <li>Providing transparent source attribution</li>
            </ul>
          </div>
        </div>
        <div className="ml-auto">
          <button
            type="button"
            className="inline-flex rounded-md p-1.5 text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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