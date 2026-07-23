import { useEffect, useRef } from 'react';
import { SCROLL_CONTAINER_ID } from '@modules/creator-hub-layout/CreatorHubLayoutInner';

const useScrollRef = () => {
  const scrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const scrollEle = document.getElementById(SCROLL_CONTAINER_ID);
    if (scrollEle) {
      scrollRef.current = scrollEle;
    }
  }, []);

  return { scrollRef: scrollRef.current };
};

export default useScrollRef;
