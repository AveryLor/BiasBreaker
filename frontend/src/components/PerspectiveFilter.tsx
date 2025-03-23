import React from 'react';

interface PerspectiveFilterProps {
  selectedPerspective: string | null;
  onSelectPerspective: (perspective: string | null) => void;
  perspectives: string[];
}

const PerspectiveFilter: React.FC<PerspectiveFilterProps> = ({
  selectedPerspective,
  onSelectPerspective,
  perspectives
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-400 mb-2">Filter by perspective:</h3>
      <div className="flex flex-wrap gap-2">
        {perspectives.map((perspective) => (
          <button
            key={perspective}
            onClick={() => onSelectPerspective(perspective === 'All' ? null : perspective)}
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
  );
};

export default PerspectiveFilter; 