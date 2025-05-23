'use client';

import { useEffect } from 'react';

interface ConsistentZoomLayoutProps {
  children: React.ReactNode;
}

export default function ConsistentZoomLayout({ children }: ConsistentZoomLayoutProps) {
  useEffect(() => {
    // Set the viewport meta tag to control zoom/scale
    let metaViewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;

    if (!metaViewport) {
      metaViewport = document.createElement('meta');
      metaViewport.setAttribute('name', 'viewport');
      document.head.appendChild(metaViewport);
    }

    // Always set these base values
    metaViewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no'
    );

    const handleZoomCompensation = () => {
      const devicePixelRatio = window.devicePixelRatio || 1;
      const screenWidth = window.screen.width;
      const windowWidth = window.innerWidth;

      // Calculate the system zoom level
      // For 125% system zoom: devicePixelRatio = 1.25, we want to scale by 0.8 (80%)
      // For 150% system zoom: devicePixelRatio = 1.5, we want to scale by 0.67 (67%)
      const systemZoomLevel = devicePixelRatio;

      // Determine if we need to apply compensation
      let shouldApplyCompensation = false;
      let compensationScale = 1;

      // Check if this is a high-DPI scenario that needs compensation
      if (systemZoomLevel > 1) {
        // Calculate the compensation scale to counteract system zoom
        compensationScale = 1 / systemZoomLevel;
        shouldApplyCompensation = true;
      }

      // Additional check for Windows systems with common zoom levels
      const isWindows = navigator.userAgent.includes('Windows');
      if (isWindows) {
        // Common Windows zoom levels and their compensation
        if (Math.abs(systemZoomLevel - 1.25) < 0.1) {
          // 125% system zoom - compensate with 80%
          compensationScale = 0.8;
          shouldApplyCompensation = true;
        } else if (Math.abs(systemZoomLevel - 1.5) < 0.1) {
          // 150% system zoom - compensate with 67%
          compensationScale = 0.67;
          shouldApplyCompensation = true;
        } else if (Math.abs(systemZoomLevel - 1.75) < 0.1) {
          // 175% system zoom - compensate with 57%
          compensationScale = 0.57;
          shouldApplyCompensation = true;
        } else if (Math.abs(systemZoomLevel - 2) < 0.1) {
          // 200% system zoom - compensate with 50%
          compensationScale = 0.5;
          shouldApplyCompensation = true;
        }
      }

      const rootElement = document.documentElement;
      const bodyElement = document.body;

      if (shouldApplyCompensation && compensationScale !== 1) {
        // Apply zoom compensation
        rootElement.style.transform = `scale(${compensationScale})`;
        rootElement.style.transformOrigin = 'top left';
        rootElement.style.width = `${100 / compensationScale}%`;
        rootElement.style.height = `${100 / compensationScale}%`;

        // Prevent scrollbars from appearing due to scaling
        bodyElement.style.overflow = 'hidden';

        // Add a container div to handle overflow properly
        const existingContainer = document.getElementById('zoom-compensation-container');
        if (!existingContainer) {
          const container = document.createElement('div');
          container.id = 'zoom-compensation-container';
          container.style.width = '100vw';
          container.style.height = '100vh';
          container.style.overflow = 'auto';
          container.style.position = 'relative';

          // Move all body children into the container
          while (bodyElement.firstChild && bodyElement.firstChild !== container) {
            container.appendChild(bodyElement.firstChild);
          }

          bodyElement.appendChild(container);
        }

        console.log(
          `Applied zoom compensation: ${Math.round(compensationScale * 100)}% (System zoom: ${Math.round(systemZoomLevel * 100)}%)`
        );
      } else {
        // Reset scaling
        rootElement.style.transform = '';
        rootElement.style.width = '';
        rootElement.style.height = '';
        bodyElement.style.overflow = '';

        // Remove zoom compensation container if it exists
        const container = document.getElementById('zoom-compensation-container');
        if (container) {
          // Move children back to body
          while (container.firstChild) {
            bodyElement.insertBefore(container.firstChild, container);
          }
          container.remove();
        }

        console.log('No zoom compensation needed');
      }
    };

    // Apply warm background color
    document.documentElement.style.backgroundColor = '#fff9f5';

    // Initial zoom compensation check
    handleZoomCompensation();

    // Add resize listener to handle window resizing
    const resizeHandler = () => {
      // Debounce the resize handler to avoid excessive calls
      clearTimeout(window.zoomCompensationTimeout);
      window.zoomCompensationTimeout = setTimeout(handleZoomCompensation, 100);
    };

    window.addEventListener('resize', resizeHandler);

    // Also listen for devicePixelRatio changes (rare but possible)
    const mediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    const handleDPRChange = () => {
      setTimeout(handleZoomCompensation, 100);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDPRChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleDPRChange);
    }

    // Cleanup function
    return () => {
      // Reset styles
      const rootElement = document.documentElement;
      const bodyElement = document.body;

      rootElement.style.backgroundColor = '';
      rootElement.style.transform = '';
      rootElement.style.width = '';
      rootElement.style.height = '';
      bodyElement.style.overflow = '';

      // Remove zoom compensation container
      const container = document.getElementById('zoom-compensation-container');
      if (container) {
        while (container.firstChild) {
          bodyElement.insertBefore(container.firstChild, container);
        }
        container.remove();
      }

      // Remove event listeners
      window.removeEventListener('resize', resizeHandler);

      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleDPRChange);
      } else {
        mediaQuery.removeListener(handleDPRChange);
      }

      // Clear timeout
      clearTimeout(window.zoomCompensationTimeout);
    };
  }, []);

  return <>{children}</>;
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    zoomCompensationTimeout: NodeJS.Timeout;
  }
}
