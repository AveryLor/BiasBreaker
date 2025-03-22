'use client';

import { HandThumbUpIcon, HandThumbDownIcon, ShareIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

interface Source {
  name: string;
  url: string;
  category: 'mainstream' | 'independent' | 'underrepresented';
}

interface SynthesizedArticleProps {
  title: string;
  content: string;
  sources: Source[];
  topic: string;
  date: string;
  deiSettings?: string[];
}

export default function SynthesizedArticle({
  title,
  content,
  sources,
  topic,
  date,
  deiSettings = [],
}: SynthesizedArticleProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);

  // Format date
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Split content into paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim() !== '');

  return (
    <article className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:p-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900 dark:text-white">{title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>Generated on {formattedDate}</span>
          <span className="text-gray-400">•</span>
          <span>Topic: {topic}</span>
          {deiSettings.length > 0 && (
            <>
              <span className="text-gray-400">•</span>
              <span>DEI Focus: {deiSettings.map(s => s.replace('-', ' ')).join(', ')}</span>
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="prose dark:prose-invert max-w-none mb-8">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="mb-4 text-gray-700 dark:text-gray-300">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Sources */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-8">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Sources</h3>
        <ul className="space-y-2">
          {sources.map((source, index) => {
            // Define badge color based on category
            const badgeColor = {
              mainstream: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
              independent: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
              underrepresented: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
            }[source.category];

            return (
              <li key={index} className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${badgeColor}`}>
                  {source.category.charAt(0).toUpperCase() + source.category.slice(1)}
                </span>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {source.name}
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setFeedback('positive')}
            className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm ${
              feedback === 'positive'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <HandThumbUpIcon className="h-4 w-4" />
            <span>Helpful</span>
          </button>
          <button
            onClick={() => setFeedback('negative')}
            className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm ${
              feedback === 'negative'
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <HandThumbDownIcon className="h-4 w-4" />
            <span>Not helpful</span>
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button className="flex items-center gap-1 px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <ShareIcon className="h-4 w-4" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </article>
  );
} 