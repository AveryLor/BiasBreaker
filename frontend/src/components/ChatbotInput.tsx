import React, { useState, useRef, useEffect } from 'react';

interface ChatbotInputProps {
  onTopicSubmit: (topic: string) => void;
  initialValue?: string | null;
}

const ChatbotInput: React.FC<ChatbotInputProps> = ({ onTopicSubmit, initialValue }) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle the initialValue if provided
  useEffect(() => {
    if (initialValue && !sentMessage) {
      setSentMessage(initialValue);
      // We don't need to call onTopicSubmit here because the parent component 
      // already knows about this topic (it provided it)
    }
  }, [initialValue, sentMessage]);

  useEffect(() => {
    // Focus the input on component mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSentMessage(inputValue.trim());
      onTopicSubmit(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-full mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">News Assistant</h2>
      </div>

      <div className="mb-4">
        <div className="flex items-start mb-4">
          <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2 mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 max-w-md">
            <p className="text-gray-700 dark:text-gray-300">
              What news topic are you interested in learning about today? Type a subject like "Climate Change", "AI Regulation", or "Global Economy".
            </p>
          </div>
        </div>
        
        {sentMessage && (
          <div className="flex items-start justify-end mb-4">
            <div className="bg-indigo-100 dark:bg-indigo-900 rounded-lg p-3 max-w-md">
              <p className="text-gray-700 dark:text-gray-300">{sentMessage}</p>
            </div>
            <div className="bg-indigo-500 rounded-full p-2 ml-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsTyping(true);
          }}
          placeholder="Enter a news topic..."
          className="w-full p-4 pr-16 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default ChatbotInput; 