'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  PerspectiveCamera, 
  OrbitControls, 
  Text, 
  Billboard, 
  MeshReflectorMaterial
} from '@react-three/drei';
import { useTheme } from 'next-themes';
import * as THREE from 'three';
import { colorPalette } from '@/utils/three-config';

// Types for news articles to display
interface NewsArticle {
  id: number;
  title: string;
  source: string;
  category?: string;
  url?: string;
}

// Building generator with instanced meshes for performance
function Buildings({ count = 25, newsArticles }: { count: number, newsArticles: NewsArticle[] }) {
  const { theme } = useTheme();
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const { viewport } = useThree();
  
  // Hardcoded news outlet names as requested
  const newsOutlets = [
    "CBC", 
    "CNN", 
    "News24", 
    "Punch", 
    "The Nation", 
    "Times of India", 
    "Japan Times", 
    "The Straits Times", 
    "BBC News", 
    "Spiegel International", 
    "France 24", 
    "ANSA", 
    "ABC News", 
    "The Rio Times", 
    "Xinhua News Agency"
  ];
  
  // Fallback content for billboards
  const fallbackTitles = [
    "Breaking news from around the world",
    "Latest cyberpunk technology revealed",
    "Corporate scandal rocks tech industry",
    "AI advancement changes global landscape",
    "Network security breach affects millions"
  ];
  
  const fallbackCategories = [
    "News", "Tech", "Business", "Science", "Politics"
  ];

  // Simplified cyberpunk color palette
  const neonColors = [
    new THREE.Color('#FF00FF'), // Magenta
    new THREE.Color('#00FFFF'), // Cyan
    new THREE.Color('#FF2D00'), // Orange-red
    new THREE.Color('#39FF14'), // Neon green
  ];
  
  // Define interface for building data
  interface BuildingData {
    position: [number, number, number];
    scale: [number, number, number];
    rotation: [number, number, number];
    color: THREE.Color;
    emissive: boolean;
    emissiveColor: THREE.Color;
    emissiveIntensity: number;
    buildingType: number;
    hasBillboard: boolean;
    billboardArticle: NewsArticle | null;
    billboardHeight: number;
    billboardRotation: number;
    hasNeonOutline: boolean;
    neonColor: THREE.Color;
  }
  
  // Building properties
  const buildingData = useMemo(() => {
    const data: BuildingData[] = [];
    const gridSize = Math.ceil(Math.sqrt(count));
    const spacing = 6; // Increased spacing for cleaner layout
    
    // Generate various building types and positions in a grid pattern
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      
      // Add some variation to building positions
      const x = (col - gridSize/2) * spacing + (Math.random() - 0.5) * spacing * 0.5;
      const z = (row - gridSize/2) * spacing + (Math.random() - 0.5) * spacing * 0.5;
      
      // Building height variation - more distinct heights
      const heightCategory = Math.floor(Math.random() * 3); // 3 height categories
      let height;
      
      if (heightCategory === 0) {
        // Short buildings
        height = 3 + Math.random() * 2;
      } else if (heightCategory === 1) {
        // Medium buildings
        height = 6 + Math.random() * 3;
      } else {
        // Tall buildings (skyscrapers)
        height = 10 + Math.random() * 4;
      }
      
      // Building type/style (0: skyscraper, 1: wider building)
      const buildingType = Math.floor(Math.random() * 2);
      
      // Base color with slight variations - darker for cyberpunk aesthetic
      const baseColorHSL = new THREE.Color('#0F1629').getHSL({h: 0, s: 0, l: 0});
      const color = new THREE.Color().setHSL(
        baseColorHSL.h + (Math.random() - 0.5) * 0.05,
        baseColorHSL.s + (Math.random() - 0.5) * 0.1,
        baseColorHSL.l + (Math.random() - 0.5) * 0.1
      );
      
      // Emissive lighting for windows - only on some buildings
      const hasEmissive = Math.random() > 0.3;
      const emissiveColor = neonColors[Math.floor(Math.random() * neonColors.length)];
      const emissiveIntensity = 0.5 + Math.random() * 0.5;
      
      // Only taller buildings get billboards, and fewer of them
      const hasBillboard = (heightCategory === 2 || heightCategory === 1) && Math.random() > 0.3;
      
      // Assign a specific news outlet to this billboard
      let billboardOutlet = null;
      let billboardArticle = null;
      
      if (hasBillboard) {
        billboardOutlet = newsOutlets[i % newsOutlets.length];
        // Keep original article data but replace source
        if (i < newsArticles.length) {
          billboardArticle = {
            ...newsArticles[i % newsArticles.length],
            source: billboardOutlet
          };
        } else {
          // Enhanced fallback articles with more variety
          billboardArticle = {
            id: i,
            title: fallbackTitles[i % fallbackTitles.length],
            source: billboardOutlet,
            category: fallbackCategories[i % fallbackCategories.length]
          };
        }
      }
      
      // Limit neon outlines to only specific buildings
      const hasNeonOutline = heightCategory === 2 && Math.random() > 0.6;
      
      data.push({
        position: [x, height / 2, z],
        scale: [
          buildingType === 1 ? 2 + Math.random() : 1 + Math.random() * 0.5,
          height,
          buildingType === 1 ? 2 + Math.random() : 1 + Math.random() * 0.5,
        ],
        rotation: [0, Math.random() * Math.PI * 2, 0],
        color,
        emissive: hasEmissive,
        emissiveColor,
        emissiveIntensity,
        buildingType,
        hasBillboard,
        billboardArticle: hasBillboard ? billboardArticle : null,
        billboardHeight: height,
        billboardRotation: Math.random() * Math.PI * 2,
        hasNeonOutline,
        neonColor: neonColors[Math.floor(Math.random() * neonColors.length)]
      });
    }
    
    // Additional pass to check and eliminate billboard overlaps
    // Sort buildings by height to prioritize taller buildings for billboards
    data.sort((a, b) => (b.scale[1] as number) - (a.scale[1] as number));
    
    // Keep track of billboard bounding volumes for collision detection
    const billboardVolumes: {
      position: [number, number, number], 
      width: number, 
      depth: number
    }[] = [];
    
    // Verify and remove billboards that would overlap
    data.forEach((building) => {
      if (building.hasBillboard) {
        const buildingX = building.position[0] as number;
        const buildingZ = building.position[2] as number;
        const buildingHeight = building.billboardHeight as number;
        
        // Default billboard dimensions
        const billboardWidth = 5.0; // Reduced width to allow more billboards
        const billboardDepth = 1.0; // Reduced depth to allow more billboards
        
        // Check if this billboard would overlap with any other building
        const wouldOverlap = data.some(otherBuilding => {
          // Skip self-comparison
          if (otherBuilding === building) return false;
          
          const otherX = otherBuilding.position[0] as number;
          const otherZ = otherBuilding.position[2] as number;
          const otherHeight = otherBuilding.scale[1] as number;
          const otherWidth = otherBuilding.scale[0] as number;
          const otherDepth = otherBuilding.scale[2] as number;
          
          // Calculate horizontal distance between buildings
          const distanceX = Math.abs(buildingX - otherX);
          const distanceZ = Math.abs(buildingZ - otherZ);
          
          // Check if billboard would intersect with other building
          const horizontalOverlap = 
            distanceX < (billboardWidth / 2 + otherWidth / 2) * 0.8 && 
            distanceZ < (billboardDepth / 2 + otherDepth / 2) * 0.8;
          
          // Only consider buildings that are almost as tall as where we want to place the billboard
          const otherBuildingTooTall = (otherHeight / 2 + otherBuilding.position[1]) > (buildingHeight - 0.5);
          
          return horizontalOverlap && otherBuildingTooTall;
        });
        
        if (wouldOverlap) {
          // Remove billboard from this building if it would overlap
          building.hasBillboard = false;
          building.billboardArticle = null;
        } else {
          // Add this billboard to the volumes list
          billboardVolumes.push({
            position: [buildingX, buildingHeight, buildingZ],
            width: billboardWidth,
            depth: billboardDepth
          });
        }
      }
    });
    
    return data;
  }, [count, newsArticles, newsOutlets, neonColors, fallbackTitles, fallbackCategories]);
  
  // Update the instanced meshes
  useEffect(() => {
    if (!instancedMeshRef.current) return;
    
    const mesh = instancedMeshRef.current;
    const tempObject = new THREE.Object3D();
    
    buildingData.forEach((building, i) => {
      const [x, y, z] = building.position as [number, number, number];
      const [sx, sy, sz] = building.scale as [number, number, number];
      const [rx, ry, rz] = building.rotation as [number, number, number];
      
      tempObject.position.set(x, y, z);
      tempObject.rotation.set(rx, ry, rz);
      tempObject.scale.set(sx, sy, sz);
      tempObject.updateMatrix();
      
      mesh.setMatrixAt(i, tempObject.matrix);
    });
    
    mesh.instanceMatrix.needsUpdate = true;
  }, [buildingData]);
  
  // Render the buildings with instanced meshes for performance
  return (
    <group>
      {/* Instanced buildings */}
      <instancedMesh 
        ref={instancedMeshRef} 
        args={[undefined, undefined, count]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color={'#0F1629'} // Darker base color for all buildings
          roughness={0.5}
          metalness={0.4}
        />
      </instancedMesh>
      
      {/* Add window lights as a separate pass for emissive buildings */}
      {buildingData.filter(b => b.emissive).map((building, i) => (
        <mesh 
          key={`window-${i}`}
          position={building.position as [number, number, number]}
          rotation={building.rotation as [number, number, number]}
          scale={[
            (building.scale[0] as number) * 1.01, 
            (building.scale[1] as number) * 1.01, 
            (building.scale[2] as number) * 1.01
          ]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshLambertMaterial 
            emissive={building.emissiveColor} 
            emissiveIntensity={building.emissiveIntensity as number}
            transparent
            opacity={0.9}
            wireframe
            wireframeLinewidth={2}
          />
        </mesh>
      ))}
      
      {/* Selectively add neon outlines - only to important buildings */}
      {buildingData.filter(b => b.hasNeonOutline).map((building, i) => (
        <NeonOutline
          key={`outline-${i}`}
          position={building.position as [number, number, number]}
          rotation={building.rotation as [number, number, number]}
          scale={building.scale as [number, number, number]}
          color={building.neonColor as THREE.Color}
        />
      ))}
      
      {/* Add billboards to buildings with cleaner placement */}
      {buildingData.filter(b => b.hasBillboard && b.billboardArticle).map((building, i) => {
        // Position well above the building top
        const position: [number, number, number] = [
          building.position[0] as number,
          (building.billboardHeight as number) + 1.5, // Slightly lower for better visibility
          building.position[2] as number
        ];
            
        // Calculate rotation to always face the camera
        const baseRotation = Math.atan2(
          position[0], 
          position[2]
        );
        
        // Use a more predictable rotation that ensures visibility
        const rotation: [number, number, number] = [0, baseRotation, 0];
            
        return (
          <NewsBillboard 
            key={`billboard-${i}`}
            position={position}
            rotation={rotation}
            article={building.billboardArticle as NewsArticle}
            scale={1.8} // Slightly smaller for more billboards
            buildingId={i}
          />
        );
      })}
      
      {/* Add floating billboards not attached to buildings */}
      {[...Array(12)].map((_, i) => {
        // Position floating billboards around the cityscape perimeter
        const angle = (i / 12) * Math.PI * 2;
        const radius = 25 + Math.random() * 10; // Distance from center
        const height = 8 + Math.random() * 15; // Random height
        
        const position: [number, number, number] = [
          Math.sin(angle) * radius,
          height,
          Math.cos(angle) * radius
        ];
        
        // Calculate rotation to face the center
        const rotationY = Math.atan2(position[0], position[2]) + Math.PI;
        const rotation: [number, number, number] = [0, rotationY, 0];

        // Create or reuse available article data
        const billboardArticle = i < newsArticles.length 
          ? {
              ...newsArticles[i % newsArticles.length],
              source: newsOutlets[i % newsOutlets.length]
            }
          : {
              id: i + 1000, // Prevent ID collisions
              title: fallbackTitles[i % fallbackTitles.length],
              source: newsOutlets[i % newsOutlets.length],
              category: fallbackCategories[i % fallbackCategories.length]
            };
        
        return (
          <NewsBillboard 
            key={`floating-billboard-${i}`}
            position={position}
            rotation={rotation}
            article={billboardArticle}
            scale={2.5} // Larger for floating billboards
            buildingId={i + 1000} // Prevent ID collisions
          />
        );
      })}
    </group>
  );
}

// Neon building outline - simplified for performance
function NeonOutline({ position, rotation, scale, color }: {
  position: [number, number, number],
  rotation: [number, number, number],
  scale: [number, number, number],
  color: THREE.Color
}) {
  const lineRef = useRef<THREE.LineSegments>(null);
  
  // Skip the animation frames for better performance
  useFrame(({ clock }) => {
    if (lineRef.current && Math.floor(clock.getElapsedTime() * 3) % 4 === 0) {
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      const pulse = Math.sin(clock.getElapsedTime() * 1.5) * 0.3 + 0.7;
      material.color.setRGB(
        color.r * pulse,
        color.g * pulse,
        color.b * pulse
      );
    }
  });
  
  // Ultra simplified geometry
  return (
    <lineSegments
      ref={lineRef}
      position={position}
      rotation={rotation}
      scale={[scale[0] * 1.02, scale[1] * 1.02, scale[2] * 1.02]}
    >
      <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1, 1, 1, 1)]} />
      <lineBasicMaterial color={color} linewidth={2} />
    </lineSegments>
  );
}

// Road network for the city
function RoadNetwork() {
  const { theme } = useTheme();
  
  // Create road texture
  const roadTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return new THREE.CanvasTexture(canvas);
    
    // Dark asphalt
    ctx.fillStyle = theme === 'dark' ? '#1E293B' : '#334155';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Road markings
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 4;
    
    // Dashed center line
    ctx.setLineDash([20, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    
    // Road edge markings
    ctx.strokeStyle = '#FFFFFF';
    ctx.setLineDash([]);
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(10, canvas.height);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(canvas.width - 10, 0);
    ctx.lineTo(canvas.width - 10, canvas.height);
    ctx.stroke();
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    
    return texture;
  }, [theme]);
  
  return (
    <group>
      {/* Main roads */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial 
          map={roadTexture}
          roughness={0.8}
          metalness={0.1}
          color={theme === 'dark' ? '#1E293B' : '#334155'}
        />
      </mesh>
      
      {/* Road reflections for wet effect */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[100, 100]} />
        <MeshReflectorMaterial
          blur={[400, 100]}
          resolution={1024}
          mirror={0.5}
          mixBlur={1}
          mixStrength={0.8}
          color={theme === 'dark' ? '#1E293B' : '#334155'}
          metalness={0.4}
          roughnessMap={roadTexture}
        />
      </mesh>
    </group>
  );
}

// Lightning flashes
function LightningEffect() {
  const [intensity, setIntensity] = useState(0);
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (Math.random() > 0.93) {
        const maxIntensity = 3 + Math.random() * 5;
        setIntensity(maxIntensity);
        
        // Flash duration
        setTimeout(() => {
          setIntensity(0);
        }, 100 + Math.random() * 150);
      }
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  return (
    <directionalLight 
      position={[0, 50, 0]} 
      intensity={intensity} 
      color="#88CCFF"
    />
  );
}

// Ground plane with reflections
function CyberpunkGround() {
    return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -0.1, 0]} 
      receiveShadow
    >
      <planeGeometry args={[200, 200, 50, 50]} />
      <MeshReflectorMaterial
        blur={[300, 100]}
        resolution={1024}
        mixBlur={1}
        mixStrength={1.5}
        roughness={0.7}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#050505"
        metalness={0.5}
      />
        </mesh>
  );
}

// Camera control updater for smooth auto-rotation
function CameraControlUpdater() {
  const { controls } = useThree();
  
  useFrame(() => {
    if (controls && 'update' in controls) {
      // Ensure controls target is always at the center of the buildings
      if ((controls as any).target) {
        (controls as any).target.set(0, 0, 0);
      }
      (controls as any).update();
    }
  });
  
  return null;
}

// Animated news billboard
function NewsBillboard({ position, rotation, article, scale = 1, buildingId }: { 
  position: [number, number, number],
  rotation: [number, number, number],
  article: NewsArticle | null,
  scale?: number,
  buildingId: number
}) {
  const { theme } = useTheme();
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [glitching, setGlitching] = useState(false);
  
  // Default article if none provided
  const safeArticle = useMemo(() => article || {
    id: Math.random(),
    title: "System Error: Data Unavailable",
    source: "ERROR",
    category: "System"
  }, [article]);
  
  // Create an animated headline
  const [visibleChars, setVisibleChars] = useState(0);
  
  // Less frequent glitch effects
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      // Reduce probability of glitch effect
      if (Math.random() > 0.85) {
        setGlitching(true);
        setTimeout(() => setGlitching(false), 200 + Math.random() * 100);
      }
    }, 6000 + Math.random() * 6000); // Less frequent glitch
    
    return () => clearInterval(glitchInterval);
  }, []);
  
  // Typing animation for headlines
  useEffect(() => {
    if (visibleChars >= safeArticle.title.length) return;
    
    const typingTimer = setInterval(() => {
      setVisibleChars(prev => {
        if (prev >= safeArticle.title.length) {
          clearInterval(typingTimer);
          return prev;
        }
        return prev + 1;
      });
    }, 100); // Slower typing
    
    return () => clearInterval(typingTimer);
  }, [safeArticle.title]);
  
  // Create display texture with news headline
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256; // Reduced resolution
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return new THREE.CanvasTexture(canvas);
    
    // Create glowing billboard background
    const bgColor = '#050518';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add tech patterns - cyberpunk style
    ctx.strokeStyle = glitching ? '#FF00FF' : '#00FFFF';
    ctx.lineWidth = 1;
    
    // Simplified grid pattern
    const gridSpacing = 32;
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
    
    // Add a glow - more intense for cyberpunk
    let glowColor1, glowColor2, headerColor;
    
    // Use different colors based on news outlet to create variety
    switch(safeArticle.source) {
      case 'CNN':
        glowColor1 = 'rgba(255, 0, 0, 0.5)';
        glowColor2 = 'rgba(255, 0, 0, 0)';
        headerColor = '#CC0000';
        break;
      case 'BBC News':
        glowColor1 = 'rgba(187, 25, 25, 0.5)';
        glowColor2 = 'rgba(187, 25, 25, 0)';
        headerColor = '#BB1919';
        break;
      case 'CBC':
        glowColor1 = 'rgba(255, 0, 0, 0.5)';
        glowColor2 = 'rgba(255, 0, 0, 0)';
        headerColor = '#FF0000';
        break;
      case 'ABC News':
        glowColor1 = 'rgba(0, 0, 255, 0.5)';
        glowColor2 = 'rgba(0, 0, 255, 0)';
        headerColor = '#0000FF';
        break;
      default:
        // Default to cyan for most outlets
        glowColor1 = 'rgba(0, 255, 255, 0.5)';
        glowColor2 = 'rgba(0, 255, 255, 0)';
        headerColor = '#00FFFF';
    }
    
    // Add radial glow
    const glow = ctx.createRadialGradient(
      canvas.width/2, canvas.height/2, 10,
      canvas.width/2, canvas.height/2, canvas.width/1.5
    );
    glow.addColorStop(0, glowColor1);
    glow.addColorStop(1, glowColor2);
    
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Source name at top - brighter
    ctx.fillStyle = headerColor;
    ctx.font = 'bold 16px Arial';
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.fillText(safeArticle.source.toUpperCase(), canvas.width/2, 20);
    
    // Category if available
    if (safeArticle.category) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px Arial';
      ctx.fillText(safeArticle.category, canvas.width/2, 40);
    }
    
    // Animated headline text
    const displayText = safeArticle.title.substring(0, visibleChars);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    
    // Add text with line wrapping
    const words = displayText.split(' ');
    let line = '';
    let y = 70; // Start position for text
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > canvas.width - 20 && i > 0) {
        ctx.fillText(line, canvas.width/2, y);
        line = words[i] + ' ';
        y += 20;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, canvas.width/2, y);
    
    // Add glitch effect
    if (glitching) {
      // Add random color strips
      for (let i = 0; i < 5; i++) {
        const y = Math.random() * canvas.height;
        const height = 1 + Math.random() * 3;
        ctx.fillStyle = Math.random() > 0.5 ? '#FF00FF' : '#00FFFF';
        ctx.fillRect(0, y, canvas.width, height);
      }
      
      // Displace some pixels
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < 50; i++) {
        const x = Math.floor(Math.random() * canvas.width);
        const y = Math.floor(Math.random() * canvas.height);
        const pos = (y * canvas.width + x) * 4;
        
        // Move some pixels to create "data corruption" look
        if (pos + canvas.width * 4 < data.length) {
          data[pos] = data[pos + canvas.width * 4];
          data[pos + 1] = data[pos + 1 + canvas.width * 4];
          data[pos + 2] = data[pos + 2 + canvas.width * 4];
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, [safeArticle, glitching, visibleChars]);
  
  // Pulsating and hover effects
  useFrame(({ clock }) => {
    if (groupRef.current && Math.floor(clock.getElapsedTime() * 10) % 2 === 0) {
      const t = clock.getElapsedTime();
      
      // Apply subtle floating motion
      groupRef.current.position.y = position[1] + Math.sin(t * 0.5) * 0.1;
      
      // Apply glitch effect only when glitching
      if (glitching) {
        groupRef.current.position.x = position[0] + (Math.random() - 0.5) * 0.1;
        groupRef.current.position.z = position[2] + (Math.random() - 0.5) * 0.1;
      } else {
        groupRef.current.position.x = position[0];
        groupRef.current.position.z = position[2];
      }
      
      // Grow slightly when hovered
      if (hovered) {
        groupRef.current.scale.set(scale * 1.1, scale * 1.1, scale * 1.1);
      } else {
        groupRef.current.scale.set(scale, scale, scale);
      }
    }
  });
  
  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
      onClick={() => setClicked(!clicked)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Main billboard display - double sided */}
      <mesh>
        <planeGeometry args={[3, 1.5]} />
        <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
      </mesh>
      
      {/* Simplified neon frame */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(3.1, 1.6, 1, 1)]} />
        <lineBasicMaterial color={glitching ? new THREE.Color('#FF00FF') : new THREE.Color('#00FFFF')} />
      </lineSegments>
    </group>
  );
}

// Main component - optimized scene setup
export default function FuturisticCityscape({ newsArticles }: { newsArticles: NewsArticle[] }) {
  const { theme } = useTheme();
  const [highPerformanceDevice, setHighPerformanceDevice] = useState(false);
  
  // Check device capability once on client-side
  useEffect(() => {
    // Simple heuristic to detect high-performance devices
    const isHighEnd = 
      // Check for desktop device (likely more powerful)
      typeof navigator !== 'undefined' && 
      !navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i) && 
      // Check for modern API support
      typeof window.requestAnimationFrame === 'function' &&
      // Check screen resolution (higher res likely means better hardware)
      window.screen.width >= 1440;
    
    setHighPerformanceDevice(isHighEnd);
  }, []);
  
  // Simplified post-processing (minimal)
  const postProcessingEffects = () => {
    if (typeof window === 'undefined') return null;
    
    const { EffectComposer, Bloom } = require('@react-three/postprocessing');
  
  return (
      <EffectComposer multisampling={0} frameBufferType={undefined}> 
        <Bloom
          luminanceThreshold={0.5} // Even higher threshold = less bloom
          luminanceSmoothing={0.8}
          intensity={0.8} // Reduced intensity
        />
      </EffectComposer>
    );
  };
  
  return (
    // Remove fixed height to fill entire container
    <div className="w-full h-full absolute inset-0">
      <Canvas
        shadows={false} // Disable shadows completely for performance
        dpr={[1, 1.5]} // Limit resolution scaling
        camera={{ position: [0, 35, 55], fov: 30 }} // Adjusted to look at building center
        gl={{ 
          antialias: false, // Disable antialias for performance
          powerPreference: 'high-performance' 
        }}
        // Add this to prevent scroll-triggered re-renders
        resize={{ scroll: false }}
      >
        {/* Background color */}
        <color attach="background" args={['#050518']} />
        
        {/* Atmospheric fog - simplified */}
        <fog attach="fog" args={['#090420', 80, 100]} />
        
        {/* Orbital camera controls - auto-rotation only */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
          enableDamping={false} // Disable damping for better performance
          target={[-2.5, 6, 0]} // Look at the middle of buildings (above ground level)
          autoRotate={true}
          autoRotateSpeed={0.5} // Even slower rotation for better viewing
        />
        
        {/* Main lighting - simplified */}
        <ambientLight intensity={0.15} />
        
        {/* Single directional light */}
        <directionalLight 
          position={[10, 20, 10]}
          intensity={0.3}
          castShadow={false}
        />
        
        {/* City elements - core functionality only */}
        <CyberpunkGround />
        <Buildings count={35} newsArticles={newsArticles} />
        
        {/* Only add flying vehicles on high-end devices */}
        {highPerformanceDevice && (
          <>
            <LightningEffect />
          </>
        )}
        
        {/* Post-processing effects - minimal */}
        {postProcessingEffects()}
      </Canvas>
    </div>
  );
} 