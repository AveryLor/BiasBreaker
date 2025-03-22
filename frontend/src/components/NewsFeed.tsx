import React, { useState, useEffect } from 'react';
import NewsArticleCard from './NewsArticleCard';
import MergedArticle from './MergedArticle';
import ChatbotInput from './ChatbotInput';
import { dummyNewsData } from '../data/dummyData';

interface NewsFeedProps {
  initialTopic?: string | null;
}

const NewsFeed: React.FC<NewsFeedProps> = ({ initialTopic }) => {
  const [selectedPerspective, setSelectedPerspective] = useState<string | null>(null);
  const [searchTopic, setSearchTopic] = useState<string | null>(null);
  const [showArticles, setShowArticles] = useState<boolean>(false);
  
  // Use the initialTopic when provided
  useEffect(() => {
    if (initialTopic) {
      setSearchTopic(initialTopic);
      setShowArticles(true);
    }
  }, [initialTopic]);
  
  // Filter articles based on both perspective and search topic
  const filteredArticles = dummyNewsData.articles.filter(article => {
    // Filter by perspective if selected
    const perspectiveMatch = selectedPerspective 
      ? article.perspective === selectedPerspective
      : true;
    
    // Filter by topic if provided
    const topicMatch = searchTopic
      ? article.title.toLowerCase().includes(searchTopic.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchTopic.toLowerCase())
      : true;
    
    return perspectiveMatch && topicMatch;
  });
  
  const perspectives = ['All', 'Liberal', 'Conservative', 'Centrist', 'Progressive', 'Libertarian'];
  
  // Handle topic submission from chatbot
  const handleTopicSubmit = (topic: string) => {
    setSearchTopic(topic);
    setShowArticles(true);
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-cyan-400 to-fuchsia-500 bg-clip-text text-transparent">
        News Perspective Aggregator
      </h1>
      
      {/* Chatbot Input */}
      <ChatbotInput onTopicSubmit={handleTopicSubmit} initialValue={initialTopic} />
      
      {showArticles && (
        <>
          {searchTopic && (
            <div className="mb-4 text-center">
              <span className="text-lg font-medium text-gray-200">
                Showing results for: <span className="font-bold text-cyan-400">{searchTopic}</span>
              </span>
              <button 
                onClick={() => {
                  setSearchTopic(null);
                  setShowArticles(false);
                }}
                className="ml-3 text-sm text-fuchsia-400 hover:text-fuchsia-300 hover:underline"
              >
                Clear search
              </button>
            </div>
          )}
          
          {/* Perspective Filter */}
          <div className="mb-6">
            <div className="flex flex-wrap justify-center gap-2">
              {perspectives.map((perspective) => (
                <button
                  key={perspective}
                  onClick={() => setSelectedPerspective(perspective === 'All' ? null : perspective)}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    (perspective === 'All' && selectedPerspective === null) || perspective === selectedPerspective
                      ? 'bg-fuchsia-600 text-white shadow-[0_0_10px_rgba(255,0,255,0.4)]'
                      : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700 border border-cyan-900/50'
                  }`}
                >
                  {perspective}
                </button>
              ))}
            </div>
          </div>
          
          {/* AI-Generated Summary */}
          <MergedArticle mergedArticle={{
            ...dummyNewsData.mergedArticle,
            title: searchTopic 
              ? `${searchTopic}: A Comprehensive Analysis` 
              : dummyNewsData.mergedArticle.title
          }} />
          
          {/* Individual Articles */}
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent">
            Original Articles {filteredArticles.length > 0 ? `(${filteredArticles.length})` : ''}
          </h2>
          
          {filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <NewsArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-black/40 backdrop-blur-sm rounded-lg border border-cyan-900/50">
              <p className="text-gray-300">
                No articles found for this topic and perspective filter combination.
                Try a different topic or clear the perspective filter.
              </p>
            </div>
          )}
        </>
      )}
      
      {!showArticles && !searchTopic && (
        <div className="text-center py-10 bg-black/40 backdrop-blur-sm rounded-lg border border-cyan-900/50 mt-8">
          <p className="text-gray-300 text-lg">
            Enter a news topic above to see relevant articles and perspectives.
          </p>
        </div>
      )}
    </div>
  );
};

export default NewsFeed; 