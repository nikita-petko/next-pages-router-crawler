import React, { useState, useEffect, useCallback } from 'react';
import { IconButton, ChevronLeftIcon, ChevronRightIcon } from '@rbx/ui';
import { Thumbnail2d, ThumbnailTypes, ReturnPolicy, AssetThumbnailSize } from '@rbx/thumbnails';
import AmDivider from '@modules/ip/license-manager/components/AmDivider';
import { useTranslation } from '@rbx/intl';

import useThumbnailCarouselStyles from './ThumbnailCarousel.styles';

const maxInactivityTimer = 15000; // inactivity timer value in ms before carousel shows the next thumbnail

interface ThumbnailCarouselProps {
  assetIds: number[];
  name?: string;
}

const ThumbnailCarousel: React.FC<ThumbnailCarouselProps> = ({ assetIds, name }) => {
  const {
    classes: {
      thumbnailContainer,
      primaryThumbnail,
      navigationButton,
      visibleButton,
      leftButton,
      rightButton,
      dotBar,
      dot,
      activeDot,
      slidesContainer,
      slide,
    },
    cx,
  } = useThumbnailCarouselStyles();
  const { translate } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  const showDots = assetIds.length > 1;

  const handlePrevious = useCallback(() => {
    setActiveIndex((current) => (current === 0 ? assetIds.length - 1 : current - 1));
  }, [assetIds.length]);

  const handleNext = useCallback(() => {
    setActiveIndex((current) => (current === assetIds.length - 1 ? 0 : current + 1));
  }, [assetIds.length]);

  useEffect(() => {
    if (!showDots || isUserInteracting) return;

    const timer = setInterval(() => {
      handleNext();
    }, maxInactivityTimer);

    // eslint-disable-next-line consistent-return -- auto-advance timer
    return () => {
      clearInterval(timer);
    };
  }, [showDots, isUserInteracting, handleNext]);

  const handleUserInteraction = useCallback(() => {
    setIsUserInteracting(true);
    setIsHovered(true);
  }, []);

  const handleUserInteractionEnd = useCallback(() => {
    setIsUserInteracting(false);
    setIsHovered(false);
  }, []);

  if (!assetIds || assetIds.length === 0) {
    // No thumbnail available so we need padding
    return (
      <div style={{ height: '80px' }}>
        <AmDivider hasBottomMargin />
      </div>
    );
  }

  return (
    <div
      className={thumbnailContainer}
      onMouseEnter={handleUserInteraction}
      onMouseLeave={handleUserInteractionEnd}
      onTouchStart={handleUserInteraction}
      onTouchEnd={handleUserInteractionEnd}>
      <div
        className={slidesContainer}
        style={{
          transform: `translateX(-${activeIndex * 100}%)`,
        }}>
        {assetIds.map((assetId, index) => (
          <div
            data-testId={`thumbnail-${index}`}
            key={assetId}
            className={slide}
            style={{
              left: `${index * 100}%`,
            }}>
            <Thumbnail2d
              targetId={assetId}
              type={ThumbnailTypes.assetThumbnail}
              alt={name ?? translate('Label.ListingThumbnail')}
              returnPolicy={ReturnPolicy.PlaceHolder}
              includeBackground={false}
              // eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
              size={AssetThumbnailSize._1320x440}
              containerClass={thumbnailContainer}
              imgClassName={primaryThumbnail}
            />
          </div>
        ))}
      </div>

      {showDots && (
        <IconButton
          data-testId='left-button'
          size='medium'
          color='secondary'
          className={cx(navigationButton, leftButton, isHovered ? visibleButton : '')}
          onClick={handlePrevious}
          aria-label='Previous thumbnail'>
          <ChevronLeftIcon />
        </IconButton>
      )}

      {showDots && (
        <IconButton
          data-testId='right-button'
          size='medium'
          color='secondary'
          className={cx(navigationButton, rightButton, isHovered ? visibleButton : '')}
          onClick={handleNext}
          aria-label='Next thumbnail'>
          <ChevronRightIcon />
        </IconButton>
      )}

      {showDots && (
        <div className={dotBar}>
          {assetIds.map((assetId, index) => (
            <div
              data-testId={`dot-${index}`}
              key={assetId}
              className={index === activeIndex ? activeDot : dot}
              role='listitem'
              aria-label={`Thumbnail ${index + 1} of ${assetIds.length}`}
              aria-current={index === activeIndex ? 'true' : 'false'}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ThumbnailCarousel;
