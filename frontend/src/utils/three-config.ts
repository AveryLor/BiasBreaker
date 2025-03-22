import * as THREE from 'three';

/**
 * Collection of utility functions and configurations for Three.js components
 */

// Easing Functions
export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const easeOutQuint = (t: number): number => {
  return 1 - Math.pow(1 - t, 5);
};

export const easeInQuint = (t: number): number => {
  return t * t * t * t * t;
};

// Helper to generate a random number within a range
export const randomRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

// Color palette for 3D elements
export const colorPalette = {
  primary: '#6366F1', // Indigo
  secondary: '#8B5CF6', // Violet
  accent: '#EC4899', // Pink
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#1E293B',
  },
  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F8FAFC',
  },
};

// Comprehensive particle system configuration
export const particleConfig = {
  // Basic configuration
  count: 1000,
  size: 0.02,
  maxSpeed: 0.05,
  
  // Connection settings
  connectionDistance: 1.5,
  connectionOpacity: 0.15,
  showConnections: true,
  
  // Advanced settings
  maxDistance: 40,
  spacing: 3,
  particleColor: '#4F46E5', // Indigo
  speedFactor: 0.2,
};

// Animation timing constants
export const animationTiming = {
  transitionDuration: 1000, // ms
  hoverTransitionDuration: 300, // ms
  carouselAutoRotateInterval: 5000, // ms
  loadingAnimationDuration: 2000, // ms
};

// Common materials
export const particleMaterial = new THREE.MeshBasicMaterial({
  color: new THREE.Color(particleConfig.particleColor),
  transparent: true,
  opacity: 0.7,
});

// Helper to generate random positions within bounds
export const randomPosition = (scale: number = 10): [number, number, number] => {
  return [
    (Math.random() - 0.5) * scale,
    (Math.random() - 0.5) * scale,
    (Math.random() - 0.5) * scale,
  ];
};

// Helper for calculating distance between two points in 3D space
export const distance = (p1: THREE.Vector3, p2: THREE.Vector3): number => {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) +
    Math.pow(p1.y - p2.y, 2) +
    Math.pow(p1.z - p2.z, 2)
  );
};

// Global camera settings
export const cameraSettings = {
  fov: 75,
  near: 0.1,
  far: 1000,
  position: [0, 0, 5] as [number, number, number],
  intensity: 1,
};

// Lighting presets
export const lightPresets = {
  soft: {
    ambientIntensity: 0.5,
    ambientColor: '#ffffff',
    directionalIntensity: 0.8,
    directionalColor: '#ffffff',
    directionalPosition: [10, 10, 10] as [number, number, number],
  },
  dramatic: {
    ambientIntensity: 0.2,
    ambientColor: '#0033ff',
    directionalIntensity: 1.2,
    directionalColor: '#ff3300',
    directionalPosition: [5, 10, 7] as [number, number, number],
  },
}; 