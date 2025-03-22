'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTheme } from 'next-themes';
import * as THREE from 'three';
import { 
  particleConfig, 
  randomPosition, 
  distance, 
  colorPalette 
} from '@/utils/three-config';

// Individual particle with movement logic
interface ParticleProps {
  index: number;
  particles: React.MutableRefObject<THREE.Object3D[]>;
  velocities: React.MutableRefObject<THREE.Vector3[]>;
}

function Particle({ index, particles, velocities }: ParticleProps) {
  const ref = useRef<THREE.Mesh>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (ref.current) {
      // Store reference for connection calculations
      particles.current[index] = ref.current;
    }
  }, [index, particles]);

  // Animation frame update
  useFrame(() => {
    if (!ref.current) return;
    
    // Update position based on velocity
    ref.current.position.x += velocities.current[index].x;
    ref.current.position.y += velocities.current[index].y;
    ref.current.position.z += velocities.current[index].z;
    
    // Boundary check - if particle goes beyond bounds, reverse direction
    const bounds = particleConfig.maxDistance / 2;
    
    // Type-safe way to check and update position bounds
    if (Math.abs(ref.current.position.x) > bounds) {
      velocities.current[index].x *= -1;
    }
    if (Math.abs(ref.current.position.y) > bounds) {
      velocities.current[index].y *= -1;
    }
    if (Math.abs(ref.current.position.z) > bounds) {
      velocities.current[index].z *= -1;
    }
  });

  return (
    <mesh ref={ref} position={randomPosition(particleConfig.maxDistance)}>
      <sphereGeometry args={[particleConfig.size, 8, 8]} />
      <meshBasicMaterial 
        color={theme === 'dark' ? colorPalette.dark.text : colorPalette.primary} 
        transparent 
        opacity={0.6}
      />
    </mesh>
  );
}

// Connections between particles
function Connections({ particles }: { particles: React.MutableRefObject<THREE.Object3D[]> }) {
  const { theme } = useTheme();
  const linesMaterial = useMemo(() => 
    new THREE.LineBasicMaterial({ 
      color: theme === 'dark' ? colorPalette.primary : colorPalette.dark.text,
      transparent: true,
      opacity: particleConfig.connectionOpacity,
      linewidth: 1,
    }), 
  [theme]);
  
  const linesRef = useRef<THREE.LineSegments>(null);
  
  // Initialize the geometry with default positions to avoid "undefined" errors
  useEffect(() => {
    if (linesRef.current) {
      // Initialize with invisible line
      const initialGeometry = linesRef.current.geometry;
      initialGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array([0,0,0, 0,0,0]), 3)
      );
    }
  }, []);
  
  // Create and update connections between nearby particles
  useFrame(() => {
    if (!linesRef.current || !particleConfig.showConnections) return;
    
    const positions: number[] = [];
    const particlesArray = particles.current.filter(Boolean);

    // Check distances between particles and create connections for nearby ones
    for (let i = 0; i < particlesArray.length; i++) {
      for (let j = i + 1; j < particlesArray.length; j++) {
        const p1 = particlesArray[i];
        const p2 = particlesArray[j];
        
        if (!p1 || !p2) continue;
        
        const d = distance(p1.position, p2.position);
        
        // Only connect particles within specified distance
        if (d < particleConfig.connectionDistance) {
          positions.push(p1.position.x, p1.position.y, p1.position.z);
          positions.push(p2.position.x, p2.position.y, p2.position.z);
        }
      }
    }
    
    // Update the line segments geometry
    const geometry = linesRef.current.geometry;
    const positionAttribute = geometry.getAttribute('position');
    
    // Make sure positionAttribute exists before accessing its array property
    if (positions.length > 0) {
      // Handle case where connections exist
      if (!positionAttribute || positionAttribute.array.length !== positions.length) {
        // If number of connections changed or attribute doesn't exist, create new buffer
        geometry.setAttribute(
          'position',
          new THREE.BufferAttribute(new Float32Array(positions), 3)
        );
      } else {
        // Just update existing buffer
        const array = positionAttribute.array as Float32Array;
        for (let i = 0; i < positions.length; i++) {
          array[i] = positions[i];
        }
        positionAttribute.needsUpdate = true;
      }
    } else if (!positionAttribute || positionAttribute.array.length !== 6) {
      // Handle case with no connections - create minimal invisible line
      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array([0,0,0, 0,0,0]), 3)
      );
    }
  });
  
  return (
    <lineSegments ref={linesRef}>
      <bufferGeometry />
      <primitive object={linesMaterial} attach="material" />
    </lineSegments>
  );
}

// ParticleSystem containing all particles and connections
function ParticleSystem() {
  const particles = useRef<THREE.Object3D[]>([]);
  
  // Initialize random velocities
  const velocities = useRef<THREE.Vector3[]>(
    Array.from({ length: particleConfig.count }, () => 
      new THREE.Vector3(
        (Math.random() - 0.5) * particleConfig.speedFactor * 0.01,
        (Math.random() - 0.5) * particleConfig.speedFactor * 0.01,
        (Math.random() - 0.5) * particleConfig.speedFactor * 0.01
      )
    )
  );

  return (
    <group>
      {Array.from({ length: particleConfig.count }).map((_, i) => (
        <Particle 
          key={i} 
          index={i} 
          particles={particles}
          velocities={velocities}
        />
      ))}
      <Connections particles={particles} />
    </group>
  );
}

// Main exported component
interface ParticleBackgroundProps {
  className?: string;
}

export default function ParticleBackground({ className = '' }: ParticleBackgroundProps) {
  return (
    <div className={`fixed inset-0 -z-10 opacity-50 pointer-events-none ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 20], fov: 60 }}
        dpr={[1, 2]} // Optimized performance
      >
        <ParticleSystem />
      </Canvas>
    </div>
  );
} 