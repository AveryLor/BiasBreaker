'use client';

import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface NewsSource {
  id: string;
  name: string;
  category: 'mainstream' | 'independent' | 'underrepresented';
  ideology: 'liberal' | 'conservative' | 'centrist' | 'undefined';
  title: string;
  content: string;
  url: string;
}

interface ComparisonViewProps {
  topic: string;
  sources: NewsSource[];
}

export default function ComparisonView({ topic, sources }: ComparisonViewProps) {
  const [selectedSourceIndices, setSelectedSourceIndices] = useState<[number, number]>([0, 1]);
  
  // Make sure we have at least 2 sources
  if (sources.length < 2) {
    return (
      <div className="text-center p-8">
        <p>Not enough sources available for comparison.</p>
      </div>
    );
  }

  const handleSourceChange = (position: 0 | 1, direction: 'prev' | 'next') => {
    setSelectedSourceIndices(prev => {
      const newIndices = [...prev] as [number, number];
      
      if (direction === 'next') {
        newIndices[position] = (newIndices[position] + 1) % sources.length;
      } else {
        newIndices[position] = (newIndices[position] - 1 + sources.length) % sources.length;
      }
      
      // Make sure we don't select the same source in both columns
      if (newIndices[0] === newIndices[1]) {
        newIndices[position] = (newIndices[position] + 1) % sources.length;
      }
      
      return newIndices as [number, number];
    });
  };

  // Category badge colors
  const categoryColors = {
    mainstream: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    independent: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    underrepresented: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  };

  // Ideology badge colors
  const ideologyColors = {
    liberal: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    conservative: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    centrist: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    undefined: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
        Comparing Perspectives on: {topic}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[0, 1].map(columnIndex => {
          const sourceIndex = selectedSourceIndices[columnIndex];
          const source = sources[sourceIndex];
          
          return (
            <div key={columnIndex} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              {/* Source header with navigation */}
              <div className="border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex justify-between items-center mb-3">
                  <button 
                    onClick={() => handleSourceChange(columnIndex as 0 | 1, 'prev')}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Previous source"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  
                  <div className="text-center">
                    <h3 className="font-medium text-gray-900 dark:text-white">{source.name}</h3>
                    <div className="flex gap-2 justify-center mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[source.category]}`}>
                        {source.category.charAt(0).toUpperCase() + source.category.slice(1)}
                      </span>
                      {source.ideology !== 'undefined' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${ideologyColors[source.ideology]}`}>
                          {source.ideology.charAt(0).toUpperCase() + source.ideology.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleSourceChange(columnIndex as 0 | 1, 'next')}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Next source"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
                
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{source.title}</h4>
              </div>
              
              {/* Source content */}
              <div className="p-4 h-[500px] overflow-y-auto">
                <div className="prose dark:prose-invert max-w-none">
                  {source.content.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="mb-4 text-gray-700 dark:text-gray-300">
                      {paragraph}
                    </p>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <a 
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Read full article on {source.name}
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 