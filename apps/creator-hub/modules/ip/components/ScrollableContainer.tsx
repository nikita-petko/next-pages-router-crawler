import React, { useEffect, useState, useCallback } from 'react';

interface ScrollableContainerProps {
  children: React.ReactNode;
  shouldScroll: boolean;
  onScrollComplete: () => void;
  className?: string;
  itemsLength: number;
}

/**
 * A scrollable container that automatically scrolls to the bottom when shouldScroll is true
 */
const ScrollableContainer: React.FC<ScrollableContainerProps> = ({
  children,
  shouldScroll,
  onScrollComplete,
  className,
  itemsLength,
}) => {
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);

  const scrollRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      setScrollElement(node);
    }
  }, []);

  useEffect(() => {
    if (shouldScroll && scrollElement) {
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: 'smooth',
      });
      onScrollComplete();
    }
  }, [itemsLength, shouldScroll, onScrollComplete, scrollElement]);

  return (
    <div ref={scrollRef} className={className}>
      {children}
    </div>
  );
};

export default ScrollableContainer;
