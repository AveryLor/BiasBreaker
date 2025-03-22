'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import ParticleBackground from '@/components/three/ParticleBackground';
import FloatingCarousel from '@/components/three/FloatingCarousel';
import HoverCard from '@/components/three/HoverCard';
import LoadingGlobe from '@/components/three/LoadingGlobe';

// Define the article interface for proper typing
interface Article {
  id: number;
  title: string;
  source: string;
  image?: string;
}

// Sample articles data
const demoArticles: Article[] = [
  {
    id: 1,
    title: 'The Future of AI: Ethical Considerations and Development Roadmap',
    source: 'TechInsight',
    image: 'https://images.unsplash.com/photo-1677442135636-ff673f018cd0?auto=format&fit=crop&w=500',
  },
  {
    id: 2,
    title: 'Climate Change: Global Leaders Announce New Carbon Reduction Targets',
    source: 'EcoNews',
    image: 'https://images.unsplash.com/photo-1533628635777-112b2239b1c7?auto=format&fit=crop&w=500',
  },
  {
    id: 3,
    title: 'Breakthrough in Quantum Computing: New Qubit Stability Record',
    source: 'ScienceDaily',
    image: 'https://images.unsplash.com/photo-1517373116369-9bdb8cdc9f62?auto=format&fit=crop&w=500',
  },
  {
    id: 4,
    title: 'Global Economy: Inflation Concerns Amid Post-Pandemic Recovery',
    source: 'FinancialTimes',
    image: 'https://images.unsplash.com/photo-1607026151739-9d5e4fdcb1b8?auto=format&fit=crop&w=500',
  },
  {
    id: 5,
    title: 'Healthcare Innovation: mRNA Technology Applications Beyond Vaccines',
    source: 'MedJournal',
    image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=500',
  },
];

// Demo articles for hover cards
const hoverCardArticles = [
  {
    id: 101,
    title: 'Exploring the Deep Ocean: New Species Discovered',
    source: 'Marine Biology Today',
    date: 'March 15, 2023',
    image: 'https://images.unsplash.com/photo-1551244072-5d12893278ab?auto=format&fit=crop&w=500',
    snippet: 'Scientists have discovered five new species of marine life during a deep-sea expedition in the Pacific Ocean. These findings provide new insights into biodiversity and evolutionary adaptation in extreme environments.'
  },
  {
    id: 102,
    title: 'Renewable Energy Revolution: Solar Panel Efficiency Breakthrough',
    source: 'SustainableTech',
    date: 'April 22, 2023',
    image: 'https://images.unsplash.com/photo-1559087867-ce4c91325525?auto=format&fit=crop&w=500',
    snippet: 'Researchers have developed a new type of solar panel that achieves 40% efficiency, a significant improvement over current standards. This development could accelerate the adoption of solar energy worldwide.'
  },
  {
    id: 103,
    title: 'Mental Health in the Digital Age: Balancing Technology and Wellbeing',
    source: 'Health & Mind',
    date: 'May 7, 2023',
    image: 'https://images.unsplash.com/photo-1558401546-97c0c8c05308?auto=format&fit=crop&w=500',
    snippet: 'As digital technologies become increasingly integrated into daily life, experts warn about potential impacts on mental health. New guidelines recommend strategies for maintaining wellbeing in an always-connected world.'
  },
];

export default function ThreeDemoPage() {
  const { theme } = useTheme();
  const [showLoading, setShowLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Toggle loading animation
  const toggleLoading = () => {
    setShowLoading(!showLoading);
  };

  return (
    <main className={`min-h-screen ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
      {/* Background particles */}
      <ParticleBackground />

      {/* Content container */}
      <div className="container mx-auto px-4 py-12">
        <h1 className={`text-3xl font-bold mb-8 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
          Three.js Components Demo
        </h1>

        {/* Loading Animation Demo */}
        <section className="mb-16">
          <h2 className={`text-2xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            Loading Animation
          </h2>
          <div className="mb-4">
            <button
              onClick={toggleLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {showLoading ? 'Hide Loading Animation' : 'Show Loading Animation'}
            </button>
          </div>
          <LoadingGlobe show={showLoading} message="This animation appears during content loading" />
        </section>

        {/* Floating Carousel Demo */}
        <section className="mb-16">
          <h2 className={`text-2xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            3D Carousel
          </h2>
          <div className="mb-4">
            <p className={`mb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              Interactive 3D carousel for featured articles. Click on cards to select, or drag to rotate.
            </p>
            {selectedArticle && (
              <div className={`p-4 mb-4 rounded-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  Selected: {selectedArticle.title}
                </h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  From {selectedArticle.source}
                </p>
              </div>
            )}
          </div>
          <FloatingCarousel 
            articles={demoArticles} 
            onSelect={(article) => setSelectedArticle(article)}
          />
        </section>

        {/* Hover Cards Demo */}
        <section className="mb-16">
          <h2 className={`text-2xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            Interactive Hover Cards
          </h2>
          <p className={`mb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
            News article cards with 3D hover effects. Move your cursor over the cards to see the effect.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {hoverCardArticles.map((article) => (
              <HoverCard
                key={article.id}
                title={article.title}
                source={article.source}
                date={article.date}
                image={article.image}
                snippet={article.snippet}
                onClick={() => console.log(`Selected article: ${article.id}`)}
              />
            ))}
          </div>
        </section>

        {/* Background Particles Info */}
        <section className="mb-16">
          <h2 className={`text-2xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            Particle Background
          </h2>
          <p className={`mb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
            The animated particle system is running in the background of this page. Particles move organically and 
            create connections when they're close to each other.
          </p>
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              These 3D effects enhance the visual appeal of the news aggregator while keeping the focus on the content.
              The animations are optimized for performance and adapt to both light and dark themes.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
} 