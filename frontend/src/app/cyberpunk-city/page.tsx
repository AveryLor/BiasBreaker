'use client';

import React from 'react';
import CyberpunkCityscape from '@/components/three/CyberpunkCityscape';
import PageTransition from '@/components/three/PageTransition';

export default function CyberpunkCityDemo() {
  // Mock news articles for the demo
  const mockArticles = [
    {
      id: 1,
      title: "Neural Implants Surpass Human Cognition in Clinical Trials",
      source: "NeuraTech",
      category: "Technology"
    },
    {
      id: 2,
      title: "Global Corporation Launches Orbital Habitat for Elite Citizens",
      source: "MegaNews",
      category: "Space"
    },
    {
      id: 3,
      title: "Climate Crisis Escalates: Coastal Cities Deploy Massive Sea Barriers",
      source: "EarthWatch",
      category: "Environment"
    },
    {
      id: 4,
      title: "Synthetic Bloodstream Nanobots Extend Human Lifespan by 30 Years",
      source: "MedTrends",
      category: "Health"
    },
    {
      id: 5,
      title: "Quantum Network Achieves Instant Cross-Continental Communication",
      source: "TechNexus",
      category: "Science"
    },
    {
      id: 6,
      title: "Corporate AI Systems Granted Legal Personhood Status",
      source: "LegalBytes",
      category: "Law"
    },
    {
      id: 7,
      title: "Underground Resistance Hacks Megacorp Security Systems",
      source: "DataRebel",
      category: "Security"
    },
    {
      id: 8,
      title: "Synthetic Food Crisis: Lab-Grown Protein Supplies Contaminated",
      source: "NutriTech",
      category: "Food"
    },
    {
      id: 9,
      title: "Memory Implant Technology Enables Direct Skill Transfers",
      source: "NeuroCorp",
      category: "Education"
    },
    {
      id: 10,
      title: "Urban Sprawl Reaches 200 Levels as Megacities Go Vertical",
      source: "UrbanFuture",
      category: "Architecture"
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-5xl font-bold text-cyan-400 mb-2 font-mono">
            CYBERPUNK NEWS NETWORK
          </h1>
          <p className="text-fuchsia-500 mb-8 text-lg">
            [//] Plugged into the digital pulse of tomorrow
          </p>
          
          {/* Main 3D Cityscape */}
          <div className="rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,255,255,0.5)] mb-10 border border-cyan-400">
            <CyberpunkCityscape newsArticles={mockArticles} />
          </div>
          
          {/* Interactive Controls */}
          <div className="bg-gray-900 rounded-lg p-6 border border-fuchsia-500 shadow-[0_0_20px_rgba(255,0,255,0.3)] mb-10">
            <h2 className="text-2xl font-mono text-cyan-400 mb-4 flex items-center">
              <span className="inline-block w-3 h-3 bg-cyan-400 mr-2 animate-pulse"></span>
              NEURAL INTERFACE CONTROLS
            </h2>
            <ul className="space-y-3 text-gray-300 font-mono">
              <li className="flex items-center gap-2">
                <span className="bg-fuchsia-900 text-fuchsia-300 px-3 py-1 rounded font-mono border border-fuchsia-500">MOUSE_DRAG</span>
                <span>:: Rotate neural viewpoint</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-fuchsia-900 text-fuchsia-300 px-3 py-1 rounded font-mono border border-fuchsia-500">SCROLL</span>
                <span>:: Adjust proximic perception depth</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-fuchsia-900 text-fuchsia-300 px-3 py-1 rounded font-mono border border-fuchsia-500">CLICK</span>
                <span>:: Interact with datastream nodes</span>
              </li>
            </ul>
          </div>
          
          {/* Featured News Grid */}
          <div className="mb-10">
            <h2 className="text-2xl font-mono text-cyan-400 mb-4 flex items-center">
              <span className="inline-block w-3 h-3 bg-cyan-400 mr-2 animate-pulse"></span>
              TRENDING DATA FEEDS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockArticles.slice(0, 6).map(article => (
                <div key={article.id} className="bg-gray-900 rounded-lg border border-cyan-400 hover:border-fuchsia-500 transition-all p-4 hover:shadow-[0_0_15px_rgba(0,255,255,0.5)] group">
                  <div className="text-xs font-bold text-fuchsia-500 uppercase mb-1 flex justify-between items-center">
                    <span># {article.category}</span>
                    <span className="px-2 py-0.5 bg-cyan-900 text-cyan-300 rounded-sm text-[10px]">
                      {article.source}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-100 group-hover:text-cyan-300 transition-colors">
                    {article.title}
                  </h3>
                  <div className="mt-3 w-full h-1 bg-gray-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 w-1/2 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* About Section */}
          <div className="bg-gray-900 rounded-lg p-6 border border-cyan-400">
            <h2 className="text-2xl font-mono text-cyan-400 mb-4 flex items-center">
              <span className="inline-block w-3 h-3 bg-cyan-400 mr-2 animate-pulse"></span>
              SIMULATION SPECS
            </h2>
            <p className="text-gray-300 font-mono leading-relaxed">
              This cyberpunk cityscape is an immersive 3D environment built with Three.js.
              The scene features a high-tech, neon-lit metropolis with towering skyscrapers,
              dynamic news billboards, and atmospheric effects like volumetric fog, rain,
              and lightning. The futuristic aesthetic is enhanced with glowing edges, reflective
              surfaces, and holographic elements to create a truly cyberpunk atmosphere.
              <br /><br />
              <span className="text-fuchsia-500">[//] Rendering system optimized for neural interface compatibility.</span>
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
} 