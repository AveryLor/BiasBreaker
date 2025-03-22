import React, { useState } from 'react';
import NewsArticleCard from './NewsArticleCard';
import MergedArticle from './MergedArticle';
import { dummyNewsData } from '../data/dummyData';

const NewsFeed: React.FC = () => {
  const [selectedPerspective, setSelectedPerspective] = useState<string | null>(null);
  
  const filteredArticles = selectedPerspective 
    ? dummyNewsData.articles.filter(article => article.perspective === selectedPerspective)
    : dummyNewsData.articles;
    
  const perspectives = ['All', 'Liberal', 'Conservative', 'Centrist', 'Progressive', 'Libertarian'];
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        News Perspective Aggregator
      </h1>
      
      {/* Perspective Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap justify-center gap-2">
          {perspectives.map((perspective) => (
            <button
              key={perspective}
              onClick={() => setSelectedPerspective(perspective === 'All' ? null : perspective)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                (perspective === 'All' && selectedPerspective === null) || perspective === selectedPerspective
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {perspective}
            </button>
          ))}
        </div>
      </div>
      
      {/* AI-Generated Summary */}
      <MergedArticle mergedArticle={dummyNewsData.mergedArticle} />
      
      {/* Individual Articles */}
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Original Articles</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article) => (
          <NewsArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
};

export default NewsFeed; 