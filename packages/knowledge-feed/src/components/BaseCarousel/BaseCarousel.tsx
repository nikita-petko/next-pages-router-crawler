import type { FunctionComponent } from 'react';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { device } from '@rbx/core';
import { debounce } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import { NavigateBeforeIcon, NavigateNextIcon, IconButton } from '@rbx/ui';
import useDeviceInfo from '../../hooks/useDeviceInfo';
import { calculateScrollByWidth } from '../../utilities/carouselUtils';
import useBaseCarouselStyles from './BaseCarousel.style';

const { Browser } = device;
const EMPTY_DATA: never[] = [];
const SSR_FALLBACK_CAROUSEL_WIDTH_PX = 900;
const PLACEHOLDER_CARD_COUNT = 7;

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
  const childrenArray = Array.from(children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  );
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
  data = EMPTY_DATA,
  loading,
  LoadingTileComponent,
  TileComponent,
  onClickNext,
  onClickPrevious,
  lastCard,
}: TBaseCarouselProps<T>) => {
  const { currentBrowser, isMobileDevice } = useDeviceInfo();
  const carouselRef = useRef<HTMLDivElement>(null);
  const hasMeasuredCarouselWidthRef = useRef(false);
  const [isHover, setIsHover] = useState<boolean>(false);
  // SSR-safe fallback through hydration; the first ResizeObserver notification replaces it immediately.
  const [carouselWidth, setCarouselWidth] = useState<number>(SSR_FALLBACK_CAROUSEL_WIDTH_PX);
  const [scrollLeft, setScrollLeft] = useState<number>(0);
  const [scrollWidth, setScrollWidth] = useState<number>(0);
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

  // NOTE(jcountryman, 06/15/23): Carousel Size Observer
  const [debouncedCalculateCarouselWidth, cancelCalculateCarouselWidth] = useMemo(
    () =>
      debounce((entries: ResizeObserverEntry[]) => {
        setCarouselWidth(entries[0].contentRect.width);
      }),
    [],
  );

  useEffect(() => {
    const handleResize = (entries: ResizeObserverEntry[]) => {
      if (!hasMeasuredCarouselWidthRef.current) {
        hasMeasuredCarouselWidthRef.current = true;
        setCarouselWidth(entries[0].contentRect.width);
        return;
      }
      debouncedCalculateCarouselWidth(entries);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    const currentCarouselElement = carouselRef?.current;
    if (currentCarouselElement) {
      resizeObserver.observe(currentCarouselElement);
    }
    return () => {
      if (currentCarouselElement) {
        resizeObserver.unobserve(currentCarouselElement);
      }
      cancelCalculateCarouselWidth();
    };
  }, [cancelCalculateCarouselWidth, debouncedCalculateCarouselWidth]);

  useEffect(() => {
    const currentCarouselElement = carouselRef?.current;
    const updateScrollPosition = () => {
      setScrollLeft(currentCarouselElement?.scrollLeft ?? 0);
      setScrollWidth(currentCarouselElement?.scrollWidth ?? 0);
    };
    if (!loading && currentCarouselElement) {
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
    return Array.from(
      { length: PLACEHOLDER_CARD_COUNT },
      // eslint-disable-next-line react/no-array-index-key
      (_, index) => <LoadingTileComponent key={index} />,
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
                  root: cx(iconButton, { [hidden]: !isHover }),
                }}
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                  if (onClickPrevious) {
                    onClickPrevious(event);
                  }
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
                disabled={isEndOfCarousel}
                classes={{
                  root: cx(iconButton, { [hidden]: !isHover }),
                }}
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                  if (onClickNext) {
                    onClickNext(event);
                  }
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
