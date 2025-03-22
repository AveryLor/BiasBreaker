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
function Buildings({ count = 40, newsArticles }: { count: number, newsArticles: NewsArticle[] }) {
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
    "Network security breach affects millions",
    "Virtual reality reaches new milestone",
    "Drone regulations tightened in metro areas",
    "Cryptocurrency market sees major shift",
    "Biotech implants become mainstream",
    "Climate control systems fail in sector 7"
  ];
  
  const fallbackCategories = [
    "News", "Tech", "Business", "Science", "Politics", 
    "Health", "Entertainment", "Sports", "Security", "Environment"
  ];

  // Cyberpunk color palette
  const neonColors = [
    new THREE.Color('#FF00FF'), // Magenta
    new THREE.Color('#00FFFF'), // Cyan
    new THREE.Color('#FF2D00'), // Orange-red
    new THREE.Color('#39FF14'), // Neon green
    new THREE.Color('#FE01B1'), // Pink
    new THREE.Color('#01FEFE'), // Light blue
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
    const spacing = 5;
    const citySize = gridSize * spacing;
    
    // Generate various building types and positions in a grid pattern
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      
      // Add some variation to building positions
      const x = (col - gridSize/2) * spacing + (Math.random() - 0.5) * spacing * 0.7;
      const z = (row - gridSize/2) * spacing + (Math.random() - 0.5) * spacing * 0.7;
      
      // Building height variation (taller for cyberpunk city)
      const height = 3 + Math.random() * 12;
      
      // Building type/style (0: skyscraper, 1: wider building, 2: industrial)
      const buildingType = Math.floor(Math.random() * 3);
      
      // Base color with slight variations - darker for cyberpunk aesthetic
      const baseColorHSL = new THREE.Color('#0F1629').getHSL({h: 0, s: 0, l: 0});
      const color = new THREE.Color().setHSL(
        baseColorHSL.h + (Math.random() - 0.5) * 0.05,
        baseColorHSL.s + (Math.random() - 0.5) * 0.1,
        baseColorHSL.l + (Math.random() - 0.5) * 0.1
      );
      
      // Emissive lighting for windows - brighter for cyberpunk
      const hasEmissive = Math.random() > 0.2; // More emissive buildings
      const emissiveColor = neonColors[Math.floor(Math.random() * neonColors.length)];
      const emissiveIntensity = 0.4 + Math.random() * 0.6; // Brighter
      
      // Should this building have a billboard? Only about 1/3 of buildings get billboards
      const hasBillboard = Math.random() > 0.25; // Increased probability (was 0.65)
      
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
          // Select random content for variety
          billboardArticle = {
            id: i,
            title: fallbackTitles[i % fallbackTitles.length],
            source: billboardOutlet,
            category: fallbackCategories[i % fallbackCategories.length]
          };
        }
      }
      
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
        hasNeonOutline: Math.random() > 0.3, // Some buildings get neon outlines
        neonColor: neonColors[Math.floor(Math.random() * neonColors.length)],
        // Remove secondary billboard properties
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
        const billboardWidth = 5.0; // Increased width for better overlap detection
        const billboardDepth = 1.0; // Increased depth for better overlap detection
        
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
          // A billboard positioned on top of building would be at buildingHeight + offset
          // We need to check if any part of the other building would intersect with this space
          
          // First, check horizontal overlap
          const horizontalOverlap = 
            distanceX < (billboardWidth / 2 + otherWidth / 2) && 
            distanceZ < (billboardDepth / 2 + otherDepth / 2);
          
          // Then check if the other building is tall enough to cause problems
          // Only consider buildings that are almost as tall as where we want to place the billboard
          const otherBuildingTooTall = (otherHeight / 2 + otherBuilding.position[1]) > (buildingHeight - 1);
          
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
  }, [count, theme, newsArticles, newsOutlets, neonColors, fallbackTitles, fallbackCategories]);
  
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

      {/* Add neon outlines to some buildings */}
      {buildingData.filter(b => b.hasNeonOutline).map((building, i) => (
        <NeonOutline
          key={`outline-${i}`}
          position={building.position as [number, number, number]}
          rotation={building.rotation as [number, number, number]}
          scale={building.scale as [number, number, number]}
          color={building.neonColor as THREE.Color}
        />
      ))}
      
      {/* Add billboards to buildings with overlap prevention */}
      {buildingData.filter(b => b.hasBillboard && b.billboardArticle).map((building, i) => {
        // Position well above the building top
        const position: [number, number, number] = [
          building.position[0] as number,
          (building.billboardHeight as number) + 1.5, // Increased height to place billboard well above building
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
            scale={1.5 + Math.random() * 0.2}
            buildingId={i}
          />
        );
      })}
    </group>
  );
}

// Neon building outline
function NeonOutline({ position, rotation, scale, color }: {
  position: [number, number, number],
  rotation: [number, number, number],
  scale: [number, number, number],
  color: THREE.Color
}) {
  const lineRef = useRef<THREE.LineSegments>(null);
  
  // Pulse effect - less frequent updates
  useFrame(({ clock }) => {
    if (lineRef.current && Math.floor(clock.getElapsedTime() * 5) % 3 === 0) {
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      const pulse = Math.sin(clock.getElapsedTime() * 2) * 0.3 + 0.7;
      material.color.setRGB(
        color.r * pulse,
        color.g * pulse,
        color.b * pulse
      );
    }
  });
  
  // Simplified geometry (fewer edges)
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
  
  // Create display texture - lower resolution and simpler patterns
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256; // Reduced from 512
    canvas.height = 128; // Reduced from 256
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return new THREE.CanvasTexture(canvas);
    
    // Create glowing billboard background - darker for cyberpunk
    const bgColor = '#050518';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some tech patterns - more pronounced for cyberpunk
    ctx.strokeStyle = glitching ? '#FF00FF' : '#00FFFF';
    ctx.lineWidth = 1;
    
    // Simplified grid pattern - fewer lines
    const gridSpacing = 32; // Increased from 20
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
    const gradient = ctx.createRadialGradient(
      canvas.width/2, canvas.height/2, 0,
      canvas.width/2, canvas.height/2, canvas.width/2
    );
    
    // Use different colors based on news outlet to create variety
    let glowColor1, glowColor2, headerColor;
    
    // Map specific colors to different news outlets
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
      case 'France 24':
        glowColor1 = 'rgba(0, 0, 255, 0.5)';
        glowColor2 = 'rgba(0, 0, 255, 0)';
        headerColor = '#0078D7';
        break;
      case 'Xinhua News Agency':
        glowColor1 = 'rgba(255, 0, 0, 0.5)';
        glowColor2 = 'rgba(255, 0, 0, 0)';
        headerColor = '#DE2910';
        break;
      case 'Japan Times':
        glowColor1 = 'rgba(255, 0, 0, 0.5)';
        glowColor2 = 'rgba(255, 0, 0, 0)';
        headerColor = '#BC002D';
        break;
      default:
        glowColor1 = 'rgba(0, 255, 255, 0.5)';
        glowColor2 = 'rgba(0, 255, 255, 0)';
        headerColor = '#0066FF';
    }
    
    gradient.addColorStop(0, glitching ? 'rgba(255, 0, 255, 0.5)' : glowColor1);
    gradient.addColorStop(1, glitching ? 'rgba(255, 0, 255, 0)' : glowColor2);
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Header bar
    ctx.fillStyle = glitching ? '#FF00FF' : headerColor;
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, canvas.width, 40);
    
    // Source label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px monospace'; // Using monospace for cyberpunk feel
    ctx.textAlign = 'center';
    ctx.fillText(safeArticle.source.toUpperCase(), canvas.width/2, 28);
    
    // Category label if available
    if (safeArticle.category) {
      ctx.fillStyle = glitching ? '#FF00FF' : '#00FFFF';
      ctx.font = '16px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`#${safeArticle.category.toUpperCase()}`, canvas.width - 10, 26);
    }
    
    // Headline (with typing animation effect)
    const headline = safeArticle.title;
    const visibleHeadline = headline.substring(0, visibleChars);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px monospace'; // Using monospace font
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add some glitch effect to the text if glitching
    if (glitching) {
      const originalText = ctx.fillStyle;
      ctx.fillStyle = '#FF00FF';
      
      // Offset text slightly for chromatic aberration effect
      const wrapTextGlitch = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const words = text.split(' ');
        let line = '';
        let lineY = y;
        
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          
          if (testWidth > maxWidth && n > 0) {
            // Red channel offset
            ctx.fillStyle = '#FF0000';
            ctx.fillText(line, x - 2, lineY);
            
            // Blue channel offset
            ctx.fillStyle = '#0000FF';
            ctx.fillText(line, x + 2, lineY);
            
            // Green at original position for "RGB" split effect
            ctx.fillStyle = '#00FF00';
            ctx.fillText(line, x, lineY);
            
            line = words[n] + ' ';
            lineY += lineHeight;
          } else {
            line = testLine;
          }
        }
        
        // Final line with glitch effect
        ctx.fillStyle = '#FF0000';
        ctx.fillText(line, x - 2, lineY);
        ctx.fillStyle = '#0000FF';
        ctx.fillText(line, x + 2, lineY);
        ctx.fillStyle = '#00FF00';
        ctx.fillText(line, x, lineY);
      };
      
      wrapTextGlitch(visibleHeadline, canvas.width/2, 120, canvas.width - 40, 34);
      ctx.fillStyle = originalText;
    } else {
      // Normal wrap text function
      const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const words = text.split(' ');
        let line = '';
        let lineY = y;
        
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          
          if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, lineY);
            line = words[n] + ' ';
            lineY += lineHeight;
          } else {
            line = testLine;
          }
        }
        
        ctx.fillText(line, x, lineY);
      };
      
      wrapText(visibleHeadline, canvas.width/2, 120, canvas.width - 40, 34);
    }
    
    // Add a blinking cursor at the end of the visible text
    if (visibleChars < headline.length && Math.floor(Date.now() / 500) % 2 === 0) {
      ctx.fillStyle = glitching ? '#FF00FF' : '#00FFFF'; 
      ctx.fillRect(canvas.width/2 + ctx.measureText(visibleHeadline).width/2 + 5, 120, 10, 28);
    }
    
    return new THREE.CanvasTexture(canvas);
  }, [safeArticle, theme, visibleChars, glitching]);
  
  // Typing animation - slower to reduce updates
  useEffect(() => {
    const typingTimer = setInterval(() => {
      setVisibleChars(prev => {
        if (prev >= safeArticle.title.length) {
          // Completely displayed, pause for a bit then reset
          setTimeout(() => {
            setVisibleChars(0);
          }, 5000); // Longer pause
          return prev;
        }
        return prev + 1;
      });
    }, 100); // Slower typing (was 80)
    
    return () => clearInterval(typingTimer);
  }, [safeArticle.title]);
  
  // Pulsating and hover effects - less frequent updates
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
      
      // Grow slightly when hovered - simpler lerp
      if (hovered) {
        groupRef.current.scale.set(scale * 1.1, scale * 1.1, scale * 1.1);
      } else {
        groupRef.current.scale.set(scale, scale, scale);
      }
    }
  });
  
  // Handle interactions
  const handleClick = () => {
    setClicked(!clicked);
  };
  
  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Main billboard display - double sided */}
      <mesh>
        <planeGeometry args={[3, 1.5]} />
        <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} /> {/* Render both sides */}
      </mesh>
      
      {/* Simplified neon frame */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(3.1, 1.6, 1, 1)]} /> {/* Reduced segments */}
        <lineBasicMaterial color={glitching ? new THREE.Color('#FF00FF') : new THREE.Color('#00FFFF')} />
      </lineSegments>
    </group>
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

// Ambient particles for atmosphere - even more optimized
function ParticleField() {
  const count = 80; // Reduced from 150
  const particleRef = useRef<THREE.Points>(null);
  
  // Generate random particle positions
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 100;
      positions[i3 + 1] = Math.random() * 40;
      positions[i3 + 2] = (Math.random() - 0.5) * 100;
    }
    return positions;
  }, []);
  
  // Animate particles - batch updates for better performance
  useFrame(({ clock }) => {
    if (particleRef.current && Math.floor(clock.getElapsedTime() * 5) % 3 === 0) { // Even less frequent updates
      particleRef.current.rotation.y = clock.getElapsedTime() * 0.01;
      
      // Make particles gently float up - update all at once
      const positions = particleRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        positions[i3 + 1] += 0.05; // Fixed increment, no random for better performance
        
        if (positions[i3 + 1] > 40) {
          positions[i3 + 1] = 0;
        }
      }
      particleRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  return (
    <points ref={particleRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particlesPosition}
          itemSize={3}
          args={[particlesPosition, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.4} // Larger to compensate for fewer particles
        color="#00FFFF"
        transparent
        opacity={0.3}
        sizeAttenuation
      />
    </points>
  );
}

// Digital rain effect - further reduced
function DigitalRain() {
  const count = 40; // Reduced from 75
  const linesRef = useRef<THREE.Group>(null);
  
  // Generate random digital rain positions
  const rainLines = useMemo(() => 
    Array.from({ length: count }).map(() => ({
      startPosition: [
        (Math.random() - 0.5) * 100,
        20 + Math.random() * 20,
        (Math.random() - 0.5) * 100
      ] as [number, number, number],
      length: 1 + Math.random() * 3, // Shorter lines
      speed: 0.1 + Math.random() * 0.1, // More consistent speed
      color: '#00FFFF' // Single color for better batching
    }))
  , []);
  
  // Animate digital rain - batch updates
  useFrame(() => {
    if (linesRef.current && linesRef.current.children.length > 0) {
      linesRef.current.children.forEach((line, i) => {
        // Move line down
        line.position.y -= rainLines[i].speed;
        
        // Reset when it hits the ground
        if (line.position.y < -1) {
          line.position.set(
            rainLines[i].startPosition[0],
            rainLines[i].startPosition[1],
            rainLines[i].startPosition[2]
          );
        }
      });
    }
  });
  
  return (
    <group ref={linesRef}>
      {rainLines.map((line, i) => (
        <mesh key={i} position={line.startPosition}>
          <boxGeometry args={[0.05, line.length, 0.05]} />
          <meshBasicMaterial color={line.color} transparent opacity={0.5} />
        </mesh>
      ))}
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

// Flying vehicles (reduced count)
function FlyingVehicles() {
  const count = 5; // Reduced from 10
  const vehiclesRef = useRef<THREE.Group[]>([]);
  
  // Vehicle paths
  const vehiclePaths = useMemo(() => 
    Array.from({ length: count }).map(() => ({
      radius: 20 + Math.random() * 40,
      height: 10 + Math.random() * 25,
      speed: 0.1 + Math.random() * 0.3,
      angle: Math.random() * Math.PI * 2,
      direction: Math.random() > 0.5 ? 1 : -1
    }))
  , []);
  
  // Update vehicle positions
  useFrame(({ clock }) => {
    vehiclesRef.current.forEach((vehicle, i) => {
      if (!vehicle) return;
      
      const { radius, height, speed, angle, direction } = vehiclePaths[i];
      const t = clock.getElapsedTime();
      
      const currentAngle = angle + t * speed * direction;
      vehicle.position.x = Math.cos(currentAngle) * radius;
      vehicle.position.z = Math.sin(currentAngle) * radius;
      vehicle.position.y = height + Math.sin(t * 0.5) * 2;
      
      // Make vehicle face direction of movement
      vehicle.rotation.y = currentAngle + (direction > 0 ? Math.PI / 2 : -Math.PI / 2);
    });
  });
  
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <group 
          key={i} 
          ref={el => { 
            if (el) vehiclesRef.current[i] = el; 
          }}
          position={[
            Math.cos(vehiclePaths[i].angle) * vehiclePaths[i].radius,
            vehiclePaths[i].height,
            Math.sin(vehiclePaths[i].angle) * vehiclePaths[i].radius
          ]}
        >
          {/* Vehicle Body */}
          <mesh>
            <boxGeometry args={[1.5, 0.4, 0.7]} />
            <meshStandardMaterial color="#101010" metalness={0.8} roughness={0.2} />
          </mesh>
          
          {/* Glow */}
          <pointLight
            distance={10}
            intensity={1}
            color={Math.random() > 0.5 ? '#00FFFF' : '#FF00FF'}
          />
          
          {/* Thrust */}
          <mesh position={[0, 0, -1]}>
            <coneGeometry args={[0.2, 0.8, 8]} />
            <meshBasicMaterial color={Math.random() > 0.5 ? '#00FFFF' : '#FF00FF'} />
          </mesh>
        </group>
      ))}
    </>
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
          luminanceThreshold={0.4} // Higher threshold = even less bloom
          luminanceSmoothing={0.7}
          intensity={1.0} // Reduced intensity
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
          target={[-2.5, 8, 0]} // Look at the middle of buildings (above ground level)
          autoRotate={true}
          autoRotateSpeed={0.5} // Slower rotation for better viewing
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
        <Buildings count={40} newsArticles={newsArticles} />
        <ParticleField />
        
        {/* Conditionally render these effects based on detected device capability */}
        {highPerformanceDevice && (
          <>
            <DigitalRain />
            <FlyingVehicles />
            <LightningEffect />
          </>
        )}
        
        {/* Post-processing effects - minimal */}
        {postProcessingEffects()}
      </Canvas>
    </div>
  );
} 