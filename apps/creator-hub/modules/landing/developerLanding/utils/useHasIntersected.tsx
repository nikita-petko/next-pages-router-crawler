import React, { useEffect, useState } from 'react';

const useHasIntersected = (sectionRef: React.RefObject<HTMLElement | null>, threshold: number) => {
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    // Only fire if we haven't intersected yet
    if (sectionRef.current && hasIntersected === false) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!hasIntersected && entry.isIntersecting) {
            setHasIntersected(true);
          }
        },
        {
          root: null,
          rootMargin: '0px',
          threshold,
        },
      );
      observer.observe(sectionRef.current);
      return () => {
        observer.disconnect();
      };
    }
    return () => {};
  }, [sectionRef, threshold, hasIntersected]);

  return hasIntersected;
};

export default useHasIntersected;
