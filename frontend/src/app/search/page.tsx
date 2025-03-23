'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoadingState from '@/components/LoadingState';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  
  useEffect(() => {
    // If query is provided, redirect to results page
    if (query) {
      router.push(`/results?q=${encodeURIComponent(query)}`);
    } else {
      // If no query is provided, redirect to home
      router.push('/');
    }
  }, [query, router]);
  
  // Show loading state while redirecting
  return (
    <div className="h-screen flex items-center justify-center">
      <LoadingState message="Redirecting to search results..." />
    </div>
  );
} 