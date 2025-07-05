"use client";

import { useState, useEffect } from "react";

export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isUserAgentMobile = mobileRegex.test(userAgent);
      
      // También verificar el ancho de la ventana
      const isScreenSmall = window.innerWidth < 768;
      
      // Combinación de ambos factores
      const isMobileDevice = isUserAgentMobile || isScreenSmall;
      
      setIsMobile(isMobileDevice);
      setIsLoading(false);
    };

    // Verificar inmediatamente
    checkMobile();

    // Verificar cuando cambie el tamaño de la ventana
    const handleResize = () => {
      const isScreenSmall = window.innerWidth < 768;
      const userAgent = navigator.userAgent;
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isUserAgentMobile = mobileRegex.test(userAgent);
      
      setIsMobile(isUserAgentMobile || isScreenSmall);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return { isMobile, isLoading };
}

// Hook alternativo usando media queries
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [query]);

  return matches;
} 