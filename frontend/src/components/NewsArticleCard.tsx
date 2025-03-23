import React from 'react';
import { Article } from '../data/dummyData';
import { getBiasColor, mapBiasToGroup } from '../utils/apiService';

interface NewsArticleCardProps {
  article: Article;
}

const NewsArticleCard: React.FC<NewsArticleCardProps> = ({ article }) => {
  // If the article has a biasScore, use it to calculate the bias group and color
  // Otherwise fall back to using the perspective string directly
  const biasGroup = article.biasScore !== undefined 
    ? mapBiasToGroup(article.biasScore)
    : { score: 0, label: article.perspective };
  
  const perspectiveClass = article.biasScore !== undefined
    ? getBiasColor(article.biasScore)
    : getPerspectiveColor(article.perspective);
  
  return (
    <div className="bg-black/40 backdrop-blur-sm rounded-lg shadow-[0_0_10px_rgba(0,255,255,0.1)] overflow-hidden hover:shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-shadow duration-300 border border-cyan-900/50">
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <span className="text-sm font-medium text-cyan-400">{article.source}</span>
          <div className="flex flex-col items-end">
            <span className={`text-xs px-2 py-1 rounded-full ${perspectiveClass} mb-1`}>
              {biasGroup.label}
            </span>
            {article.biasScore !== undefined && (
              <span className="text-xs text-gray-400">
                Score: {article.biasScore}
              </span>
            )}
          </div>
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

// Original color mapper function - kept for backward compatibility
const getPerspectiveColor = (perspective: string): string => {
  switch (perspective) {
    case 'Liberal':
    case 'Liberals':
      return 'bg-blue-900/50 text-blue-300 border border-blue-700/60';
    case 'Conservative':
    case 'Conservatives':
      return 'bg-red-900/50 text-red-300 border border-red-700/60';
    case 'Centrist':
    case 'Centrist or Objective':
      return 'bg-purple-900/50 text-purple-300 border border-purple-700/60';
    case 'Progressive':
    case 'Social Democrats':
      return 'bg-green-900/50 text-green-300 border border-green-700/60';
    case 'Libertarian':
    case 'Classical Liberals':
      return 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/60';
    default:
      return 'bg-gray-800/50 text-gray-300 border border-gray-700/60';
  }
};

export default NewsArticleCard; 