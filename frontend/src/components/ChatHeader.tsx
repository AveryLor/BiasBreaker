import React from 'react';

interface ChatHeaderProps {
  onReset: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ onReset }) => {
  return (
    <div className="flex items-center justify-between mb-6 p-4 bg-black/40 border border-cyan-900/50 rounded-lg">
      <div className="flex items-center">
        <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-cyan-900 to-fuchsia-900 rounded-full mr-3 shadow-[0_0_5px_rgba(0,255,255,0.5)]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-fuchsia-400 text-transparent bg-clip-text">News Assistant</h2>
      </div>
      
      <button 
        onClick={onReset}
        className="px-3 py-1.5 text-sm bg-black/50 text-fuchsia-400 rounded-md border border-fuchsia-800/50 hover:bg-fuchsia-900/30 transition-colors flex items-center gap-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Reset Chat
      </button>
    </div>
  );
};

export default ChatHeader; 