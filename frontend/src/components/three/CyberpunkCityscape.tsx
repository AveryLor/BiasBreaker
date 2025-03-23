'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  PerspectiveCamera, 
  OrbitControls, 
  Text, 
  Billboard, 
  MeshReflectorMaterial,
  useTexture,
  useAnimations,
  Cloud,
  Environment,
  Instances,
  Instance,
  Trail,
  useGLTF
} from '@react-three/drei';
import { useTheme } from 'next-themes';
import * as THREE from 'three';
import { colorPalette } from '@/utils/three-config';
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

// Types for news articles to display
interface NewsArticle {
  id: number;
  title: string;
  source: string;
  category?: string;
  url?: string;
}

// Random range utility function
const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

// Neon glowing skyscraper with edges
function NeonBuilding({ position, scale, rotation, color, neonColor }: { 
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
  color: THREE.Color;
  neonColor: THREE.Color;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  
  // Pulse the neon edges
  useFrame(({ clock }) => {
    if (edgesRef.current) {
      const material = edgesRef.current.material as THREE.LineBasicMaterial;
      const pulse = Math.sin(clock.getElapsedTime() * 2) * 0.3 + 0.7;
      material.color.setRGB(
        neonColor.r * pulse,
        neonColor.g * pulse,
        neonColor.b * pulse
      );
    }
  });
  
  return (
    <group position={position} rotation={rotation}>
      {/* Main building structure */}
      <mesh ref={meshRef} scale={scale} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color={color}
          roughness={0.2}
          metalness={0.8}
          emissive={color}
          emissiveIntensity={0.05}
        />
      </mesh>
      
      {/* Neon edges */}
      <lineSegments ref={edgesRef} scale={[scale[0] * 1.01, scale[1] * 1.01, scale[2] * 1.01]}>
        <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
        <lineBasicMaterial color={neonColor} linewidth={2} />
      </lineSegments>
      
      {/* Windows grid */}
      <mesh scale={[scale[0] * 1.01, scale[1] * 1.01, scale[2] * 1.01]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial 
          wireframe 
          color={neonColor} 
          transparent 
          opacity={0.3} 
        />
      </mesh>
    </group>
  );
}

// Digital billboard with glitch effects
function NewsBillboard({ position, rotation, article, scale = 1 }: { 
  position: [number, number, number],
  rotation: [number, number, number],
  article: NewsArticle,
  scale?: number
}) {
  const { theme } = useTheme();
  const [glitchActive, setGlitchActive] = useState(false);
  const [visibleChars, setVisibleChars] = useState(0);
  const billboardRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  
  // Generate the billboard texture
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return new THREE.CanvasTexture(canvas);
    
    // Create glowing billboard background
    const bgColor = '#000000';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add cyberpunk grid pattern
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 1;
    
    // Grid pattern
    const gridSpacing = 20;
    for (let x = 0; x <= canvas.width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.globalAlpha = 0.2;
      ctx.stroke();
    }
    
    for (let y = 0; y <= canvas.height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.globalAlpha = 0.2;
      ctx.stroke();
    }
    
    // Add a cyan glow
    const gradient = ctx.createRadialGradient(
      canvas.width/2, canvas.height/2, 0,
      canvas.width/2, canvas.height/2, canvas.width/2
    );
    gradient.addColorStop(0, 'rgba(0, 255, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Header bar
    ctx.fillStyle = '#FF00FF';
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, canvas.width, 40);
    
    // Source label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(article.source.toUpperCase(), canvas.width/2, 28);
    
    // Category label if available
    if (article.category) {
      ctx.fillStyle = '#00FFFF';
      ctx.font = '16px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`#${article.category}`, canvas.width - 10, 28);
    }
    
    // Headline
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'left';
    
    // Limit visible chars for the typing effect
    const headline = article.title;
    const truncatedHeadline = headline.substring(0, visibleChars);
    
    // Wrap text function
    const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
      const words = text.split(' ');
      let line = '';
      let testLine = '';
      let lineCount = 0;
      
      for (let n = 0; n < words.length; n++) {
        testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, x, y + (lineCount * lineHeight));
          line = words[n] + ' ';
          lineCount++;
        } else {
          line = testLine;
        }
      }
      
      ctx.fillText(line, x, y + (lineCount * lineHeight));
    };
    
    wrapText(truncatedHeadline, 20, 80, canvas.width - 40, 32);
    
    // Add a blinking cursor
    if (visibleChars < headline.length) {
      const cursorMetrics = ctx.measureText(truncatedHeadline.substring(truncatedHeadline.lastIndexOf('\n') + 1));
      const cursorX = 20 + cursorMetrics.width;
      const cursorY = 80 + 32 * (truncatedHeadline.split('\n').length - 1);
      
      ctx.fillStyle = '#00FFFF';
      ctx.fillRect(cursorX, cursorY - 24, 14, 28);
    }
    
    return new THREE.CanvasTexture(canvas);
  }, [article, visibleChars, theme]);
  
  // Automate typing effect
  useEffect(() => {
    setVisibleChars(0);
    const interval = setInterval(() => {
      setVisibleChars(prev => {
        if (prev < article.title.length) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [article]);
  
  // Randomly trigger glitch effects
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      const shouldGlitch = Math.random() > 0.7;
      if (shouldGlitch) {
        setGlitchActive(true);
        
        // Turn off glitch after a short duration
        setTimeout(() => {
          setGlitchActive(false);
        }, 500);
      }
    }, 3000);
    
    return () => clearInterval(glitchInterval);
  }, []);
  
  // Apply glitch effect when active
  useFrame(({ clock }) => {
    if (materialRef.current && billboardRef.current) {
      if (glitchActive) {
        // Apply glitch effect by distorting UVs
        const material = materialRef.current;
        // Adjust emissive intensity if available
        if ('emissiveIntensity' in material) {
          material.emissiveIntensity = 2 + Math.sin(clock.getElapsedTime() * 20) * 0.5;
        }
        
        // Make billboard shake slightly
        billboardRef.current.position.x = position[0] + (Math.random() - 0.5) * 0.1;
        billboardRef.current.position.y = position[1] + (Math.random() - 0.5) * 0.1;
      } else {
        // Reset position
        billboardRef.current.position.x = position[0];
        billboardRef.current.position.y = position[1];
        if ('emissiveIntensity' in materialRef.current) {
          materialRef.current.emissiveIntensity = 1;
        }
      }
      
      // Update the texture
      if (materialRef.current.map) {
        materialRef.current.map.needsUpdate = true;
      }
    }
  });
  
  return (
    <Billboard
      ref={billboardRef}
      position={position}
      rotation={rotation}
      follow={false}
      lockX={false}
      lockY={false}
      lockZ={false}
    >
      <planeGeometry args={[3 * scale, 1.5 * scale]} />
      <meshStandardMaterial 
        ref={materialRef}
        map={texture} 
        side={THREE.DoubleSide}
        emissive={new THREE.Color(0x00ffff)}
        emissiveIntensity={1}
        emissiveMap={texture}
      />
    </Billboard>
  );
}

// Wet road with reflections
function ReflectiveGround() {
  return (
    <MeshReflectorMaterial
      blur={[400, 100]}
      resolution={1024}
      args={[200, 200]}
      mirror={0.75}
      mixBlur={10}
      mixStrength={1.5}
      rotation={[-Math.PI / 2, 0, Math.PI / 2]}
      position={[0, -0.1, 0]}
      color="#050505"
      metalness={0.8}
      roughness={0.2}
    />
  );
}

// Flying drones
function FlyingDrones({ count = 15 }: { count?: number }) {
  const droneRefs = useRef<THREE.Group[]>([]);
  
  // Drone paths
  const dronePaths = useMemo(() => {
    return Array(count).fill(0).map(() => {
      const radius = 20 + Math.random() * 30;
      const height = 10 + Math.random() * 20;
      const speed = 0.2 + Math.random() * 0.5;
      const startAngle = Math.random() * Math.PI * 2;
      const direction = Math.random() > 0.5 ? 1 : -1;
      
      return { radius, height, speed, startAngle, direction };
    });
  }, [count]);
  
  // Update drone positions
  useFrame(({ clock }) => {
    droneRefs.current.forEach((drone, i) => {
      if (!drone) return;
      
      const { radius, height, speed, startAngle, direction } = dronePaths[i];
      const t = clock.getElapsedTime();
      
      // Circular path with slight vertical movement
      const angle = startAngle + t * speed * direction;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = height + Math.sin(t * 0.5) * 2;
      
      drone.position.set(x, y, z);
      
      // Rotate to face direction of travel
      drone.rotation.y = angle + (direction > 0 ? Math.PI / 2 : -Math.PI / 2);
      
      // Add slight banking effect
      drone.rotation.z = Math.sin(t * 2) * 0.1;
    });
  });
  
  // Drone model
  const Drone = React.forwardRef<THREE.Group, { position: [number, number, number] }>(
    ({ position }, ref) => {
      const neonColor = useMemo(() => {
        const colors = [
          new THREE.Color('#FF00FF'), // Magenta
          new THREE.Color('#00FFFF'), // Cyan
          new THREE.Color('#FF2D00'), // Orange-red
          new THREE.Color('#39FF14'), // Neon green
        ];
        return colors[Math.floor(Math.random() * colors.length)];
      }, []);
      
      return (
        <group ref={ref} position={position}>
          {/* Drone body */}
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.15, 0.8]} />
            <meshStandardMaterial color="#101010" metalness={0.9} roughness={0.1} />
          </mesh>
          
          {/* Neon outline */}
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(0.5, 0.15, 0.8)]} />
            <lineBasicMaterial color={neonColor} />
          </lineSegments>
          
          {/* Rotors */}
          {[[-0.3, 0.05, -0.3], [0.3, 0.05, -0.3], [-0.3, 0.05, 0.3], [0.3, 0.05, 0.3]].map((pos, i) => (
            <mesh key={i} position={pos as [number, number, number]} castShadow>
              <cylinderGeometry args={[0.15, 0.15, 0.05, 8]} />
              <meshStandardMaterial color="#202020" metalness={0.8} roughness={0.2} />
            </mesh>
          ))}
          
          {/* Lights */}
          <pointLight position={[0, 0, 0.4]} color={neonColor} intensity={0.5} distance={3} />
          <mesh position={[0, -0.1, 0.35]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color={neonColor} />
          </mesh>
          
          {/* Light trail */}
          <Trail
            width={0.3}
            length={4}
            color={neonColor}
            attenuation={(t) => t * t}
          >
            <mesh position={[0, -0.1, -0.35]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshBasicMaterial color={neonColor} />
            </mesh>
          </Trail>
        </group>
      );
    }
  );
  
  return (
    <>
      {Array(count).fill(0).map((_, i) => (
        <Drone
          key={i}
          ref={(el) => {
            if (el) droneRefs.current[i] = el;
          }}
          position={[
            (Math.random() - 0.5) * 50,
            10 + Math.random() * 20,
            (Math.random() - 0.5) * 50,
          ]}
        />
      ))}
    </>
  );
}

// Rain effect
function RainEffect({ count = 2000 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Generate rain drop positions
  const rainPositions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 100;
      positions[i3 + 1] = Math.random() * 50;
      positions[i3 + 2] = (Math.random() - 0.5) * 100;
    }
    return positions;
  }, [count]);
  
  // Update rain positions
  useFrame(() => {
    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        
        // Move rain downward
        positions[i3 + 1] -= 0.2 + Math.random() * 0.1;
        
        // Reset position when below ground
        if (positions[i3 + 1] < -0.1) {
          positions[i3] = (Math.random() - 0.5) * 100;
          positions[i3 + 1] = 50;
          positions[i3 + 2] = (Math.random() - 0.5) * 100;
        }
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={rainPositions}
          itemSize={3}
          args={[rainPositions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#88CCFF"
        size={0.1}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// Lightning flash effect
function LightningEffect() {
  const [intensity, setIntensity] = useState(0);
  
  useEffect(() => {
    // Schedule random lightning flashes
    const intervalId = setInterval(() => {
      if (Math.random() > 0.7) {
        const flashDuration = 100 + Math.random() * 100;
        const maxIntensity = 2 + Math.random() * 3;
        
        setIntensity(maxIntensity);
        
        setTimeout(() => {
          setIntensity(0);
        }, flashDuration);
      }
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  return (
    <ambientLight color="#88CCFF" intensity={intensity} />
  );
}

// Digital constellations in the sky
function DigitalConstellations() {
  const pointsRef = useRef<THREE.Points>(null);
  
  const nodeCount = 100;
  const edgeCount = 50;
  
  // Generate nodes
  const nodePositions = useMemo(() => {
    const positions = new Float32Array(nodeCount * 3);
    for (let i = 0; i < nodeCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 150 + Math.random() * 50;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) + 20;
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    return positions;
  }, []);
  
  // Generate edges
  const edgePositions = useMemo(() => {
    const positions = new Float32Array(edgeCount * 6);
    for (let i = 0; i < edgeCount; i++) {
      const startNode = Math.floor(Math.random() * nodeCount);
      let endNode;
      do {
        endNode = Math.floor(Math.random() * nodeCount);
      } while (endNode === startNode);
      
      // Start point
      positions[i * 6] = nodePositions[startNode * 3];
      positions[i * 6 + 1] = nodePositions[startNode * 3 + 1];
      positions[i * 6 + 2] = nodePositions[startNode * 3 + 2];
      
      // End point
      positions[i * 6 + 3] = nodePositions[endNode * 3];
      positions[i * 6 + 4] = nodePositions[endNode * 3 + 1];
      positions[i * 6 + 5] = nodePositions[endNode * 3 + 2];
    }
    return positions;
  }, [nodePositions]);
  
  // Animate constellation
  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.01;
    }
  });
  
  return (
    <group ref={pointsRef}>
      {/* Nodes */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={nodeCount}
            array={nodePositions}
            itemSize={3}
            args={[nodePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.7}
          color="#00FFFF"
          transparent
          opacity={0.7}
          sizeAttenuation
        />
      </points>
      
      {/* Edges */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={edgeCount * 2}
            array={edgePositions}
            itemSize={3}
            args={[edgePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#00FFFF" transparent opacity={0.3} />
      </lineSegments>
    </group>
  );
}

// Volumetric cloud layer
function CloudLayer() {
  return (
    <group position={[0, 30, 0]}>
      {Array(12).fill(0).map((_, i) => (
        <Cloud
          key={i}
          position={[
            (Math.random() - 0.5) * 80,
            Math.random() * 15,
            (Math.random() - 0.5) * 80,
          ]}
          opacity={0.5}
          speed={0.2}
        />
      ))}
    </group>
  );
}

// Camera controller with smooth movement
function CameraController() {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(40, 20, 40));
  const targetLookAt = useRef(new THREE.Vector3(0, 5, 0));
  
  // Set up camera animation
  useEffect(() => {
    // Initial camera position
    camera.position.set(40, 20, 40);
    camera.lookAt(0, 5, 0);
    
    // Generate new camera target positions periodically
    const intervalId = setInterval(() => {
      // Choose a new random position around the city
      const angle = Math.random() * Math.PI * 2;
      const distance = 35 + Math.random() * 15;
      const height = 15 + Math.random() * 10;
      
      targetPosition.current.set(
        Math.cos(angle) * distance,
        height,
        Math.sin(angle) * distance
      );
      
      // Slight variation in look target
      targetLookAt.current.set(
        (Math.random() - 0.5) * 10,
        5 + Math.random() * 5,
        (Math.random() - 0.5) * 10
      );
    }, 15000); // Change camera angle every 15 seconds
    
    return () => clearInterval(intervalId);
  }, [camera]);
  
  // Smoothly move camera
  useFrame(() => {
    // Smooth interpolation to target position
    camera.position.lerp(targetPosition.current, 0.01);
    
    // Create a temporary target vector for lookAt
    const currentLookAt = new THREE.Vector3();
    currentLookAt.copy(camera.position);
    currentLookAt.lerp(targetLookAt.current, 0.01);
    
    camera.lookAt(currentLookAt);
  });
  
  return null;
}

// Cyberpunk skyscrapers
function CyberpunkBuildings({ count = 70, newsArticles }: { count: number, newsArticles: NewsArticle[] }) {
  const { theme } = useTheme();
  
  // Building properties
  const buildingData = useMemo(() => {
    const data = [];
    const gridSize = Math.ceil(Math.sqrt(count));
    const spacing = 4;
    
    // Neon color palette
    const neonColors = [
      new THREE.Color('#FF00FF'), // Magenta
      new THREE.Color('#00FFFF'), // Cyan
      new THREE.Color('#FF2D00'), // Orange-red
      new THREE.Color('#39FF14'), // Neon green
      new THREE.Color('#FE01B1'), // Pink
      new THREE.Color('#01FEFE'), // Light blue
    ];
    
    // Generate various building types and positions in a grid pattern
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      
      // Add some variation to building positions
      const x = (col - gridSize/2) * spacing + (Math.random() - 0.5) * spacing * 0.7;
      const z = (row - gridSize/2) * spacing + (Math.random() - 0.5) * spacing * 0.7;
      
      // Building height variation (taller for cyberpunk city)
      const height = 3 + Math.random() * 15;
      
      // Building type/style (0: skyscraper, 1: wider building, 2: industrial)
      const buildingType = Math.floor(Math.random() * 3);
      
      // Base color with slight variations (dark for cyberpunk aesthetic)
      const baseColor = new THREE.Color('#101318').offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);
      
      // Neon edge color
      const neonColor = neonColors[Math.floor(Math.random() * neonColors.length)];
      
      // Should this building have a billboard?
      const hasBillboard = i < newsArticles.length && Math.random() > 0.6;
      
      data.push({
        position: [x, height / 2, z],
        scale: [
          buildingType === 1 ? 2 + Math.random() : 1 + Math.random() * 0.5,
          height,
          buildingType === 1 ? 2 + Math.random() : 1 + Math.random() * 0.5,
        ],
        rotation: [0, Math.random() * Math.PI * 2, 0],
        color: baseColor,
        neonColor,
        buildingType,
        hasBillboard,
        billboardArticle: hasBillboard ? newsArticles[i % newsArticles.length] : null,
        billboardHeight: height,
        billboardRotation: Math.random() * Math.PI * 2,
      });
    }
    return data;
  }, [count, theme, newsArticles]);
  
  return (
    <group>
      {buildingData.map((building, i) => (
        <React.Fragment key={`building-${i}`}>
          <NeonBuilding 
            position={building.position as [number, number, number]}
            scale={building.scale as [number, number, number]}
            rotation={building.rotation as [number, number, number]}
            color={building.color}
            neonColor={building.neonColor}
          />
          
          {/* Add billboards to some buildings */}
          {building.hasBillboard && (
            <NewsBillboard 
              position={[
                building.position[0] as number,
                (building.billboardHeight as number) + 1,
                building.position[2] as number
              ]}
              rotation={[0, building.billboardRotation as number, 0]}
              article={building.billboardArticle as NewsArticle}
              scale={2 + Math.random()}
            />
          )}
        </React.Fragment>
      ))}
    </group>
  );
}

// Main component - CyberpunkCityscape
interface CyberpunkCityscapeProps {
  newsArticles: NewsArticle[];
}

export default function CyberpunkCityscape({ newsArticles }: CyberpunkCityscapeProps) {
  const { resolvedTheme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  return (
    <div className="w-full h-[500px] relative">
      <Canvas
        shadows
        gl={{ antialias: true }}
        camera={{ position: [40, 20, 40], fov: 60 }}
        ref={canvasRef}
      >
        {/* Background color - deep blue/purple gradient */}
        <color attach="background" args={['#050518']} />
        
        {/* Scene lighting */}
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={0.5} 
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <hemisphereLight args={['#2a265f', '#000000', 0.3]} />
        
        {/* Atmospheric effects */}
        <fog attach="fog" args={['#090420', 20, 100]} />
        <CloudLayer />
        <LightningEffect />
        <DigitalConstellations />
        
        {/* City elements */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <MeshReflectorMaterial
            blur={[400, 100]}
            resolution={1024}
            mirror={0.75}
            mixBlur={10}
            mixStrength={1.5}
            color="#050505"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        <CyberpunkBuildings count={70} newsArticles={newsArticles} />
        <FlyingDrones count={15} />
        <RainEffect count={2000} />
        
        {/* Camera control */}
        <CameraController />
        
        {/* Post-processing effects */}
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            intensity={1.5}
          />
          <Noise
            opacity={0.025}
            blendFunction={BlendFunction.ADD}
          />
          <ChromaticAberration 
            offset={[0.0015, 0.0015]} 
            blendFunction={BlendFunction.NORMAL}
          />
          <Vignette
            darkness={0.7}
            offset={0.3}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
} 