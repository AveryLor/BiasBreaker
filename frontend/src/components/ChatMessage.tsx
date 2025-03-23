import React from 'react';
import { formatDistanceToNow } from 'date-fns';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isLoading?: boolean;
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  
  return (
    <div className={`flex items-start mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="bg-cyan-900/50 rounded-full p-2 mr-3 border border-cyan-700/50 flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
      )}
      
      <div 
        className={`rounded-lg p-3 max-w-md border ${
          isUser 
            ? 'bg-fuchsia-900/40 border-fuchsia-700/30 ml-auto' 
            : 'bg-black/70 border-cyan-900/30'
        }`}
      >
        <p className="text-gray-300 whitespace-pre-wrap">{message.content}</p>
        <div className="mt-1 text-xs text-gray-500">
          {formatDistanceToNow(message.timestamp, { addSuffix: true })}
        </div>
      </div>
      
      {isUser && (
        <div className="bg-gradient-to-r from-fuchsia-600 to-fuchsia-800 rounded-full p-2 ml-3 flex-shrink-0 shadow-[0_0_5px_rgba(255,0,255,0.5)]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default ChatMessage; 