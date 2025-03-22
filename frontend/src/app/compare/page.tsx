'use client';

import React, { useEffect, useState } from 'react';
import NewsFeed from '@/components/NewsFeed';
import { useSearchParams } from 'next/navigation';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <NewsFeed initialTopic={initialTopic} />
    </div>
  );
} 