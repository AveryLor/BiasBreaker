'use client';

import InfoBanner from "@/components/InfoBanner";
import TrendingTopics from "@/components/TrendingTopics";
import Link from "next/link";
import FuturisticCityscape from "@/components/three/FuturisticCityscape";
import { useState, useEffect, useRef, ReactNode } from "react";
import { Outfit } from 'next/font/google';

const outfit = Outfit({ subsets: ['latin'] });

// Sample news articles for the cityscape
const sampleArticles = [
  {
    id: 1,
    title: "Explore AI-powered news analysis from global sources",
    source: "GenesisAI",
    category: "Technology"
  },
  {
    id: 2,
    title: "Discover diverse perspectives on current events",
    source: "GenesisAI",
    category: "News"
  },
  {
    id: 3,
    title: "Synthesizing balanced insights from multiple viewpoints",
    source: "GenesisAI",
    category: "Analysis"
  },
  {
    id: 4,
    title: "Amplifying underrepresented voices in the media landscape",
    source: "GenesisAI",
    category: "DEI"
  },
  {
    id: 5,
    title: "The future of news is balanced, informed and inclusive",
    source: "GenesisAI",
    category: "Future"
  }
];

// Scroll-reveal component with proper type definitions
interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
}

function ScrollReveal({ children, delay = 0 }: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
          observer.disconnect();
        }
      },
      { threshold: 0.085 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => {
      if (ref.current) {
        observer.disconnect();
      }
    };
  }, [delay]);
  
  return (
    <div 
      ref={ref}
      className={`transition-all duration-300 transform ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-20'
      }`}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);

  // Wait for component to mount to avoid hydration issues with Three.js
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative overflow-hidden w-full">
      {/* Full page container with single scroll */}
      <div className="relative min-h-screen bg-black">
        {/* Cityscape hero section - 100vh */}
        <div className="relative h-screen w-full">
          {/* Cityscape background */}
          <div className="absolute inset-0 w-full h-full">
            {mounted && <FuturisticCityscape newsArticles={sampleArticles} />}
          </div>
          
          {/* Hero content overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <div className="bg-black/20 backdrop-blur-sm p-8 rounded-lg max-w-3xl">
              <h1 className={`${outfit.className} text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-fuchsia-500 bg-clip-text text-transparent`}>
                News From Every Perspective
              </h1>
              <p className="text-lg md:text-xl text-gray-100 max-w-3xl mx-auto mb-6">
                Discover balanced, AI-generated news that synthesizes diverse viewpoints, including underrepresented voices.
              </p>
              <div className="flex justify-center w-full">
                <Link 
                  href="/compare" 
                  className="px-6 py-3 bg-fuchsia-600 text-white font-medium rounded-lg hover:bg-fuchsia-700 transition-colors"
                >
                  Try Article Comparison
                </Link>
              </div>
            </div>
          </div>
          
          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center text-white animate-bounce">
            <span className="text-sm font-medium mb-2">Scroll to explore</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
        
        {/* Content sections that appear on scroll */}
        <div className="relative z-10 bg-gradient-to-b from-black to-gray-900 pt-16 pb-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Info Banner */}
            <ScrollReveal>
              <div className="my-12 bg-black/30 backdrop-blur-sm rounded-lg shadow-[0_0_15px_rgba(0,255,255,0.15)] p-4 border border-cyan-900/50">
                <InfoBanner />
              </div>
            </ScrollReveal>

            {/* How It Works */}
            <ScrollReveal delay={100}>
              <div className="my-16 bg-black/30 backdrop-blur-sm rounded-lg shadow-[0_0_15px_rgba(0,255,255,0.15)] p-6 border border-cyan-900/50">
                <h2 className="text-2xl font-semibold mb-6 text-white">How It Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="p-6 border border-cyan-800/50 rounded-lg bg-black/40 transform transition-transform hover:scale-105">
                    <div className="text-cyan-400 text-xl font-bold mb-3">1. Search</div>
                    <p className="text-gray-300">
                      Enter any news topic to find diverse perspectives from across the web.
                    </p>
                  </div>
                  <div className="p-6 border border-cyan-800/50 rounded-lg bg-black/40 transform transition-transform hover:scale-105">
                    <div className="text-cyan-400 text-xl font-bold mb-3">2. Analyze</div>
                    <p className="text-gray-300">
                      Our AI categorizes articles by source type and ideological stance.
                    </p>
                  </div>
                  <div className="p-6 border border-cyan-800/50 rounded-lg bg-black/40 transform transition-transform hover:scale-105">
                    <div className="text-cyan-400 text-xl font-bold mb-3">3. Synthesize</div>
                    <p className="text-gray-300">
                      Receive a balanced AI-generated article that includes all perspectives.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
            
            {/* DEI Focus */}
            <ScrollReveal delay={150}>
              <div className="my-16 bg-black/30 backdrop-blur-sm rounded-lg shadow-[0_0_15px_rgba(255,0,255,0.15)] p-6 border border-fuchsia-900/50">
                <h2 className="text-2xl font-semibold mb-6 text-white">DEI Focus</h2>
                <p className="text-gray-300 mb-6 text-lg">
                  Customize your news experience to prioritize diverse and underrepresented voices:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start space-x-3">
                    <span className="inline-block w-3 h-3 bg-cyan-500 rounded-full mt-1.5"></span>
                    <div>
                      <h3 className="text-white font-medium text-lg">Indigenous perspectives</h3>
                      <p className="text-gray-400">Amplifying voices often excluded from mainstream coverage</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="inline-block w-3 h-3 bg-fuchsia-500 rounded-full mt-1.5"></span>
                    <div>
                      <h3 className="text-white font-medium text-lg">LGBTQ+ voices</h3>
                      <p className="text-gray-400">Inclusive reporting on issues affecting the LGBTQ+ community</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="inline-block w-3 h-3 bg-cyan-400 rounded-full mt-1.5"></span>
                    <div>
                      <h3 className="text-white font-medium text-lg">Global South reporting</h3>
                      <p className="text-gray-400">Coverage from regions typically underrepresented in global news</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="inline-block w-3 h-3 bg-fuchsia-400 rounded-full mt-1.5"></span>
                    <div>
                      <h3 className="text-white font-medium text-lg">Disability community insights</h3>
                      <p className="text-gray-400">Stories and perspectives from people with disabilities</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Trending Topics */}
            <ScrollReveal delay={200}>
              <div className="mb-0 bg-black/30 backdrop-blur-sm rounded-lg shadow-[0_0_15px_rgba(0,255,255,0.15)] p-6 border border-cyan-900/50">
                <TrendingTopics topics={[]} />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
}
