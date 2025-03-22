import Image from 'next/image';
import { NewspaperIcon } from '@heroicons/react/24/outline';

interface NewsCardProps {
  title: string;
  source: string;
  description: string;
  imageUrl?: string;
  sourceCategory?: 'mainstream' | 'independent' | 'underrepresented';
  ideology?: 'liberal' | 'conservative' | 'centrist' | 'undefined';
  url: string;
  date: string;
}

export default function NewsCard({
  title,
  source,
  description,
  imageUrl,
  sourceCategory = 'mainstream',
  ideology = 'undefined',
  url,
  date,
}: NewsCardProps) {
  
  // Format the date
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Badge color based on source category
  const categoryColors = {
    mainstream: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    independent: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    underrepresented: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  };

  // Badge color based on ideology
  const ideologyColors = {
    liberal: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    conservative: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    centrist: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    undefined: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 w-full bg-gray-200 dark:bg-gray-700">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <NewspaperIcon className="h-16 w-16 text-gray-400 dark:text-gray-500" />
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-2 mb-2">
          <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[sourceCategory]}`}>
            {sourceCategory.charAt(0).toUpperCase() + sourceCategory.slice(1)}
          </span>
          {ideology !== 'undefined' && (
            <span className={`text-xs px-2 py-1 rounded-full ${ideologyColors[ideology]}`}>
              {ideology.charAt(0).toUpperCase() + ideology.slice(1)}
            </span>
          )}
        </div>
        <h3 className="text-lg font-semibold mb-1 line-clamp-2 text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{source} • {formattedDate}</p>
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mb-4">{description}</p>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Read full article
        </a>
      </div>
    </div>
  );
} 