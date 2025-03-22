'use client';

import React, { useEffect, useState } from 'react';
import NewsFeed from '@/components/NewsFeed';
import { useSearchParams } from 'next/navigation';

// Sample news articles for the cityscape background
const sampleArticles = [
  {
    id: 1,
    title: "Compare perspectives from multiple news sources",
    source: "GenesisAI",
    category: "Analysis"
  },
  {
    id: 2,
    title: "See all sides of complex news stories",
    source: "GenesisAI",
    category: "Comparison"
  },
  {
    id: 3,
    title: "Discover balanced insights on current events",
    source: "GenesisAI",
    category: "News"
  },
  {
    id: 4,
    title: "Unbiased analysis from diverse viewpoints",
    source: "GenesisAI",
    category: "Politics"
  }
];

export default function ComparePage() {
  const searchParams = useSearchParams();
  const topicParam = searchParams.get('topic');
  const [initialTopic, setInitialTopic] = useState<string | null>(null);

  useEffect(() => {
    // Set the initial topic from URL parameter
    if (topicParam) {
      setInitialTopic(topicParam);
    }
  }, [topicParam]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-black via-gray-900 to-purple-950 homepage-container overflow-x-hidden w-full max-w-full">
      {/* Content */}
      <div className="flex-grow relative z-10 pt-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-black/30 backdrop-blur-sm p-6 rounded-lg shadow-[0_0_15px_rgba(0,255,255,0.15)] border border-cyan-900/50">
            <NewsFeed initialTopic={initialTopic} />
          </div>
        </div>
      </div>
    </div>
  );
} 