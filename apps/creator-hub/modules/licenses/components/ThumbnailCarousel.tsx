import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { Thumbnail2d, ThumbnailTypes, ReturnPolicy, AssetThumbnailSize } from '@rbx/thumbnails';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import AmDivider from '@modules/ip/license-manager/components/AmDivider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import LicenseCarouselArrowButton from './LicenseCarouselArrowButton';
import useThumbnailCarouselStyles from './ThumbnailCarousel.styles';

const maxInactivityTimer = 15000; // inactivity timer value in ms before carousel shows the next thumbnail

interface ThumbnailCarouselProps {
  assetIds: number[];
  name?: string;
}

const ThumbnailCarousel: React.FC<ThumbnailCarouselProps> = ({ assetIds, name }) => {
  const {
    classes: {
      emptyThumbnailPlaceholder,
      thumbnailContainer,
      primaryThumbnail,
      navigationButton,
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
  const translation = useTranslation();
  const { translate } = translation;
  const { tPendingTranslation } = useTranslationWrapper(translation);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  const showDots = assetIds.length > 1;
  const previousThumbnailLabel = tPendingTranslation(
    'Previous thumbnail',
    'ARIA label for the button that shows the previous listing thumbnail.',
    translationKey('Action.PreviousThumbnail', TranslationNamespace.Licenses),
  );
  const nextThumbnailLabel = tPendingTranslation(
    'Next thumbnail',
    'ARIA label for the button that shows the next listing thumbnail.',
    translationKey('Action.NextThumbnail', TranslationNamespace.Licenses),
  );
  const thumbnailPositionsLabel = tPendingTranslation(
    'Thumbnail positions',
    'ARIA label for the list of listing-thumbnail carousel positions.',
    translationKey('Label.ThumbnailPositions', TranslationNamespace.Licenses),
  );

  const handlePrevious = useCallback(() => {
    setActiveIndex((current) => (current === 0 ? assetIds.length - 1 : current - 1));
  }, [assetIds.length]);

  const handleNext = useCallback(() => {
    setActiveIndex((current) => (current === assetIds.length - 1 ? 0 : current + 1));
  }, [assetIds.length]);

  useEffect(() => {
    if (!showDots || isUserInteracting) {
      return;
    }

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
      <div className={emptyThumbnailPlaceholder}>
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
            data-testid={`thumbnail-${index}`}
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
        <div data-testid='left-button-wrapper' className={cx(navigationButton, leftButton)}>
          <LicenseCarouselArrowButton
            testId='left-button'
            direction='previous'
            onClick={handlePrevious}
            ariaLabel={previousThumbnailLabel}
            visible={isHovered}
          />
        </div>
      )}

      {showDots && (
        <div data-testid='right-button-wrapper' className={cx(navigationButton, rightButton)}>
          <LicenseCarouselArrowButton
            testId='right-button'
            direction='next'
            onClick={handleNext}
            ariaLabel={nextThumbnailLabel}
            visible={isHovered}
          />
        </div>
      )}

      {showDots && (
        <ul className={dotBar} aria-label={thumbnailPositionsLabel}>
          {assetIds.map((assetId, index) => (
            <li
              data-testid={`dot-${index}`}
              key={assetId}
              className={index === activeIndex ? activeDot : dot}
              aria-label={tPendingTranslation(
                'Thumbnail {position} of {count}',
                'ARIA label for a listing-thumbnail carousel position indicator.',
                translationKey('Label.ThumbnailPosition', TranslationNamespace.Licenses),
                {
                  position: String(index + 1),
                  count: String(assetIds.length),
                },
              )}
              aria-current={index === activeIndex ? 'true' : 'false'}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default ThumbnailCarousel;
