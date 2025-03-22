'use client';

import React, { useState } from 'react';
import FuturisticCityscape from '@/components/three/FuturisticCityscape';
import PageTransition from '@/components/three/PageTransition';

export default function CityScapeDemo() {
  // Mock news articles for demo
  const mockArticles = [
    {
      id: 1,
      title: "AI Innovations Reach New Milestone With Quantum Computing Integration",
      source: "TechNews",
      category: "Technology",
      url: "#article1"
    },
    {
      id: 2,
      title: "Global Climate Summit Concludes With Historic Carbon Reduction Agreement",
      source: "GlobalReport",
      category: "Environment",
      url: "#article2"
    },
    {
      id: 3,
      title: "Breakthrough in Renewable Energy Storage Could Revolutionize Power Grid",
      source: "ScienceDaily",
      category: "Science",
      url: "#article3"
    },
    {
      id: 4,
      title: "International Space Coalition Announces Mars Colony Plans for 2035",
      source: "SpaceNews",
      category: "Space",
      url: "#article4"
    },
    {
      id: 5,
      title: "Financial Markets Respond to Introduction of Digital Currency Framework",
      source: "EconoWatch",
      category: "Finance",
      url: "#article5"
    },
    {
      id: 6,
      title: "Healthcare Revolution: New Treatment Approaches Using Genetic Editing",
      source: "MedJournal",
      category: "Health",
      url: "#article6"
    },
    {
      id: 7,
      title: "Urban Planning Initiatives Focus on Sustainable Smart City Development",
      source: "CityFuture",
      category: "Urban",
      url: "#article7"
    },
    {
      id: 8,
      title: "Rising Cybersecurity Threats Prompt International Regulatory Response",
      source: "SecureWorld",
      category: "Security",
      url: "#article8"
    },
    {
      id: 9,
      title: "Diplomatic Relations Strengthened Through New Trade Agreements",
      source: "WorldPolitics",
      category: "Politics",
      url: "#article9"
    },
    {
      id: 10,
      title: "Educational Transformation: Virtual Reality Becomes Standard Learning Tool",
      source: "EduTech",
      category: "Education",
      url: "#article10"
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-2">
            Futuristic News Cityscape
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mb-8">
            Explore news headlines in an immersive cyberpunk city environment
          </p>
          
          {/* Main 3D Cityscape */}
          <div className="rounded-2xl overflow-hidden shadow-2xl mb-10">
            <FuturisticCityscape newsArticles={mockArticles} />
          </div>
          
          {/* Instructions Panel */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg mb-10">
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-4">
              How to Interact
            </h2>
            <ul className="space-y-2 text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded font-mono">Mouse Drag</span>
                <span>Rotate the camera to explore the cityscape</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded font-mono">Scroll</span>
                <span>Zoom in and out of the scene</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded font-mono">Click</span>
                <span>Click on news billboards to interact with news items</span>
              </li>
            </ul>
          </div>
          
          {/* Featured Articles */}
          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-4">
              Featured Headlines
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockArticles.slice(0, 6).map(article => (
                <div key={article.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase">
                    {article.category}
                  </span>
                  <h3 className="text-lg font-medium text-slate-800 dark:text-white mt-1">
                    {article.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Source: {article.source}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          {/* About Section */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-4">
              About This Demo
            </h2>
            <p className="text-slate-700 dark:text-slate-300">
              This demo showcases a 3D futuristic cityscape built with Three.js and React Three Fiber. 
              The scene features a cyberpunk-inspired metropolis with dynamic news billboards, 
              flying drones, atmospheric effects, and interactive elements. The cityscape is designed 
              to blend a high-tech aesthetic with a news atmosphere, creating an immersive way to 
              browse headlines and stories.
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
} 