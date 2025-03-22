'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useTexture, Environment, Text } from '@react-three/drei';
import { useTheme } from 'next-themes';
import * as THREE from 'three';
import { colorPalette } from '@/utils/three-config';

// Globe animation with rotation and highlight effects
function Globe() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { theme } = useTheme();
  
  // Create a canvas-based Earth texture instead of loading an external image
  const earthTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Base color (oceans)
    const baseColor = theme === 'dark' ? '#1E293B' : '#3B82F6';
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Create a basic earth pattern with continents
    ctx.fillStyle = theme === 'dark' ? '#334155' : '#22C55E';
    
    // Simplified continent shapes (very approximate)
    // North America
    ctx.beginPath();
    ctx.ellipse(250, 200, 150, 100, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // South America
    ctx.beginPath();
    ctx.ellipse(320, 350, 80, 120, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Europe/Africa
    ctx.beginPath();
    ctx.ellipse(550, 250, 100, 180, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Asia/Australia
    ctx.beginPath();
    ctx.ellipse(750, 220, 180, 120, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Australia
    ctx.beginPath();
    ctx.ellipse(820, 380, 60, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Add some noise/clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = 5 + Math.random() * 20;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    return new THREE.CanvasTexture(canvas);
  }, [theme]);
  
  // Create a simplified Earth mesh
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    
    // Rotate the globe
    meshRef.current.rotation.y = clock.getElapsedTime() * 0.2;
    
    // Subtle floating effect
    meshRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
  });

  return (
    <group>
      {/* Earth sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          map={earthTexture}
          metalness={0.1}
          roughness={0.7}
        />
      </mesh>
      
      {/* Atmosphere glow */}
      <mesh scale={[1.05, 1.05, 1.05]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={theme === 'dark' ? colorPalette.primary : colorPalette.secondary}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Orbit ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.25, 64]} />
        <meshBasicMaterial
          color={theme === 'dark' ? colorPalette.primary : colorPalette.accent}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// Floating text that animates with the globe
function LoadingText() {
  const textRef = useRef<THREE.Group>(null);
  const { theme } = useTheme();
  
  useFrame(({ clock }) => {
    if (!textRef.current) return;
    
    // Pulsing animation
    const scale = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.05;
    textRef.current.scale.set(scale, scale, scale);
    
    // Rotate slightly with the globe
    textRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
  });
  
  // Instead of creating a canvas texture, use drei's Text component which is simpler
  return (
    <group ref={textRef} position={[0, -1.8, 0]}>
      <mesh>
        <planeGeometry args={[3, 0.5]} />
        <meshBasicMaterial color={theme === 'dark' ? '#1a2234' : '#f0f4f8'} transparent opacity={0.8} />
      </mesh>
      
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.2}
        color={theme === 'dark' ? colorPalette.light.text : colorPalette.dark.text}
        anchorX="center"
        anchorY="middle"
      >
        Aggregating Perspectives...
      </Text>
    </group>
  );
}

// Particle system for background stars
function Stars({ count = 200 }) {
  const { theme } = useTheme();
  
  // Generate random star positions
  const positions = React.useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;      // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;  // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;  // z
    }
    return positions;
  }, [count]);
  
  // Star sizes
  const sizes = React.useMemo(() => {
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      sizes[i] = Math.random() * 0.1 + 0.05;
    }
    return sizes;
  }, [count]);
  
  // Animation
  const pointsRef = useRef<THREE.Points>(null);
  
  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    
    // Subtle twinkling effect
    const time = clock.getElapsedTime();
    const geometry = pointsRef.current.geometry;
    const sizesAttr = geometry.getAttribute('size') as THREE.BufferAttribute;
    
    for (let i = 0; i < count; i++) {
      sizesAttr.array[i] = sizes[i] * (1 + Math.sin(time * 0.5 + i) * 0.5);
    }
    
    sizesAttr.needsUpdate = true;
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          count={sizes.length}
          array={sizes}
          itemSize={1}
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        sizeAttenuation
        transparent
        opacity={0.8}
        color={theme === 'dark' ? '#ffffff' : '#cccccc'}
      />
    </points>
  );
}

// Main loading animation component
interface LoadingGlobeProps {
  show: boolean;
  message?: string;
}

export default function LoadingGlobe({ show, message }: LoadingGlobeProps) {
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-slate-900 bg-opacity-80 dark:bg-opacity-80 backdrop-blur-sm">
      <div className="w-64 h-64 md:w-96 md:h-96">
        <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
          <ambientLight intensity={0.3} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
          <directionalLight position={[-5, 5, -5]} intensity={0.5} />
          
          <Globe />
          <LoadingText />
          <Stars />
          
          <Environment preset="city" />
        </Canvas>
      </div>
      
      {message && (
        <div className="absolute bottom-10 text-center text-slate-800 dark:text-slate-200 text-lg font-medium">
          {message}
        </div>
      )}
    </div>
  );
} 