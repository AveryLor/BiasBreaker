import React from 'react';
import { Article } from '../data/dummyData';

interface NewsArticleCardProps {
  article: Article;
}

const getPerspectiveColor = (perspective: string): string => {
  switch (perspective) {
    case 'Liberal':
      return 'bg-blue-900/50 text-blue-300 border border-blue-700/60';
    case 'Conservative':
      return 'bg-red-900/50 text-red-300 border border-red-700/60';
    case 'Centrist':
      return 'bg-purple-900/50 text-purple-300 border border-purple-700/60';
    case 'Progressive':
      return 'bg-green-900/50 text-green-300 border border-green-700/60';
    case 'Libertarian':
      return 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/60';
    default:
      return 'bg-gray-800/50 text-gray-300 border border-gray-700/60';
  }
};

const NewsArticleCard: React.FC<NewsArticleCardProps> = ({ article }) => {
  const perspectiveClass = getPerspectiveColor(article.perspective);
  
  return (
    <div className="bg-black/40 backdrop-blur-sm rounded-lg shadow-[0_0_10px_rgba(0,255,255,0.1)] overflow-hidden hover:shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-shadow duration-300 border border-cyan-900/50">
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <span className="text-sm font-medium text-cyan-400">{article.source}</span>
          <span className={`text-xs px-2 py-1 rounded-full ${perspectiveClass}`}>
            {article.perspective}
          </span>
        </div>
        <h3 className="text-lg font-bold mb-2 text-gray-100">{article.title}</h3>
        <p className="text-gray-300 mb-4 text-sm">{article.excerpt}</p>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">{article.date}</span>
          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-3 py-1 bg-fuchsia-600 text-white text-sm rounded hover:bg-fuchsia-700 transition-colors duration-300"
          >
            Read More
          </a>
        </div>
      </div>
    </div>
  );
};

export default NewsArticleCard; 