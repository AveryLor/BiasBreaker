import React, { useState, useEffect } from 'react';
import NewsArticleCard from './NewsArticleCard';
import MergedArticle from './MergedArticle';
import ChatbotInput from './ChatbotInput';
import { dummyNewsData } from '../data/dummyData';
import { Article, MergedArticle as MergedArticleType, NewsData } from '../data/dummyData';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { sendChatMessage, convertToFrontendArticle, convertToMergedArticle } from '../utils/apiService';
import LoadingState from './LoadingState';

interface NewsFeedProps {
  initialTopic?: string | null;
}

// Default empty state to prevent filter errors
const emptyNewsData: NewsData = {
  articles: [],
  mergedArticle: {
    title: 'No Articles Available',
    summary: 'No articles have been fetched yet. Please search for a topic to see results.',
    sourcesConsidered: []
  }
};

const NewsFeed: React.FC<NewsFeedProps> = ({ initialTopic }) => {
  const { data: session } = useSession();
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
      handleTopicSubmit(initialTopic);
    }
  }, [initialTopic]);
  
  // Fetch articles from our API
  const fetchArticlesByTopic = async (topic: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get authentication token from localStorage or session
      const tokenFromStorage = localStorage.getItem('token');
      // Get token from session with proper fallback
      const tokenFromSession = session?.accessToken || '';
      const authToken = tokenFromStorage || tokenFromSession;
      
      console.log('Authentication state:');
      console.log('- Token from localStorage:', tokenFromStorage ? `${tokenFromStorage.substring(0, 10)}...` : 'null');
      console.log('- Token from session:', tokenFromSession ? `${tokenFromSession.substring(0, 10)}...` : 'null');
      console.log('- User authenticated:', !!authToken);
      console.log('- Session object:', session ? 'exists' : 'null');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header if token is available
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        console.log('- Added Authorization header to request');
      } else {
        console.log('- No Authorization header added (user not authenticated)');
      }
      
      console.log('Making search request for topic:', topic);
      
      const response = await fetch('http://localhost:8000/api/articles/search', {
        method: 'POST',
        headers,
        body: JSON.stringify({ topic }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }
      
      const responseText = await response.text();
      
      // Check if response is empty or invalid JSON
      if (!responseText || responseText.trim() === '') {
        throw new Error('Empty response received');
      }
      
      try {
        const data = JSON.parse(responseText);
        
        if (data.status === 'error') {
          setError(data.message || 'Failed to fetch articles');
          return;
        }
        
        // Validate if data has the expected structure
        const validData: NewsData = {
          articles: Array.isArray(data.results) ? data.results : [],
          mergedArticle: {
            title: data.status === 'success' ? `${topic}: Search Results` : 'No Results',
            summary: `Found ${Array.isArray(data.results) ? data.results.length : 0} articles about "${topic}"`,
            sourcesConsidered: []
          }
        };
        
        setArticles(validData.articles);
        setMergedArticle(validData.mergedArticle);
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError, 'Response was:', responseText);
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError('Failed to fetch articles. Using sample data instead.');
      // Fall back to dummy data
      setArticles(dummyNewsData.articles);
      setMergedArticle(dummyNewsData.mergedArticle);
    } finally {
      setIsLoading(false);
    }
  };
  
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
      // Check if user is authenticated
      const tokenFromStorage = localStorage.getItem('token');
      const tokenFromSession = session?.accessToken || '';
      const isAuthenticated = tokenFromStorage || tokenFromSession;
      
      // If not authenticated, show an alert about search history
      if (!isAuthenticated) {
        console.log('User not authenticated - searches will not be saved to history');
        
        // Show a notification to the user
        const shouldSignIn = window.confirm('Sign in to save your search history. Would you like to sign in now?');
        if (shouldSignIn) {
          // Navigate to sign-in page
          window.location.href = '/auth/signin';
          return; // Stop here if user wants to sign in
        }
      }
      
      const response = await sendChatMessage(topic);
      
      if (response.success) {
        // Update state with received data
        setArticles(response.articles || []);
        setMergedArticle(response.mergedArticle || dummyNewsData.mergedArticle);
      } else {
        setError(response.error || 'Failed to fetch results');
        // Fall back to dummy data
        setArticles(dummyNewsData.articles);
        setMergedArticle(dummyNewsData.mergedArticle);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      setError('Failed to fetch articles. Using sample data instead.');
      // Fall back to dummy data
      setArticles(dummyNewsData.articles);
      setMergedArticle(dummyNewsData.mergedArticle);
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