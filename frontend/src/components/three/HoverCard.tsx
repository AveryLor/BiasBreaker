'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { colorPalette } from '@/utils/three-config';

interface HoverCardProps {
  title: string;
  source: string;
  date: string;
  image?: string;
  snippet: string;
  onClick?: () => void;
  className?: string;
}

export default function HoverCard({ 
  title, 
  source, 
  date, 
  image, 
  snippet, 
  onClick, 
  className = '' 
}: HoverCardProps) {
  const { theme } = useTheme();
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  
  // Motion values for the tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Add spring physics for smoother animation
  const springConfig = { damping: 15, stiffness: 150 };
  const xSpring = useSpring(x, springConfig);
  const ySpring = useSpring(y, springConfig);
  
  // Transform values for various elements
  const cardRotateX = useTransform(ySpring, [-0.5, 0.5], [5, -5]);
  const cardRotateY = useTransform(xSpring, [-0.5, 0.5], [-5, 5]);
  
  // Shadow and highlight effects based on cursor position
  const highlightX = useTransform(xSpring, [-0.5, 0.5], ["-20%", "120%"]);
  const highlightY = useTransform(ySpring, [-0.5, 0.5], ["-20%", "120%"]);
  const shadowX = useTransform(xSpring, [-0.5, 0.5], ["20%", "-20%"]);
  const shadowY = useTransform(ySpring, [-0.5, 0.5], ["20%", "-20%"]);
  
  // Create a subtle movement for internal elements
  const imageX = useTransform(xSpring, [-0.5, 0.5], [-5, 5]);
  const imageY = useTransform(ySpring, [-0.5, 0.5], [-5, 5]);
  const titleX = useTransform(xSpring, [-0.5, 0.5], [-2, 2]);
  const titleY = useTransform(ySpring, [-0.5, 0.5], [-2, 2]);
  
  // Handle mouse move to update motion values
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate normalized values (-0.5 to 0.5)
    const normalizedX = (e.clientX - centerX) / rect.width;
    const normalizedY = (e.clientY - centerY) / rect.height;
    
    x.set(normalizedX);
    y.set(normalizedY);
  };
  
  // Reset on mouse leave
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setHovering(false);
  };
  
  return (
    <motion.div
      ref={cardRef}
      className={`relative rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 
        ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} 
        border cursor-pointer ${className}`}
      style={{
        transformStyle: "preserve-3d",
        perspective: 1000,
        rotateX: cardRotateX,
        rotateY: cardRotateY,
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {/* Glowing highlight effect */}
      <motion.div 
        className="absolute inset-0 opacity-0 pointer-events-none z-10"
        style={{ 
          background: `radial-gradient(circle at ${highlightX} ${highlightY}, 
            ${theme === 'dark' ? colorPalette.primary : 'rgba(99, 102, 241, 0.2)'}, 
            transparent 70%)`,
          opacity: hovering ? 0.4 : 0,
        }}
      />
      
      {/* Shadow effect */}
      <motion.div 
        className="absolute inset-0 opacity-0 pointer-events-none"
        style={{ 
          background: `radial-gradient(circle at ${shadowX} ${shadowY}, 
            rgba(0, 0, 0, 0.3), 
            transparent 70%)`,
          opacity: hovering ? 0.15 : 0,
        }}
      />
      
      {/* Card Content */}
      <div className="relative overflow-hidden p-0">
        {/* Image */}
        <motion.div 
          className="w-full h-40 relative overflow-hidden"
          style={{ x: imageX, y: imageY }}
        >
          {image ? (
            <div className="relative w-full h-full">
              <Image
                src={image}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onError={() => {
                  // Handle image load error - the image will not be displayed
                  // and the "No image" fallback will show instead
                  console.log("Failed to load image:", image);
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-30" />
            </div>
          ) : (
            <div className={`w-full h-full flex items-center justify-center 
              ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`}>
              <span className="text-slate-400">{source}</span>
            </div>
          )}
          
          {/* Source badge */}
          <div className="absolute top-3 left-3 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-md">
            {source}
          </div>
        </motion.div>
        
        {/* Content */}
        <div className="p-4">
          <motion.div style={{ x: titleX, y: titleY }}>
            <h3 className={`font-bold mb-1 line-clamp-2 
              ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              {title}
            </h3>
            <p className="text-xs text-slate-500 mb-2">{date}</p>
            <p className={`text-sm line-clamp-3 
              ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              {snippet}
            </p>
          </motion.div>
          
          {/* Bottom gradient fade */}
          <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none
            bg-gradient-to-t from-white dark:from-slate-800 to-transparent">
          </div>
        </div>
      </div>
      
      {/* 3D Edge Effect */}
      <motion.div 
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{ 
          border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          transformStyle: "preserve-3d",
          transform: "translateZ(-1px)",
        }}
      />
    </motion.div>
  );
} 