import React, { useState, useRef, useEffect } from 'react';

interface ChatbotInputProps {
  onSendMessage: (message: string) => void;
  initialValue?: string | null;
  isDisabled?: boolean;
  placeholder?: string;
}

const ChatbotInput: React.FC<ChatbotInputProps> = ({ 
  onSendMessage, 
  initialValue, 
  isDisabled = false,
  placeholder = "Enter a news topic or follow-up question..."
}) => {
  const [inputValue, setInputValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle the initialValue if provided
  useEffect(() => {
    if (initialValue) {
      // Check if we're in the URL context (e.g., from reopenQuery)
      const urlParams = new URLSearchParams(window.location.search);
      const isFromQueryParam = urlParams.has('query');
      
      if (isFromQueryParam) {
        // Just set the input value without sending
        setInputValue(initialValue);
      }
    }
  }, [initialValue]);

  useEffect(() => {
    // Focus the input on component mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isDisabled) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        disabled={isDisabled}
        className={`w-full p-4 pr-16 rounded-lg border border-cyan-900/50 bg-black/70 text-gray-200 
          focus:outline-none focus:ring-2 focus:ring-fuchsia-500 placeholder-gray-500
          ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      />
      <button
        type="submit"
        disabled={isDisabled || !inputValue.trim()}
        className={`absolute right-2 top-1/2 transform -translate-y-1/2 
          ${inputValue.trim() && !isDisabled 
            ? 'bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white hover:from-cyan-500 hover:to-fuchsia-500' 
            : 'bg-gray-800 text-gray-400 cursor-not-allowed'} 
          p-2 rounded-lg transition-colors shadow-[0_0_5px_rgba(0,255,255,0.5)]`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>
    </form>
  );
};

export default ChatbotInput; 