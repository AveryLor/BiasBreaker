'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, useTexture } from '@react-three/drei';
import { useTheme } from 'next-themes';
import * as THREE from 'three';
import { easeInOutCubic } from '@/utils/three-config';

interface Article {
  id: number;
  title: string;
  source: string;
  image?: string;
}

interface FloatingCardProps {
  article: Article;
  isActive: boolean;
  index: number;
  totalCards: number;
  onClick: () => void;
  [key: string]: any; // Allow for additional props to be passed to the group
}

// Individual floating card in 3D space
function FloatingCard({ article, isActive, index, totalCards, onClick, ...props }: FloatingCardProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { theme } = useTheme();
  
  // Calculate position on a circle
  const angle = (index / totalCards) * Math.PI * 2;
  const radius = 5;
  const targetX = Math.sin(angle) * radius;
  const targetZ = Math.cos(angle) * radius;
  
  // Use a local fallback texture instead of remote URL
  // This avoids CORS and loading issues with Unsplash
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [textureError, setTextureError] = useState(false);
  
  // Create colored placeholder for articles with no images or failed loads
  useEffect(() => {
    // Create a canvas with a colored background and text
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Fill background based on theme
      ctx.fillStyle = theme === 'dark' ? '#334155' : '#e2e8f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add a subtle pattern
      ctx.fillStyle = theme === 'dark' ? '#475569' : '#cbd5e1';
      for (let i = 0; i < 10; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = 5 + Math.random() * 15;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Add text
      ctx.fillStyle = theme === 'dark' ? '#e2e8f0' : '#334155';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(article.source, canvas.width / 2, canvas.height / 2);
      
      // Create texture from canvas
      const newTexture = new THREE.CanvasTexture(canvas);
      setTexture(newTexture);
    }
  }, [article.source, theme, textureError]);
  
  // Animation
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    
    const time = clock.getElapsedTime();
    
    // Hover effect for active card
    if (isActive) {
      groupRef.current.position.y = Math.sin(time * 2) * 0.1 + 0.2;
    } else {
      groupRef.current.position.y = Math.sin(time * 2 + index) * 0.05;
    }
    
    // Rotate to face center
    groupRef.current.rotation.y = Math.atan2(groupRef.current.position.x, groupRef.current.position.z);
    
    // Move towards target position with smooth easing
    groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.05;
    groupRef.current.position.z += (targetZ - groupRef.current.position.z) * 0.05;
    
    // Scale active card
    groupRef.current.scale.setScalar(isActive ? 1.2 : 1);
  });
  
  return (
    <group
      ref={groupRef}
      position={[targetX, 0, targetZ]}
      {...props}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Card backing with slight perspective */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2, 1.2, 0.05]} />
        <meshStandardMaterial
          color={theme === 'dark' ? '#1E293B' : '#F8FAFC'}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>
      
      {/* Card image */}
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[1.9, 0.9]} />
        {texture && (
          <meshBasicMaterial map={texture} transparent />
        )}
      </mesh>
      
      {/* Article title */}
      <Text
        position={[0, -0.45, 0.06]}
        fontSize={0.10}
        maxWidth={1.8}
        textAlign="center"
        color={theme === 'dark' ? '#E2E8F0' : '#1E293B'}
        anchorX="center"
        anchorY="bottom"
      >
        {article.title}
      </Text>
      
      {/* Source name */}
      <Text
        position={[0, -0.58, 0.06]}
        fontSize={0.06}
        color={theme === 'dark' ? '#94A3B8' : '#64748B'}
        anchorX="center"
        anchorY="bottom"
      >
        {article.source}
      </Text>
      
      {/* Glow effect for active card */}
      {isActive && (
        <mesh position={[0, 0, -0.1]}>
          <planeGeometry args={[2.2, 1.4]} />
          <meshBasicMaterial
            color="#6366F1"
            transparent
            opacity={0.2}
          />
        </mesh>
      )}
    </group>
  );
}

// Camera rig that rotates around the carousel
function CameraRig({ activeIndex, totalCards }: { activeIndex: number; totalCards: number }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    
    // Calculate target angle based on active card
    const targetAngle = -(activeIndex / totalCards) * Math.PI * 2;
    
    // Rotate the rig smoothly
    groupRef.current.rotation.y += (targetAngle - groupRef.current.rotation.y) * 0.05;
    
    // Keep the camera position updated
    camera.position.set(0, 2, 10);
    camera.lookAt(0, 0, 0);
  });
  
  return <group ref={groupRef} />;
}

// Main carousel component
interface FloatingCarouselProps {
  articles: Article[];
  onSelect?: (article: Article) => void;
}

export default function FloatingCarousel({ articles, onSelect }: FloatingCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const [autoRotate, setAutoRotate] = useState(true);
  
  // Auto-rotation effect
  useEffect(() => {
    if (!autoRotate) return undefined;
    
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % articles.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [articles.length, autoRotate]);
  
  // Handle card selection
  const handleCardClick = (index: number) => {
    setActiveIndex(index);
    setAutoRotate(false);
    
    if (onSelect && articles[index]) {
      onSelect(articles[index]);
    }
  };
  
  // Mouse/Touch events for manual carousel navigation
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true;
    startX.current = 'touches' in e 
      ? e.touches[0].clientX 
      : e.clientX;
    setAutoRotate(false);
  };
  
  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging.current) return;
    
    const clientX = 'touches' in e 
      ? e.touches[0].clientX 
      : e.clientX;
    
    const deltaX = clientX - startX.current;
    
    if (Math.abs(deltaX) > 30) {
      const direction = deltaX > 0 ? -1 : 1;
      setActiveIndex((prev) => {
        let newIndex = (prev + direction) % articles.length;
        if (newIndex < 0) newIndex = articles.length - 1;
        return newIndex;
      });
      
      isDragging.current = false;
    }
  };
  
  const handleDragEnd = () => {
    isDragging.current = false;
  };
  
  return (
    <div
      ref={containerRef}
      className="relative w-full h-96 my-8 touch-none"
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchStart={handleDragStart}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
    >
      <Canvas
        shadows
        camera={{ position: [0, 2, 10], fov: 50, near: 0.1, far: 1000 }}
        dpr={[1, 2]} // Performance optimization
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
        
        <CameraRig activeIndex={activeIndex} totalCards={articles.length} />
        
        {/* Render article cards */}
        {articles.map((article, index) => (
          <FloatingCard
            key={article.id}
            article={article}
            isActive={index === activeIndex}
            index={index}
            totalCards={articles.length}
            onClick={() => handleCardClick(index)}
          />
        ))}
        
        {/* Floor reflection */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial
            color="#f3f4f6"
            metalness={0.2}
            roughness={0.8}
            transparent
            opacity={0.4}
          />
        </mesh>
      </Canvas>
      
      {/* Navigation dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {articles.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === activeIndex
                ? 'bg-indigo-600 w-4'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
            onClick={() => handleCardClick(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
} 