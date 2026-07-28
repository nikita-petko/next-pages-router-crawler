import type { FunctionComponent } from 'react';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { device } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import { NavigateBeforeIcon, NavigateNextIcon, IconButton } from '@rbx/ui';
import useDeviceInfo from '../../hooks/useDeviceInfo';
import { calculateScrollByWidth } from '../../utilities/carouselUtils';
import debounce from '../../utilities/debounce';
import useBaseCarouselStyles from './BaseCarousel.style';

const { Browser } = device;

export enum ECarouselEvent {
  ClickCarouselLeft = 'clickCarouselLeft',
  ClickCarouselRight = 'clickCarouselRight',
}

export type TBaseCarouselProps<T extends { id: string | number }> = {
  data?: T[];
  loading: boolean;
  LoadingTileComponent: FunctionComponent<React.PropsWithChildren>;
  TileComponent: FunctionComponent<React.PropsWithChildren<{ data: T; tilePosition: number }>>;
  onClickNext?: React.MouseEventHandler<HTMLButtonElement>;
  onClickPrevious?: React.MouseEventHandler<HTMLButtonElement>;
  lastCard?: React.ReactNode;
};

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

export const BaseCarousel = <T extends { id: string | number }>({
  data = [],
  loading,
  LoadingTileComponent,
  TileComponent,
  onClickNext,
  onClickPrevious,
  lastCard,
}: TBaseCarouselProps<T>) => {
  const { currentBrowser, isMobileDevice } = useDeviceInfo();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isHover, setIsHover] = useState<boolean>(false);
  const [carouselWidth, setCarouselWidth] = useState<number>(900);
  const [scrollLeft, setScrollLeft] = useState<number>(carouselRef.current?.scrollLeft ?? 0);
  const [scrollWidth, setScrollWidth] = useState<number>(carouselRef.current?.scrollWidth ?? 0);
  const isStartOfCarousel = useMemo(() => scrollLeft === 0, [scrollLeft]);
  const isEndOfCarousel = useMemo(() => {
    return scrollLeft + carouselWidth >= scrollWidth;
  }, [scrollLeft, scrollWidth, carouselWidth]);

  const { translate } = useTranslation();

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
  } = useBaseCarouselStyles({ isStartOfCarousel });

  // NOTE(jcountryman, 06/15/23): Responsiveness resizing logic
  useEffect(() => {
    if (carouselRef.current?.scrollTo) {
      carouselRef.current?.scrollTo({
        left: 0,
        behavior: currentBrowser === Browser.Safari ? undefined : 'smooth',
      });
    }
  }, [currentBrowser]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCarouselWidth(window.innerWidth);
    }
  }, []);

  // NOTE(jcountryman, 06/15/23): Carousel Size Observer
  const [debouncedCalculateCarouselWidth] = debounce((entries: ResizeObserverEntry[]) => {
    setCarouselWidth(entries[0].contentRect.width);
  });

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

  useEffect(() => {
    const currentCarouselElement = carouselRef?.current;
    const updateScrollPosition = () => {
      setScrollLeft(currentCarouselElement?.scrollLeft ?? 0);
      setScrollWidth(currentCarouselElement?.scrollWidth ?? 0);
    };
    if (loading === false && currentCarouselElement) {
      updateScrollPosition();
      currentCarouselElement.addEventListener('scroll', updateScrollPosition);
    }
    return () => {
      if (currentCarouselElement) {
        currentCarouselElement.removeEventListener('scroll', updateScrollPosition);
      }
    };
  }, [loading]);

  const placeholderCards = useMemo(() => {
    return (
      new Array(7) // Default  7 cards on initial screen load
        .fill('')
        // eslint-disable-next-line react/no-array-index-key
        .map((_, index) => <LoadingTileComponent key={index} />)
    );
  }, [LoadingTileComponent]);

  return (
    <div
      onMouseEnter={() => {
        setIsHover(true);
      }}
      onMouseLeave={() => {
        setIsHover(false);
      }}
      className={wrapper}>
      <div
        ref={carouselRef}
        className={carousel}
        aria-roledescription={translate('Label.Listbox')}
        aria-label={translate('Label.FeedItems')}>
        {loading
          ? placeholderCards
          : data.map((tile, tilePosition) => (
              <TileComponent key={tile.id} data={tile} tilePosition={tilePosition} />
            ))}
        {lastCard}
      </div>
      {!isMobileDevice && (
        <>
          <div
            className={cx(bumper, leftBumper, {
              [hidden]: isStartOfCarousel,
            })}>
            <div className={cx(bumperWrapper, { [hiddenBumper]: isStartOfCarousel })}>
              <IconButton
                classes={{
                  root: cx(iconButton, { [hidden]: isHover === false }),
                }}
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                  if (onClickPrevious) onClickPrevious(event);
                  carouselRef.current?.scrollBy({
                    left: getScrollByWidth(carouselRef.current, 'prev'),
                    behavior: 'smooth',
                  });
                }}
                aria-roledescription={translate('Label.Button')}
                aria-label={translate('Label.Previous')}
                color='onMediaLight'
                variant='contained'
                size='medium'>
                <NavigateBeforeIcon />
              </IconButton>
            </div>
          </div>
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
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                  if (onClickNext) onClickNext(event);
                  carouselRef.current?.scrollBy({
                    left: getScrollByWidth(carouselRef.current, 'next'),
                    behavior: currentBrowser === Browser.Safari ? undefined : 'smooth',
                  });
                }}
                aria-roledescription={translate('Label.Button')}
                aria-label={translate('Label.Next')}
                color='onMediaLight'
                variant='contained'
                size='medium'>
                <NavigateNextIcon />
              </IconButton>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default BaseCarousel;
