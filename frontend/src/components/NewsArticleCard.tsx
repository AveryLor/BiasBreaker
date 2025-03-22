import React from 'react';
import { Article } from '../data/dummyData';

interface NewsArticleCardProps {
  article: Article;
}

const getPerspectiveColor = (perspective: string): string => {
  switch (perspective) {
    case 'Liberal':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'Conservative':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'Centrist':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'Progressive':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'Libertarian':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const NewsArticleCard: React.FC<NewsArticleCardProps> = ({ article }) => {
  const perspectiveClass = getPerspectiveColor(article.perspective);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{article.source}</span>
          <span className={`text-xs px-2 py-1 rounded-full ${perspectiveClass}`}>
            {article.perspective}
          </span>
        </div>
        <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-200">{article.title}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">{article.excerpt}</p>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">{article.date}</span>
          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors duration-300"
          >
            Read More
          </a>
        </div>
      </div>
    </div>
  );
};

export default NewsArticleCard; 