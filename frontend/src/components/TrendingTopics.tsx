'use client';

import { FireIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

interface TrendingTopic {
  id: string;
  title: string;
  count: number;
}

interface TrendingTopicsProps {
  topics: TrendingTopic[];
}

export default function TrendingTopics({ topics = [] }: TrendingTopicsProps) {
  // Sample data if none provided
  const defaultTopics: TrendingTopic[] = [
    { id: 'climate-change', title: 'Climate Change Policy', count: 24 },
    { id: 'ai-ethics', title: 'AI Ethics and Regulation', count: 18 },
    { id: 'healthcare-reform', title: 'Healthcare Reform', count: 15 },
    { id: 'education-policy', title: 'Education Policy', count: 12 },
    { id: 'economic-inequality', title: 'Economic Inequality', count: 10 },
  ];

  const displayTopics = topics.length > 0 ? topics : defaultTopics;

  return (
    <div className="mt-8">
      <div className="flex items-center mb-4">
        <FireIcon className="h-5 w-5 text-red-500 mr-2" />
        <h2 className="text-xl font-semibold text-white dark:text-white">Trending Topics</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayTopics.map((topic) => (
          <Link
            key={topic.id}
            href={`/compare?topic=${encodeURIComponent(topic.title)}`}
            className="group p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
          >
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {topic.title}
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                {topic.count}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Multiple perspectives available
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}