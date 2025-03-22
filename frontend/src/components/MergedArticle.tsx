import React from 'react';
import { MergedArticle as MergedArticleType } from '../data/dummyData';

interface MergedArticleProps {
  mergedArticle: MergedArticleType;
}

const MergedArticle: React.FC<MergedArticleProps> = ({ mergedArticle }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900 rounded-full mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">AI-Generated Summary</h2>
      </div>
      
      <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">{mergedArticle.title}</h3>
      <div className="prose max-w-none mb-6">
        {mergedArticle.summary.split('\n\n').map((paragraph, idx) => (
          <p key={idx} className="mb-4 text-gray-700 dark:text-gray-300">{paragraph}</p>
        ))}
      </div>
      
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Sources Considered:</h4>
        <div className="flex flex-wrap gap-2">
          {mergedArticle.sourcesConsidered.map((source, idx) => (
            <span key={idx} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md text-xs">
              {source}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MergedArticle; 