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
function Buildings({ count = 50, newsArticles }: { count: number, newsArticles: NewsArticle[] }) {
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
  
  // Building properties
  const buildingData = useMemo(() => {
    const data = [];
    const gridSize = Math.ceil(Math.sqrt(count));
    const spacing = 4;
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
      
      // Should this building have a billboard?
      const hasBillboard = Math.random() > 0.2; // Increased probability for billboards (was 0.4)
      
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
        // Add a second billboard for tall buildings
        hasSecondBillboard: hasBillboard && height > 10 && Math.random() > 0.5,
        secondBillboardArticle: hasBillboard && height > 10 && Math.random() > 0.5 ? {
          id: i + count,
          title: fallbackTitles[Math.floor(Math.random() * fallbackTitles.length)],
          source: newsOutlets[Math.floor(Math.random() * newsOutlets.length)],
          category: fallbackCategories[Math.floor(Math.random() * fallbackCategories.length)]
        } : null,
      });
    }
    return data;
  }, [count, theme, newsArticles, newsOutlets, neonColors]);
  
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
      
      {/* Add billboards to some buildings */}
      {buildingData.filter(b => b.hasBillboard && b.billboardArticle).map((building, i) => {
        // Calculate a position on the building rather than just at the top
        // Some billboards on top, some on sides of buildings
        const isSideBillboard = Math.random() > 0.5;
        const position: [number, number, number] = isSideBillboard
          ? [
              // Position on the side of building with slight offset
              building.position[0] as number + ((building.scale[0] as number) * 0.5 + 0.2) * (Math.random() > 0.5 ? 1 : -1),
              (building.billboardHeight as number) * Math.random() * 0.7, // At random height on the building
              building.position[2] as number + ((building.scale[2] as number) * 0.5 + 0.2) * (Math.random() > 0.5 ? 1 : -1)
            ]
          : [
              // Position on top of building
              building.position[0] as number,
              (building.billboardHeight as number) + Math.random() * 0.5, // Slightly varied height
              building.position[2] as number
            ];
            
        // Calculate rotation - either facing outward from building or random for top billboards
        const rotation: [number, number, number] = isSideBillboard
          ? [
              0,
              Math.atan2(
                position[0] - (building.position[0] as number),
                position[2] - (building.position[2] as number)
              ),
              0
            ]
          : [0, building.billboardRotation as number, 0];
            
        return (
          <NewsBillboard 
            key={`billboard-${i}`}
            position={position}
            rotation={rotation}
            article={building.billboardArticle as NewsArticle}
            scale={1.5 + Math.random()}
          />
        );
      })}

      {/* Add second billboards to taller buildings */}
      {buildingData.filter(b => b.hasSecondBillboard && b.secondBillboardArticle).map((building, i) => {
        // Position on the opposite side from the main billboard
        const position: [number, number, number] = [
          building.position[0] as number + ((building.scale[0] as number) * 0.5 + 0.2) * (Math.random() > 0.5 ? 1 : -1),
          (building.billboardHeight as number) * 0.3, // Lower on the building
          building.position[2] as number + ((building.scale[2] as number) * 0.5 + 0.2) * (Math.random() > 0.5 ? 1 : -1)
        ];
            
        // Facing outward from building
        const rotation: [number, number, number] = [
          0,
          Math.atan2(
            position[0] - (building.position[0] as number),
            position[2] - (building.position[2] as number)
          ),
          0
        ];
            
        return (
          <NewsBillboard 
            key={`second-billboard-${i}`}
            position={position}
            rotation={rotation}
            article={building.secondBillboardArticle as NewsArticle}
            scale={1.3 + Math.random() * 0.3}
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
  
  // Pulse effect
  useFrame(({ clock }) => {
    if (lineRef.current) {
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      const pulse = Math.sin(clock.getElapsedTime() * 2) * 0.3 + 0.7;
      material.color.setRGB(
        color.r * pulse,
        color.g * pulse,
        color.b * pulse
      );
    }
  });
  
  return (
    <lineSegments
      ref={lineRef}
      position={position}
      rotation={rotation}
      scale={[scale[0] * 1.02, scale[1] * 1.02, scale[2] * 1.02]}
    >
      <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
      <lineBasicMaterial color={color} linewidth={2} />
    </lineSegments>
  );
}

// Animated news billboard with glitch effects
function NewsBillboard({ position, rotation, article, scale = 1 }: { 
  position: [number, number, number],
  rotation: [number, number, number],
  article: NewsArticle | null,
  scale?: number
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
  
  // Random glitch effect
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      // Randomly trigger glitch effect
      if (Math.random() > 0.7) {
        setGlitching(true);
        setTimeout(() => setGlitching(false), 300 + Math.random() * 200);
      }
    }, 3000 + Math.random() * 5000);
    
    return () => clearInterval(glitchInterval);
  }, []);
  
  // Create display texture
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return new THREE.CanvasTexture(canvas);
    
    // Create glowing billboard background - darker for cyberpunk
    const bgColor = '#050518';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some tech patterns - more pronounced for cyberpunk
    ctx.strokeStyle = glitching ? '#FF00FF' : '#00FFFF';
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
  
  // Typing animation effect
  useEffect(() => {
    const typingTimer = setInterval(() => {
      setVisibleChars(prev => {
        if (prev >= safeArticle.title.length) {
          // Completely displayed, pause for a bit then reset
          setTimeout(() => {
            setVisibleChars(0);
          }, 3000);
          return prev;
        }
        return prev + 1;
      });
    }, 80); // Faster typing for more dynamic feel
    
    return () => clearInterval(typingTimer);
  }, [safeArticle.title]);
  
  // Pulsating and hover effects
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime();
      
      // Apply subtle floating motion
      groupRef.current.position.y = position[1] + Math.sin(t * 0.5) * 0.1;
      
      // Apply glitch effect
      if (glitching) {
        groupRef.current.position.x = position[0] + (Math.random() - 0.5) * 0.1;
        groupRef.current.position.z = position[2] + (Math.random() - 0.5) * 0.1;
      } else {
        groupRef.current.position.x = position[0];
        groupRef.current.position.z = position[2];
      }
      
      // Grow slightly when hovered
      if (hovered) {
        groupRef.current.scale.lerp(new THREE.Vector3(scale * 1.1, scale * 1.1, scale * 1.1), 0.1);
      } else {
        groupRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
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
      {/* Billboard backing with slight depth */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[3, 1.5, 0.1]} />
        <meshStandardMaterial color="#000000" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Main billboard display */}
      <mesh>
        <planeGeometry args={[3, 1.5]} />
        <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
      </mesh>
      
      {/* Add a thin neon frame */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(3.1, 1.6)]} />
        <lineBasicMaterial color={glitching ? new THREE.Color('#FF00FF') : new THREE.Color('#00FFFF')} linewidth={3} />
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

// Ambient particles for atmosphere
function ParticleField() {
  const count = 300;
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
  
  // Animate particles
  useFrame(({ clock }) => {
    if (particleRef.current) {
      particleRef.current.rotation.y = clock.getElapsedTime() * 0.01;
      
      // Make particles gently float up
      const positions = particleRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        positions[i3 + 1] += 0.01 + Math.random() * 0.01;
        
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
        size={0.2}
        color="#00FFFF"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

// Digital rain effect (falling code/data)
function DigitalRain() {
  const count = 150;
  const linesRef = useRef<THREE.Group>(null);
  
  // Generate random digital rain positions
  const rainLines = useMemo(() => 
    Array.from({ length: count }).map(() => ({
      startPosition: [
        (Math.random() - 0.5) * 100,
        20 + Math.random() * 20,
        (Math.random() - 0.5) * 100
      ] as [number, number, number],
      length: 1 + Math.random() * 5,
      speed: 0.05 + Math.random() * 0.2,
      color: Math.random() > 0.5 ? '#00FFFF' : '#FF00FF'
    }))
  , []);
  
  // Animate digital rain
  useFrame(() => {
    if (linesRef.current) {
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
          <meshBasicMaterial color={line.color} transparent opacity={0.7} />
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

// Flying drones
function FlyingVehicles() {
  const count = 10;
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

// Main component
export default function FuturisticCityscape({ newsArticles }: { newsArticles: NewsArticle[] }) {
  const { theme } = useTheme();
  
  // Post-processing effects
  const postProcessingEffects = () => {
    if (typeof window === 'undefined') return null;
    
    // Dynamically import the needed components to avoid SSR issues
    const { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } = require('@react-three/postprocessing');
    const { BlendFunction } = require('postprocessing');
    
    return (
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={1.5}
        />
        <ChromaticAberration
          offset={[0.002, 0.002]}
        />
        <Noise
          opacity={0.05}
          blendFunction={BlendFunction.OVERLAY}
        />
        <Vignette
          darkness={0.5}
          offset={0.5}
        />
      </EffectComposer>
    );
  };
  
  return (
    <div className="w-full h-[500px] relative">
      <Canvas
        shadows
        camera={{ position: [0, 15, 40], fov: 60 }}
      >
        {/* Background color */}
        <color attach="background" args={['#050518']} />
        
        {/* Atmospheric fog */}
        <fog attach="fog" args={['#090420', 10, 60]} />
        
        {/* Orbital camera controls */}
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          maxPolarAngle={Math.PI / 2 - 0.1}
          minDistance={10}
          maxDistance={60}
        />
        
        {/* Main lighting */}
        <ambientLight intensity={0.1} color="#2a265f" />
        
        {/* Slightly blue-tinted directional light */}
        <directionalLight
          position={[10, 20, 10]}
          intensity={0.2}
          color="#b8c9ff"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        
        {/* Atmospheric effects */}
        <ParticleField />
        <DigitalRain />
        <LightningEffect />
        
        {/* City elements */}
        <CyberpunkGround />
        <Buildings count={80} newsArticles={newsArticles} />
        <FlyingVehicles />
        
        {/* Post-processing effects - conditionally rendered to avoid SSR issues */}
        {postProcessingEffects()}
      </Canvas>
    </div>
  );
} 