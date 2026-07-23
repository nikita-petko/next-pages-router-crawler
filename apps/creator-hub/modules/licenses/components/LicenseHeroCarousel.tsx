import type { MouseEvent, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { clsx as cx } from '@rbx/foundation-ui';
import {
  AssetThumbnailSize,
  ReturnPolicy,
  ThumbnailClient,
  ThumbnailFormat,
  ThumbnailTypes,
} from '@rbx/thumbnails';
import LicenseCarouselArrowButton from './LicenseCarouselArrowButton';

export type LicenseHeroCarouselSlide = {
  id: string;
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  thumbnailAssetId?: number | null;
  imageAlt?: string;
  titleHref?: string;
  mediaHref?: string;
  mediaAriaLabel?: string;
  onTitleClick?: () => void;
  onMediaClick?: () => void;
  testId?: string;
};

export type LicenseHeroCarouselNavigationSource =
  | 'auto'
  | 'next_control'
  | 'previous_control'
  | 'position_control';

type LicenseHeroCarouselProps = {
  slides: LicenseHeroCarouselSlide[];
  activeIndex: number;
  onSelectIndex: (index: number, source: LicenseHeroCarouselNavigationSource) => void;
  previousAriaLabel: string;
  nextAriaLabel: string;
  getPositionAriaLabel: (position: number, count: number) => string;
  testId?: string;
  previousButtonTestId?: string;
  nextButtonTestId?: string;
  getDotTestId?: (index: number) => string;
  className?: string;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  autoAdvanceIntervalMs?: number;
  preservePeekSpacing?: boolean;
};

type RenderedSlidePosition = 'previous' | 'active' | 'next';

type RenderedSlide = {
  key: string;
  slide: LicenseHeroCarouselSlide;
  position: RenderedSlidePosition;
};

// eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
const HERO_THUMBNAIL_SIZE = AssetThumbnailSize._768x432;

const carouselClasses = {
  root: 'width-full',
  rail: 'relative height-[336px] min-height-[336px] [overflow:hidden] max-[720px]:[height:auto] max-[720px]:[min-height:0] max-[720px]:[overflow:visible]',
  railPeek:
    '[--license-hero-side-space:46px] [--license-hero-card-width:calc(100%_-_92px)] [--license-hero-gap:8px] max-[720px]:[--license-hero-side-space:32px] max-[720px]:[--license-hero-card-width:calc(100%_-_64px)] max-[720px]:[--license-hero-gap:8px]',
  railFull:
    '[--license-hero-side-space:0px] [--license-hero-card-width:100%] [--license-hero-gap:16px]',
  slideLayer:
    'absolute [inset:0] max-[720px]:relative max-[720px]:[height:auto] max-[720px]:[aspect-ratio:12/7]',
  slide:
    'absolute [top:0] [bottom:0] width-[var(--license-hero-card-width)] [transition-property:left] [transition-duration:300ms] [transition-timing-function:var(--ease-standard-out)]',
  card: 'grid [overflow:hidden] radius-large stroke-standard stroke-default bg-surface-100 [grid-template-columns:minmax(320px,1fr)_minmax(0,min(571px,48%))]',
  activeCard:
    '[z-index:1] height-[336px] min-height-[336px] max-[720px]:absolute max-[720px]:[top:0] max-[720px]:[bottom:0] max-[720px]:height-full max-[720px]:[min-height:0] max-[720px]:[overflow:visible] max-[720px]:[border:0] max-[720px]:[background:transparent] max-[720px]:[grid-template-columns:1fr]',
  inactiveCard:
    'max-[720px]:block max-[720px]:[top:0] max-[720px]:[bottom:0] max-[720px]:height-full max-[720px]:[overflow:visible] max-[720px]:[border:0] max-[720px]:radius-none max-[720px]:[background:transparent]',
  inactiveContent: 'height-full bg-surface-100 max-[720px]:hidden',
  desktopContent: 'max-[720px]:hidden',
  mobileContent: 'hidden max-[720px]:block',
  content:
    'relative [z-index:2] flex min-width-0 flex-col justify-center [padding:clamp(24px,4vw,40px)] max-[720px]:justify-start max-[720px]:[padding:8px_var(--license-hero-side-space)_24px]',
  contentInner: 'width-full',
  eyebrow:
    'margin-none content-emphasis [font-size:clamp(16px,2.1vw,20px)] [font-weight:700] [line-height:clamp(24px,2.6vw,28px)] max-[720px]:[font-size:18px] max-[720px]:[line-height:24px]',
  title:
    'margin-none content-emphasis [font-size:clamp(30px,4vw,40px)] [font-weight:700] [letter-spacing:-0.01em] [line-height:clamp(36px,4.8vw,48px)] max-[720px]:[font-size:24px] max-[720px]:[line-height:30px]',
  titleWithEyebrow: '[margin-top:var(--size-100)]',
  titleLink:
    'block [margin-top:var(--size-100)] content-emphasis [text-decoration:none] hover:[text-decoration:none]',
  description:
    '[display:-webkit-box] margin-bottom-none [margin-top:12px] [overflow:hidden] content-emphasis [font-size:16px] [font-weight:600] [line-height:20px] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] max-[720px]:[font-size:16px] max-[720px]:[line-height:20px]',
  action: '[width:fit-content] [max-width:100%] [padding-top:24px] max-[720px]:[padding-top:20px]',
  mediaFrame:
    'relative height-full min-width-0 max-[720px]:height-full max-[720px]:[overflow:visible]',
  inactiveMediaFrame: 'max-[720px]:height-full max-[720px]:width-full',
  mediaLink:
    'block height-full min-width-0 [color:inherit] [text-decoration:none] hover:[text-decoration:none] max-[720px]:height-full',
  inactiveMediaLink: 'max-[720px]:height-full max-[720px]:width-full',
  media:
    'relative [z-index:0] height-full min-width-0 min-height-[180px] [overflow:hidden] bg-surface-200 max-[720px]:height-full max-[720px]:[min-height:0] max-[720px]:stroke-standard max-[720px]:stroke-default max-[720px]:radius-large',
  inactiveMedia: 'max-[720px]:height-full max-[720px]:width-full',
  image: 'absolute [inset:0] width-full height-full [object-fit:cover] [object-position:center]',
  control:
    '!absolute [top:50%] [z-index:10] flex items-center justify-center radius-circle cursor-pointer [transform:translateY(-50%)]',
  desktopControl: 'max-[720px]:hidden',
  previousControl: '[left:calc(var(--license-hero-side-space)_-_20px)]',
  nextControl:
    '[left:calc(var(--license-hero-side-space)_+_var(--license-hero-card-width)_-_12px)]',
  mobileControl: 'hidden max-[720px]:flex',
  mobilePreviousControl: 'max-[720px]:[left:-16px] max-[720px]:[right:auto]',
  mobileNextControl: 'max-[720px]:[left:calc(100%_-_16px)] max-[720px]:[right:auto]',
  dots: 'flex height-[28px] items-center justify-center gap-xsmall padding-none margin-none bg-surface-0 [list-style:none]',
  dot: 'block width-[8px] height-[8px] padding-none [border:0] radius-circle [background-color:var(--color-content-emphasis)] cursor-pointer [transition:all_var(--time-200)_var(--ease-standard-out)]',
  dotActive: '[opacity:1]',
  dotInactive: '[opacity:0.22]',
};

const slidePositionClassByPosition: Record<RenderedSlidePosition, string> = {
  previous:
    '[left:calc(var(--license-hero-side-space)_-_(var(--license-hero-card-width)_+_var(--license-hero-gap)))]',
  active: '[left:var(--license-hero-side-space)]',
  next: '[left:calc(var(--license-hero-side-space)_+_(var(--license-hero-card-width)_+_var(--license-hero-gap)))]',
};

function normalizeIndex(index: number, count: number): number {
  return ((index % count) + count) % count;
}

function getRenderedSlideKey(slide: LicenseHeroCarouselSlide, position: RenderedSlidePosition) {
  return `${slide.id}-${position}`;
}

function useThumbnailUrls(slides: LicenseHeroCarouselSlide[]): Record<number, string> {
  const [thumbnailUrlsByAssetId, setThumbnailUrlsByAssetId] = useState<Record<number, string>>({});

  const assetIds = useMemo(
    () => [
      ...new Set(
        slides
          .map((slide) => slide.thumbnailAssetId)
          .filter((assetId): assetId is number => assetId != null),
      ),
    ],
    [slides],
  );

  useEffect(() => {
    let isCancelled = false;

    const loadThumbnailUrls = async () => {
      const thumbnailResults = await Promise.all(
        assetIds.map(async (assetId) => {
          try {
            const { imageUrl } = await ThumbnailClient.getThumbnailImage(
              ThumbnailTypes.assetThumbnail,
              assetId,
              ReturnPolicy.PlaceHolder,
              ThumbnailFormat.png,
              HERO_THUMBNAIL_SIZE,
            );
            return [assetId, imageUrl ?? ''] as const;
          } catch {
            return [assetId, ''] as const;
          }
        }),
      );

      if (!isCancelled) {
        setThumbnailUrlsByAssetId(Object.fromEntries(thumbnailResults));
      }
    };

    if (assetIds.length > 0) {
      void loadThumbnailUrls();
    }

    return () => {
      isCancelled = true;
    };
  }, [assetIds]);

  return thumbnailUrlsByAssetId;
}

function SlideMedia({
  slide,
  thumbnailUrl,
  isActive,
  mobileControls,
}: {
  slide: LicenseHeroCarouselSlide;
  thumbnailUrl: string;
  isActive: boolean;
  mobileControls?: ReactNode;
}) {
  const mediaContent = (
    <div className={cx(carouselClasses.media, !isActive ? carouselClasses.inactiveMedia : '')}>
      {thumbnailUrl !== '' ? (
        <img src={thumbnailUrl} alt={slide.imageAlt ?? ''} className={carouselClasses.image} />
      ) : null}
    </div>
  );

  const media = slide.mediaHref ? (
    <Link
      href={slide.mediaHref}
      className={cx(carouselClasses.mediaLink, !isActive ? carouselClasses.inactiveMediaLink : '')}
      aria-label={slide.mediaAriaLabel}
      onClick={slide.onMediaClick}>
      {mediaContent}
    </Link>
  ) : (
    mediaContent
  );

  return (
    <div
      className={cx(
        carouselClasses.mediaFrame,
        !isActive ? carouselClasses.inactiveMediaFrame : '',
      )}>
      {media}
      {mobileControls}
    </div>
  );
}

function SlideContent({
  slide,
  className,
}: {
  slide: LicenseHeroCarouselSlide;
  className?: string;
}) {
  return (
    <div className={cx(carouselClasses.content, className)}>
      <div className={carouselClasses.contentInner}>
        {slide.eyebrow ? <div className={carouselClasses.eyebrow}>{slide.eyebrow}</div> : null}
        {slide.titleHref ? (
          <Link
            href={slide.titleHref}
            className={carouselClasses.titleLink}
            onClick={slide.onTitleClick}>
            <h2 className={carouselClasses.title}>{slide.title}</h2>
          </Link>
        ) : (
          <h2
            className={cx(
              carouselClasses.title,
              slide.eyebrow ? carouselClasses.titleWithEyebrow : '',
            )}>
            {slide.title}
          </h2>
        )}
      </div>
      {slide.description ? (
        <p className={carouselClasses.description}>{slide.description}</p>
      ) : null}
      {slide.action ? <div className={carouselClasses.action}>{slide.action}</div> : null}
    </div>
  );
}

function LicenseHeroCarousel({
  slides,
  activeIndex,
  onSelectIndex,
  previousAriaLabel,
  nextAriaLabel,
  getPositionAriaLabel,
  testId,
  previousButtonTestId = 'license-hero-carousel-previous',
  nextButtonTestId = 'license-hero-carousel-next',
  getDotTestId,
  className,
  onInteractionStart,
  onInteractionEnd,
  autoAdvanceIntervalMs,
  preservePeekSpacing = false,
}: LicenseHeroCarouselProps) {
  const [isInteracting, setIsInteracting] = useState(false);
  const thumbnailUrlsByAssetId = useThumbnailUrls(slides);
  const slideCount = slides.length;
  const hasSlides = slideCount > 0;
  const normalizedActiveIndex = hasSlides ? normalizeIndex(activeIndex, slideCount) : 0;
  const canNavigate = slideCount > 1;
  const shouldUsePeekLayout = canNavigate || preservePeekSpacing;

  const renderedSlides = useMemo<RenderedSlide[]>(() => {
    if (!hasSlides) {
      return [];
    }

    const activeSlide = slides[normalizedActiveIndex];

    if (!canNavigate) {
      return [{ key: activeSlide.id, slide: activeSlide, position: 'active' }];
    }

    const previousSlide = slides[normalizeIndex(normalizedActiveIndex - 1, slideCount)];
    const nextSlide = slides[normalizeIndex(normalizedActiveIndex + 1, slideCount)];
    const hasDuplicatePeekSlide = previousSlide.id === nextSlide.id;

    return [
      {
        key: hasDuplicatePeekSlide
          ? getRenderedSlideKey(previousSlide, 'previous')
          : previousSlide.id,
        slide: previousSlide,
        position: 'previous',
      },
      { key: activeSlide.id, slide: activeSlide, position: 'active' },
      {
        key: hasDuplicatePeekSlide ? getRenderedSlideKey(nextSlide, 'next') : nextSlide.id,
        slide: nextSlide,
        position: 'next',
      },
    ];
  }, [canNavigate, hasSlides, normalizedActiveIndex, slideCount, slides]);

  const handleInteractionStart = useCallback(() => {
    setIsInteracting(true);
    onInteractionStart?.();
  }, [onInteractionStart]);

  const handleInteractionEnd = useCallback(() => {
    setIsInteracting(false);
    onInteractionEnd?.();
  }, [onInteractionEnd]);

  const handlePrevious = useCallback(() => {
    onSelectIndex(normalizedActiveIndex - 1, 'previous_control');
  }, [normalizedActiveIndex, onSelectIndex]);

  const handleNext = useCallback(() => {
    onSelectIndex(normalizedActiveIndex + 1, 'next_control');
  }, [normalizedActiveIndex, onSelectIndex]);

  const handleDotClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const index = Number(event.currentTarget.dataset.index);
      onSelectIndex(index, 'position_control');
    },
    [onSelectIndex],
  );

  useEffect(() => {
    if (!canNavigate || isInteracting || autoAdvanceIntervalMs == null) {
      return;
    }

    const timer = window.setTimeout(() => {
      onSelectIndex(normalizedActiveIndex + 1, 'auto');
    }, autoAdvanceIntervalMs);

    // eslint-disable-next-line consistent-return -- auto-advance timer cleanup
    return () => {
      window.clearTimeout(timer);
    };
  }, [autoAdvanceIntervalMs, canNavigate, isInteracting, normalizedActiveIndex, onSelectIndex]);

  if (!hasSlides) {
    return null;
  }

  const activeSlide = slides[normalizedActiveIndex];

  return (
    <section className={cx(carouselClasses.root, className)} data-testid={testId}>
      <div
        className={cx(
          carouselClasses.rail,
          shouldUsePeekLayout ? carouselClasses.railPeek : carouselClasses.railFull,
        )}
        onMouseEnter={handleInteractionStart}
        onMouseLeave={handleInteractionEnd}
        onTouchStart={handleInteractionStart}
        onTouchEnd={handleInteractionEnd}>
        <SlideContent slide={activeSlide} className={carouselClasses.mobileContent} />
        <div className={carouselClasses.slideLayer}>
          {renderedSlides.map(({ key, slide, position }) => {
            const thumbnailUrl =
              slide.thumbnailAssetId != null ? thumbnailUrlsByAssetId[slide.thumbnailAssetId] : '';
            const isActiveSlide = position === 'active';

            return (
              <article
                key={key}
                className={cx(
                  carouselClasses.card,
                  isActiveSlide ? carouselClasses.activeCard : carouselClasses.inactiveCard,
                  carouselClasses.slide,
                  slidePositionClassByPosition[position],
                )}
                data-testid={position === 'previous' ? undefined : slide.testId}>
                {isActiveSlide ? (
                  <SlideContent slide={slide} className={carouselClasses.desktopContent} />
                ) : null}
                {!isActiveSlide ? <div className={carouselClasses.inactiveContent} /> : null}
                <SlideMedia
                  slide={isActiveSlide ? slide : { ...slide, mediaHref: undefined }}
                  thumbnailUrl={thumbnailUrl}
                  isActive={isActiveSlide}
                  mobileControls={
                    isActiveSlide && canNavigate ? (
                      <>
                        <LicenseCarouselArrowButton
                          direction='previous'
                          ariaLabel={previousAriaLabel}
                          onClick={handlePrevious}
                          visible
                          className={cx(
                            carouselClasses.control,
                            carouselClasses.mobileControl,
                            carouselClasses.mobilePreviousControl,
                          )}
                        />
                        <LicenseCarouselArrowButton
                          direction='next'
                          ariaLabel={nextAriaLabel}
                          onClick={handleNext}
                          visible
                          className={cx(
                            carouselClasses.control,
                            carouselClasses.mobileControl,
                            carouselClasses.mobileNextControl,
                          )}
                        />
                      </>
                    ) : undefined
                  }
                />
              </article>
            );
          })}
        </div>

        {canNavigate ? (
          <>
            <LicenseCarouselArrowButton
              direction='previous'
              ariaLabel={previousAriaLabel}
              onClick={handlePrevious}
              testId={previousButtonTestId}
              visible
              className={cx(
                carouselClasses.control,
                carouselClasses.desktopControl,
                carouselClasses.previousControl,
              )}
            />
            <LicenseCarouselArrowButton
              direction='next'
              ariaLabel={nextAriaLabel}
              onClick={handleNext}
              testId={nextButtonTestId}
              visible
              className={cx(
                carouselClasses.control,
                carouselClasses.desktopControl,
                carouselClasses.nextControl,
              )}
            />
          </>
        ) : null}
      </div>

      {canNavigate ? (
        <ul className={carouselClasses.dots}>
          {slides.map((slide, index) => (
            <li key={slide.id}>
              <button
                type='button'
                data-testid={getDotTestId?.(index)}
                data-index={index}
                className={cx(
                  carouselClasses.dot,
                  index === normalizedActiveIndex
                    ? carouselClasses.dotActive
                    : carouselClasses.dotInactive,
                )}
                aria-label={getPositionAriaLabel(index + 1, slideCount)}
                aria-current={index === normalizedActiveIndex ? 'true' : 'false'}
                onClick={handleDotClick}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export default LicenseHeroCarousel;
