import React, { useRef, useEffect } from 'react';
import ChatMessage, { Message } from './ChatMessage';
import { Article, MergedArticle } from '@/data/dummyData';
import NewsArticleCard from './NewsArticleCard';
import MergedArticleComponent from './MergedArticle';

interface ChatFeedProps {
  messages: Message[];
  articles: Article[] | null;
  mergedArticle: MergedArticle | null;
  isLoading: boolean;
  selectedPerspective: string | null;
}

const ChatFeed: React.FC<ChatFeedProps> = ({ 
  messages, 
  articles, 
  mergedArticle, 
  isLoading,
  selectedPerspective
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Filter articles based on perspective
  const filteredArticles = articles?.filter(article => {
    // Filter by perspective if selected
    const perspectiveMatch = selectedPerspective 
      ? article.perspective === selectedPerspective
      : true;
    
    return perspectiveMatch;
  }) || [];

  return (
    <div className="flex flex-col space-y-6 mb-6">
      {/* Messages */}
      <div className="space-y-4 mb-6">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        {/* Show articles after assistant's last message about search results */}
        {articles && articles.length > 0 && messages.length > 0 && messages[messages.length - 1].sender === 'assistant' && (
          <div className="mt-8 space-y-6">
            {/* AI-Generated Summary */}
            {mergedArticle && (
              <div className="border-t border-cyan-800/40 pt-4 mt-4">
                <h3 className="text-lg font-medium text-cyan-400 mb-2">Neutral Article Summary</h3>
                <MergedArticleComponent mergedArticle={mergedArticle} />
              </div>
            )}
            
            {/* Original Articles */}
            {filteredArticles.length > 0 && (
              <div className="border-t border-cyan-800/40 pt-4 mt-4">
                <h3 className="text-lg font-medium text-cyan-400 mb-2">
                  Original Articles ({filteredArticles.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredArticles.map((article) => (
                    <NewsArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatFeed; 