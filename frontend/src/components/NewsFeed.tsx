import React, { useState, useEffect } from 'react';
import NewsArticleCard from './NewsArticleCard';
import MergedArticle from './MergedArticle';
import ChatbotInput from './ChatbotInput';
import { dummyNewsData } from '../data/dummyData';
import { sendChatMessage, convertToFrontendArticle, convertToMergedArticle } from '../utils/apiService';
import LoadingState from './LoadingState';

interface NewsFeedProps {
  initialTopic?: string | null;
}

const NewsFeed: React.FC<NewsFeedProps> = ({ initialTopic }) => {
  const [selectedPerspective, setSelectedPerspective] = useState<string | null>(null);
  const [searchTopic, setSearchTopic] = useState<string | null>(null);
  const [showArticles, setShowArticles] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for storing the real data from the backend
  const [articles, setArticles] = useState(dummyNewsData.articles);
  const [mergedArticle, setMergedArticle] = useState(dummyNewsData.mergedArticle);
  
  // Use the initialTopic when provided
  useEffect(() => {
    if (initialTopic) {
      // Check if we're in the URL context with a query parameter
      const urlParams = new URLSearchParams(window.location.search);
      const isFromQueryParam = urlParams.has('query');
      
      if (!isFromQueryParam) {
        // Only auto-submit if not coming from the query parameter (reopenQuery)
        handleTopicSubmit(initialTopic);
      }
    }
  }, [initialTopic]);
  
  // Filter articles based on both perspective and search topic
  const filteredArticles = articles.filter(article => {
    // Filter by perspective if selected
    const perspectiveMatch = selectedPerspective 
      ? article.perspective === selectedPerspective
      : true;
    
    return perspectiveMatch;
  });
  
  const perspectives = ['All', 'Liberals', 'Social Democrats', 'Centrist or Objective', 'Classical Liberals', 'Conservatives'];
  
  // Handle topic submission from chatbot
  const handleTopicSubmit = async (topic: string) => {
    setSearchTopic(topic);
    setShowArticles(true);
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Sending chat message to API:", topic);
      // Call the backend API
      const response = await sendChatMessage(topic);
      console.log("API response received:", response.status);
      
      if (response.status === 'success') {
        // Convert backend articles to frontend format
        const frontendArticles = response.results.map(convertToFrontendArticle);
        setArticles(frontendArticles);
        
        // If there's a neutral article, convert it to the merged article format
        if (response.neutral_article) {
          const frontendMergedArticle = convertToMergedArticle(response.neutral_article);
          setMergedArticle(frontendMergedArticle);
        } else {
          // If no neutral article was generated, create a placeholder
          setMergedArticle({
            title: `${topic}: No Neutral Article Available`,
            summary: "We couldn't generate a neutral article for this topic. This could be due to insufficient source articles or processing limitations.",
            sourcesConsidered: response.results.map(article => 
              article.source_link?.split('/')[2]?.replace('www.', '') || 'Unknown Source'
            )
          });
        }
      } else {
        setError("Failed to get results from the backend");
        console.error("API returned error:", response.message);
      }
    } catch (err) {
      console.error("API call failed:", err);
      setError("An error occurred while fetching the results");
      
      // Fallback to dummy data in case of error
      setArticles(dummyNewsData.articles);
      setMergedArticle({
        ...dummyNewsData.mergedArticle,
        title: `${topic}: A Comprehensive Analysis (Demo Data)`,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-cyan-400 to-fuchsia-500 bg-clip-text text-transparent">
        News Perspective Aggregator
      </h1>
      
      {/* Chatbot Input */}
      <ChatbotInput onTopicSubmit={handleTopicSubmit} initialValue={initialTopic} />
      
      {isLoading && (
        <div className="my-8">
          <LoadingState />
          <p className="text-center text-gray-300 mt-4">Analyzing news sources and generating a neutral perspective...</p>
        </div>
      )}
      
      {error && (
        <div className="my-8 p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-center">
          <p className="text-red-300">{error}</p>
        </div>
      )}
      
      {showArticles && !isLoading && (
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
          <MergedArticle mergedArticle={mergedArticle} />
          
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
      
      {!showArticles && !searchTopic && !isLoading && (
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