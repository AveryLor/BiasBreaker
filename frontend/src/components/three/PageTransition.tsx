'use client';

import { useState, useEffect, ReactNode, useCallback } from 'react';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState('fadeOut');
  const [transitioning, setTransitioning] = useState(false);
  
  // Change content when pathname changes
  useEffect(() => {
    if (pathname) {
      // Start transition
      setTransitioning(true);
      setTransitionStage('fadeOut');
      
      // Wait for exit animation
      const timeout = setTimeout(() => {
        // Update content
        setDisplayChildren(children);
        
        // Start entrance animation
        setTransitionStage('fadeIn');
        
        const entranceTimeout = setTimeout(() => {
          setTransitioning(false);
        }, 500);
        
        return () => clearTimeout(entranceTimeout);
      }, 500);
      
      return () => clearTimeout(timeout);
    }
  }, [pathname, children]);
  
  // Effects based on transition state
  const getTransitionStyles = useCallback(() => {
    if (!transitioning) {
      return { 
        transform: 'translateZ(0)', 
        opacity: 1 
      };
    }
    
    if (transitionStage === 'fadeOut') {
      return { 
        transform: 'translateZ(-100px) rotateX(10deg)', 
        opacity: 0.5 
      };
    }
    
    return { 
      transform: 'translateZ(0)', 
      opacity: 1 
    };
  }, [transitionStage, transitioning]);
  
  const transitionStyles = getTransitionStyles();
  
  return (
    <div
      className="min-h-screen"
      style={{
        perspective: '1200px',
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        style={{
          transition: 'all 0.5s cubic-bezier(0.65, 0, 0.35, 1)',
          ...transitionStyles,
        }}
      >
        {displayChildren}
        
        {/* Overlay for transition effect */}
        {transitioning && (
          <div
            className="fixed inset-0 bg-indigo-500 dark:bg-indigo-700 z-50 pointer-events-none"
            style={{
              opacity: transitionStage === 'fadeOut' ? 0 : 0,
              transition: 'opacity 0.5s cubic-bezier(0.65, 0, 0.35, 1)',
            }}
          />
        )}
      </div>
    </div>
  );
} 