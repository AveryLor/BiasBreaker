'use client';

import React, { useState, useRef, useEffect, ReactNode } from 'react';

interface InteractiveCardProps {
  children: ReactNode;
  maxTilt?: number;
  scale?: number;
  speed?: number;
  className?: string;
  disabled?: boolean;
}

export default function InteractiveCard({
  children,
  maxTilt = 20,
  scale = 1.05,
  speed = 500,
  className = '',
  disabled = false,
}: InteractiveCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !cardRef.current) return;
    
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    
    // Calculate mouse position relative to the card center
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    // Calculate rotation based on mouse position
    const rotateY = maxTilt * (mouseX / (rect.width / 2));
    const rotateX = -maxTilt * (mouseY / (rect.height / 2));
    
    // Calculate parallax effect for inner content
    const moveX = (mouseX / rect.width) * 20;
    const moveY = (mouseY / rect.height) * 20;
    
    // Apply transformations
    setRotation({ x: rotateX, y: rotateY });
    setPosition({ x: moveX, y: moveY });
  };
  
  const handleMouseEnter = () => {
    if (disabled) return;
    setIsHovering(true);
  };
  
  const handleMouseLeave = () => {
    if (disabled) return;
    setIsHovering(false);
    
    // Reset to initial state smoothly
    setRotation({ x: 0, y: 0 });
    setPosition({ x: 0, y: 0 });
  };
  
  // Add perspective to parent container for 3D effect
  useEffect(() => {
    if (cardRef.current) {
      const parent = cardRef.current.parentElement;
      if (parent) {
        parent.style.perspective = '1000px';
        parent.style.transformStyle = 'preserve-3d';
      }
    }
  }, []);
  
  return (
    <div
      ref={cardRef}
      className={`relative transition-transform overflow-hidden ${className}`}
      style={{
        transform: isHovering
          ? `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(${scale}, ${scale}, ${scale})`
          : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: `transform ${speed}ms ease-out, box-shadow 0.3s ease`,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main content */}
      <div
        className="relative z-10"
        style={{
          transform: isHovering
            ? `translateX(${position.x}px) translateY(${position.y}px)`
            : 'translateX(0px) translateY(0px)',
          transition: `transform ${speed}ms ease-out`,
        }}
      >
        {children}
      </div>
      
      {/* Highlight overlay */}
      {!disabled && (
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: isHovering
              ? 'linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.1) 45%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.1) 55%, transparent 60%)'
              : 'none',
            backgroundSize: '200% 100%',
            backgroundPosition: isHovering ? 'right center' : 'left center',
            transition: `background-position ${speed * 2}ms ease-out, opacity 0.3s ease`,
          }}
        />
      )}
      
      {/* Shadow effect for depth perception */}
      {!disabled && (
        <div
          className="absolute inset-0 rounded-lg pointer-events-none z-0"
          style={{
            transform: 'translateZ(-100px)',
            opacity: isHovering ? 1 : 0,
            transition: `opacity ${speed}ms ease-out`,
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.3)',
          }}
        />
      )}
    </div>
  );
} 