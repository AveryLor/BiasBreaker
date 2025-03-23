import React, { useState } from 'react';
import { MergedArticle as MergedArticleType } from '../data/dummyData';
import { getBiasColor, mapBiasToGroup } from '../utils/apiService';

interface MergedArticleProps {
  mergedArticle: MergedArticleType;
}

const MergedArticle: React.FC<MergedArticleProps> = ({ mergedArticle }) => {
  const [showSources, setShowSources] = useState(false);
  
  return (
    <div className="bg-black/40 backdrop-blur-sm rounded-lg shadow-[0_0_15px_rgba(0,255,255,0.15)] p-6 mb-8 border border-cyan-900/50">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 flex items-center justify-center bg-fuchsia-900/50 rounded-full mr-3 border border-fuchsia-500/50">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-fuchsia-500 bg-clip-text text-transparent">AI-Generated Neutral Article</h2>
      </div>
      
      <h3 className="text-xl font-semibold mb-3 text-gray-100">{mergedArticle.title}</h3>
      <div className="prose max-w-none mb-6">
        {mergedArticle.summary.split('\n\n').map((paragraph, idx) => (
          <p key={idx} className="mb-4 text-gray-300">{paragraph}</p>
        ))}
      </div>
      
      <div className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-cyan-400">Sources Considered:</h4>
          {mergedArticle.sourceArticles && mergedArticle.sourceArticles.length > 0 && (
            <button
              onClick={() => setShowSources(!showSources)}
              className="text-xs text-fuchsia-400 hover:text-fuchsia-300 focus:outline-none"
            >
              {showSources ? 'Hide details' : 'Show details'}
            </button>
          )}
        </div>
        
        {!showSources && (
          <div className="flex flex-wrap gap-2">
            {mergedArticle.sourcesConsidered.map((source, idx) => (
              <span key={idx} className="bg-gray-800/60 text-gray-300 px-2 py-1 rounded-md text-xs border border-cyan-900/50">
                {source}
              </span>
            ))}
          </div>
        )}
        
        {showSources && mergedArticle.sourceArticles && (
          <div className="mt-4 space-y-4">
            {mergedArticle.sourceArticles.map((source, idx) => {
              const biasGroup = mapBiasToGroup(source.biasScore);
              const biasColor = getBiasColor(source.biasScore);
              
              return (
                <div key={idx} className="p-3 bg-black/60 rounded-lg border border-cyan-900/30">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="text-sm font-medium text-gray-200">{source.title}</h5>
                    <div className="flex flex-col items-end">
                      <span className={`text-xs px-2 py-1 rounded-full ${biasColor} mb-1`}>
                        {biasGroup.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        Score: {source.biasScore}
                      </span>
                    </div>
                  </div>
                  
                  {source.summary && source.summary.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {source.summary.map((bullet, i) => (
                        <li key={i} className="text-xs text-gray-400">{bullet}</li>
                      ))}
                    </ul>
                  )}
                  
                  {source.sourceLink && (
                    <a 
                      href={source.sourceLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:text-cyan-300 mt-2 inline-block"
                    >
                      View original source
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MergedArticle; 