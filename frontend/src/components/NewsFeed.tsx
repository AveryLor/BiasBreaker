import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import NewsArticleCard from './NewsArticleCard';
import MergedArticleComponent from './MergedArticle';
import ChatbotInput from './ChatbotInput';
import { dummyNewsData, Article, MergedArticle } from '../data/dummyData';
import { sendChatMessage, convertToFrontendArticle, convertToMergedArticle } from '../utils/apiService';
import LoadingState from './LoadingState';
import ChatHeader from './ChatHeader';
import ChatFeed from './ChatFeed';
import PerspectiveFilter from './PerspectiveFilter';
import TypingIndicator from './TypingIndicator';
import { Message } from './ChatMessage';

interface NewsFeedProps {
  initialTopic?: string | null;
}

const NewsFeed: React.FC<NewsFeedProps> = ({ initialTopic }) => {
  const [selectedPerspective, setSelectedPerspective] = useState<string | null>(null);
  const [searchTopic, setSearchTopic] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  
  // State for storing the real data from the backend
  const [articles, setArticles] = useState<Article[]>([]);
  const [mergedArticle, setMergedArticle] = useState<MergedArticle | null>(null);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uuidv4(),
      content: "Hello! I'm here to help you explore news topics from multiple angles. What would you like to know about today?",
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  
  // Perspectives
  const perspectives = ['All', 'Liberals', 'Social Democrats', 'Centrist or Objective', 'Classical Liberals', 'Conservatives'];
  
  // Use the initialTopic when provided
  useEffect(() => {
    if (initialTopic) {
      // Check if we're in the URL context with a query parameter
      const urlParams = new URLSearchParams(window.location.search);
      const isFromQueryParam = urlParams.has('query');
      
      if (isFromQueryParam) {
        // Add the query to the chat as a user message
        handleSendMessage(initialTopic);
      } else {
        // Only auto-submit if not coming from the query parameter
        handleSendMessage(initialTopic);
      }
    }
  }, [initialTopic]);
  
  // Handle sending a new message
  const handleSendMessage = async (message: string) => {
    // Add user message to chat
    const userMessage: Message = {
      id: uuidv4(),
      content: message,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Sending chat message to API:", message);
      
      // Add a small delay to simulate typing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call the backend API
      const response = await sendChatMessage(message);
      console.log("API response received:", response.status);
      
      if (response.status === 'success') {
        // Set the search topic
        setSearchTopic(message);
        
        // Convert backend articles to frontend format
        const frontendArticles = response.results.map(convertToFrontendArticle);
        setArticles(frontendArticles);
        
        // If there's a neutral article, convert it to the merged article format
        let neutralArticleText = '';
        if (response.neutral_article) {
          const frontendMergedArticle = convertToMergedArticle(response.neutral_article);
          setMergedArticle(frontendMergedArticle);
          neutralArticleText = `They are listed below, along with a balanced summary I created to give you a neutral perspective.`;
        } else {
          // If no neutral article was generated, create a placeholder
          setMergedArticle({
            title: `${message}: No Neutral Article Available`,
            summary: "We couldn't generate a neutral article for this topic. This could be due to insufficient source articles or processing limitations.",
            sourcesConsidered: response.results.map(article => 
              article.source_link?.split('/')[2]?.replace('www.', '') || 'Unknown Source'
            )
          });
          neutralArticleText = `They are listed below. I wasn't able to generate a neutral summary for this specific topic.`;
        }
        
        // Add assistant response message
        const assistantMessage: Message = {
          id: uuidv4(),
          content: `I've found ${frontendArticles.length} relevant articles on "${message}". ${neutralArticleText}`,
          sender: 'assistant',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        setError("Failed to get results from the backend");
        console.error("API returned error:", response.message);
        
        // Add error message
        const errorMessage: Message = {
          id: uuidv4(),
          content: `I'm sorry, I couldn't find information on that topic. ${response.message || 'Please try a different query.'}`,
          sender: 'assistant',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (err) {
      console.error("API call failed:", err);
      setError("An error occurred while fetching the results");
      
      // Add error message
      const errorMessage: Message = {
        id: uuidv4(),
        content: "I'm sorry, I encountered an error while processing your request. Please try again later.",
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      // Fallback to dummy data in case of error
      setArticles(dummyNewsData.articles);
      setMergedArticle({
        ...dummyNewsData.mergedArticle,
        title: `${message}: A Comprehensive Analysis (Demo Data)`,
      });
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };
  
  // Reset chat
  const handleResetChat = () => {
    setMessages([
      {
        id: uuidv4(),
        content: "Hello! I'm here to help you explore news topics from multiple angles. What would you like to know about today?",
        sender: 'assistant',
        timestamp: new Date()
      }
    ]);
    setSearchTopic(null);
    setArticles([]);
    setMergedArticle(null);
    setSelectedPerspective(null);
    setError(null);
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold text-center mt-4 mb-10 pt-4 bg-gradient-to-r from-cyan-400 to-fuchsia-500 bg-clip-text text-transparent">
        Interactive News Assistant
      </h1>
      
      <div className="flex flex-col">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg shadow-[0_0_10px_rgba(0,255,255,0.2)] p-6 mb-8 border border-cyan-900/50">
          {/* Chat Header with Reset Button */}
          <ChatHeader onReset={handleResetChat} />
          
          {/* Chat Messages */}
          <div className="mb-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <ChatFeed 
              messages={messages} 
              articles={messages.length > 1 ? articles : null} 
              mergedArticle={messages.length > 1 ? mergedArticle : null}
              isLoading={isLoading}
              selectedPerspective={selectedPerspective}
            />
            
            {/* Typing indicator */}
            {isTyping && <TypingIndicator />}
          </div>
          
          {/* Perspective Filter - Only show when articles are present */}
          {articles.length > 0 && (
            <div className="mb-6">
              <PerspectiveFilter
                selectedPerspective={selectedPerspective}
                onSelectPerspective={setSelectedPerspective}
                perspectives={perspectives}
              />
            </div>
          )}
          
          {/* Error display */}
          {error && (
            <div className="my-4 p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-center">
              <p className="text-red-300">{error}</p>
            </div>
          )}
          
          {/* Chat Input */}
          <ChatbotInput 
            onSendMessage={handleSendMessage} 
            initialValue={initialTopic} 
            isDisabled={isLoading || isTyping}
          />
        </div>
      </div>
    </div>
  );
};

export default NewsFeed; 