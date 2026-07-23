import React, { FunctionComponent, useState, useEffect, useRef, useMemo } from 'react';
import { makeStyles, IconButton, NavigateBeforeIcon, NavigateNextIcon } from '@rbx/ui';
import { device, Platform } from '@rbx/core';
import { debounce } from '@modules/miscellaneous/common/utils';
import { calculateScrollByWidth } from '@modules/miscellaneous/common/utils/carouselUtils';

const { getCurrentPlatform } = device;

const useStyles = makeStyles<{ isStartOfCarousel: boolean }>()((theme, { isStartOfCarousel }) => ({
  wrapper: {
    position: 'relative',
  },
  carousel: {
    overflowX: 'scroll',
    display: 'flex',
    flexDirection: 'row',

    '&::-webkit-scrollbar': {
      display: 'none',
    },
    msOverflowStyle: 'none',
    scrollbarWidth: 'none',

    '& > *': {
      flexShrink: 0,
      flexGrow: 0,
    },
  },
  bumper: {
    display: 'flex',
    alignItems: 'center',
    zIndex: theme.zIndex.speedDial,
    position: 'absolute',
    height: '100%',
  },
  leftBumper: {
    top: 0,
    left: -24,
    pointerEvents: isStartOfCarousel ? 'none' : 'auto',
  },
  rightBumper: {
    top: 0,
    right: -24,
    pointerEvents: 'none',
  },
  hidden: {
    opacity: 0,
    pointerEvents: 'none',
    cursor: 'default',
  },
  bumperWrapper: {
    display: 'flex',
    height: '50%',
    justifyContent: 'center',
    pointerEvents: 'auto',
  },
  hiddenBumper: {
    pointerEvents: 'none',
  },
  iconButton: {
    opacity: 1,
    alignSelf: 'center',
  },
}));

function getScrollByWidth(
  { clientWidth, scrollLeft, children }: HTMLDivElement,
  direction: 'prev' | 'next',
): number {
  const childrenArray = Array.from(children) as HTMLElement[];
  return calculateScrollByWidth(
    {
      clientWidth,
      scrollLeft,
      childrenData: childrenArray.map(({ offsetLeft, offsetWidth }) => ({
        offsetLeft,
        offsetWidth,
      })),
    },
    direction,
  );
}

export type TCarouselProps = {
  onClickNext?: React.MouseEventHandler<HTMLButtonElement>;
  onClickPrevious?: React.MouseEventHandler<HTMLButtonElement>;
};

const Carousel: FunctionComponent<React.PropsWithChildren<TCarouselProps>> = ({
  children,
  onClickNext,
  onClickPrevious,
}) => {
  const currentPlatform = getCurrentPlatform();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isHover, setIsHover] = useState<boolean>(false);
  const [carouselWidth, setCarouselWidth] = useState<number>(window.innerWidth);
  const [scrollLeft, setScrollLeft] = useState<number>(carouselRef.current?.scrollLeft ?? 0);
  const [scrollWidth, setScrollWidth] = useState<number>(carouselRef.current?.scrollWidth ?? 0);

  const isStartOfCarousel = useMemo(() => scrollLeft === 0, [scrollLeft]);
  const isEndOfCarousel = useMemo(
    () => scrollLeft + carouselWidth >= scrollWidth,
    [scrollLeft, scrollWidth, carouselWidth],
  );
  const isMobile = useMemo(
    () => currentPlatform === Platform.iOS || currentPlatform === Platform.Android,
    [currentPlatform],
  );

  const {
    classes: {
      wrapper,
      carousel,
      bumper,
      leftBumper,
      rightBumper,
      hidden,
      bumperWrapper,
      iconButton,
      hiddenBumper,
    },
    cx,
  } = useStyles({ isStartOfCarousel });
  const [debouncedCalculateCarouselWidth] = debounce((entries: ResizeObserverEntry[]) => {
    setCarouselWidth(entries[0].target.clientWidth);
  });
  useEffect(() => {
    const currentCarouselElement = carouselRef?.current;

    function updateScrollPosition() {
      setScrollLeft(currentCarouselElement?.scrollLeft ?? 0);
      setScrollWidth(currentCarouselElement?.scrollWidth ?? 0);
    }

    if (currentCarouselElement) {
      updateScrollPosition();
      currentCarouselElement.addEventListener('scroll', updateScrollPosition);
    }

    return () => {
      if (currentCarouselElement) {
        currentCarouselElement.removeEventListener('scroll', updateScrollPosition);
      }
    };
  }, []);
  useEffect(() => {
    const resizeObserver = new ResizeObserver(debouncedCalculateCarouselWidth);
    const currentCarouselElement = carouselRef?.current;
    if (currentCarouselElement) {
      resizeObserver.observe(currentCarouselElement);
    }
    return () => {
      if (currentCarouselElement) {
        resizeObserver.unobserve(currentCarouselElement);
      }
    };
  }, [debouncedCalculateCarouselWidth]);

  return (
    <div
      className={wrapper}
      onMouseEnter={() => {
        setIsHover(true);
      }}
      onMouseLeave={() => {
        setIsHover(false);
      }}>
      <div ref={carouselRef} className={cx(carousel, 'gap-small medium:gap-xxlarge')}>
        {children}
      </div>
      {!isMobile && (
        <div
          className={cx(bumper, leftBumper, {
            [hidden]: isStartOfCarousel,
          })}>
          <div className={cx(bumperWrapper, { [hiddenBumper]: isStartOfCarousel })}>
            <IconButton
              classes={{
                root: cx(iconButton, { [hidden]: isHover === false }),
              }}
              onClick={(event) => {
                if (onClickPrevious) onClickPrevious(event);
                carouselRef.current?.scrollBy({
                  left: getScrollByWidth(carouselRef.current, 'prev'),
                  behavior: 'smooth',
                });
              }}
              color='onMediaLight'
              variant='contained'
              aria-label='previous'
              size='medium'>
              <NavigateBeforeIcon />
            </IconButton>
          </div>
        </div>
      )}
      {!isMobile && (
        <div
          className={cx(bumper, rightBumper, {
            [hidden]: isEndOfCarousel,
          })}>
          <div className={cx(bumperWrapper, { [hiddenBumper]: isEndOfCarousel })}>
            <IconButton
              disabled={isEndOfCarousel === true}
              classes={{
                root: cx(iconButton, { [hidden]: isHover === false }),
              }}
              onClick={(event) => {
                if (onClickNext) onClickNext(event);
                carouselRef.current?.scrollBy({
                  left: getScrollByWidth(carouselRef.current, 'next'),
                  behavior: 'smooth',
                });
              }}
              color='onMediaLight'
              variant='contained'
              aria-label='next'
              size='medium'>
              <NavigateNextIcon />
            </IconButton>
          </div>
        </div>
      )}
    </div>
  );
};
export default Carousel;
