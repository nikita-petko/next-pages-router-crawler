import type { CSSProperties, FunctionComponent, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { IconButton } from '@rbx/foundation-ui';
import { calculateScrollByWidth } from '@modules/miscellaneous/utils/carouselUtils';

export type ShowcaseContentCarouselItem = {
  id: string;
  content: ReactNode;
  width?: CSSProperties['width'];
};

type ShowcaseContentCarouselProps = {
  items: readonly ShowcaseContentCarouselItem[];
  previousAriaLabel: string;
  nextAriaLabel: string;
  onPreviousClick?: () => void;
  onNextClick?: () => void;
};

const DEFAULT_ITEM_WIDTH = 150;
const SCROLL_POSITION_TOLERANCE = 1;
const NAVIGATION_CONTROL_VISIBILITY_CLASSES =
  '[opacity:1] pointer-events-auto [@media(hover:hover)]:invisible [@media(hover:hover)]:[opacity:0] [@media(hover:hover)]:pointer-events-none [@media(hover:hover)]:group-hover:visible [@media(hover:hover)]:group-hover:[opacity:1] [@media(hover:hover)]:group-hover:pointer-events-auto [@media(hover:hover)]:group-focus-within:visible [@media(hover:hover)]:group-focus-within:[opacity:1] [@media(hover:hover)]:group-focus-within:pointer-events-auto';

const ShowcaseContentCarousel: FunctionComponent<ShowcaseContentCarouselProps> = ({
  items,
  previousAriaLabel,
  nextAriaLabel,
  onPreviousClick,
  onNextClick,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollPrevious, setCanScrollPrevious] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollControls = useCallback(() => {
    const track = trackRef.current;
    if (track == null) {
      return;
    }

    const maximumScrollLeft = track.scrollWidth - track.clientWidth;
    setCanScrollPrevious(track.scrollLeft > SCROLL_POSITION_TOLERANCE);
    setCanScrollNext(track.scrollLeft < maximumScrollLeft - SCROLL_POSITION_TOLERANCE);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (track == null) {
      return undefined;
    }

    updateScrollControls();
    track.addEventListener('scroll', updateScrollControls);
    const resizeObserver = new ResizeObserver(updateScrollControls);
    resizeObserver.observe(track);

    return () => {
      track.removeEventListener('scroll', updateScrollControls);
      resizeObserver.disconnect();
    };
  }, [items, updateScrollControls]);

  const scroll = useCallback((direction: 'prev' | 'next') => {
    const track = trackRef.current;
    if (track == null) {
      return;
    }

    const childrenData = Array.from(track.children, (child) => ({
      offsetLeft: child instanceof HTMLElement ? child.offsetLeft : 0,
      offsetWidth: child instanceof HTMLElement ? child.offsetWidth : 0,
    }));

    track.scrollBy({
      left: calculateScrollByWidth(
        {
          clientWidth: track.clientWidth,
          scrollLeft: track.scrollLeft,
          childrenData,
        },
        direction,
      ),
      behavior: 'smooth',
    });
  }, []);
  const handlePreviousClick = useCallback(() => {
    onPreviousClick?.();
    scroll('prev');
  }, [onPreviousClick, scroll]);
  const handleNextClick = useCallback(() => {
    onNextClick?.();
    scroll('next');
  }, [onNextClick, scroll]);

  return (
    <div className='group relative min-width-0 width-full'>
      <div
        ref={trackRef}
        data-testid='showcase-content-carousel-track'
        className='flex gap-medium min-width-0 width-full [overflow-x:auto] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
        {items.map((item) => (
          <div
            key={item.id}
            className='shrink-0'
            style={{ width: item.width ?? DEFAULT_ITEM_WIDTH }}>
            {item.content}
          </div>
        ))}
      </div>

      {canScrollPrevious && (
        <IconButton
          icon='icon-filled-chevron-large-left'
          ariaLabel={previousAriaLabel}
          variant='OverMedia'
          size='Small'
          iconColor='Inverse'
          isCircular
          className={`!absolute [left:6px] [top:50%] [transform:translateY(-50%)] [z-index:10] !bg-action-over-media transition-opacity ${NAVIGATION_CONTROL_VISIBILITY_CLASSES}`}
          onClick={handlePreviousClick}
        />
      )}
      {canScrollNext && (
        <IconButton
          icon='icon-filled-chevron-large-right'
          ariaLabel={nextAriaLabel}
          variant='OverMedia'
          size='Small'
          iconColor='Inverse'
          isCircular
          className={`!absolute [right:6px] [top:50%] [transform:translateY(-50%)] [z-index:10] !bg-action-over-media transition-opacity ${NAVIGATION_CONTROL_VISIBILITY_CLASSES}`}
          onClick={handleNextClick}
        />
      )}
    </div>
  );
};

export default ShowcaseContentCarousel;
