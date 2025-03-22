'use client';

import { useState } from 'react';
import { AdjustmentsHorizontalIcon, CheckIcon } from '@heroicons/react/24/outline';

interface DEIOption {
  id: string;
  label: string;
  description: string;
}

const deiOptions: DEIOption[] = [
  {
    id: 'indigenous',
    label: 'Indigenous Voices',
    description: 'Prioritize perspectives from Indigenous communities',
  },
  {
    id: 'lgbtq',
    label: 'LGBTQ+ Perspectives',
    description: 'Emphasize viewpoints from LGBTQ+ sources',
  },
  {
    id: 'global-south',
    label: 'Global South',
    description: 'Focus on perspectives from developing nations',
  },
  {
    id: 'disability',
    label: 'Disability Perspectives',
    description: 'Highlight voices from the disability community',
  },
  {
    id: 'minority',
    label: 'Ethnic Minorities',
    description: 'Prioritize perspectives from ethnic minority groups',
  }
];

interface DEISettingsProps {
  onSettingsChange?: (settings: string[]) => void;
}

export default function DEISettings({ onSettingsChange }: DEISettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const toggleOption = (optionId: string) => {
    setSelectedOptions(prev => {
      const newOptions = prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId];
      
      if (onSettingsChange) {
        onSettingsChange(newOptions);
      }
      
      return newOptions;
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <AdjustmentsHorizontalIcon className="h-5 w-5" />
        <span>DEI Settings</span>
        {selectedOptions.length > 0 && (
          <span className="ml-1.5 px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs rounded-full">
            {selectedOptions.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Prioritize Diverse Voices</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Select voices to prioritize in your news synthesis
            </p>
            <ul className="space-y-2">
              {deiOptions.map((option) => (
                <li key={option.id}>
                  <button
                    onClick={() => toggleOption(option.id)}
                    className={`flex items-start w-full px-3 py-2 rounded-md text-left transition-colors ${
                      selectedOptions.includes(option.id)
                        ? 'bg-blue-50 dark:bg-blue-900/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className={`flex-shrink-0 h-5 w-5 mr-2 rounded border ${
                      selectedOptions.includes(option.id)
                        ? 'bg-blue-500 border-blue-500 flex items-center justify-center'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {selectedOptions.includes(option.id) && (
                        <CheckIcon className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {option.description}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 text-right rounded-b-md">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 