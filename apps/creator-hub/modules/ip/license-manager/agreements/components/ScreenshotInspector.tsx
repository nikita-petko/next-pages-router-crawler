import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';

export interface InspectorImage {
  key: string;
  src: string;
  assetId: number;
}

interface ScreenshotInspectorProps {
  images: InspectorImage[];
  title: string;
  experienceHref?: string;
  /** Builds a shareable deep link that reopens the inspector on the given image. */
  getShareUrl?: (image: InspectorImage) => string;
  /** Called after a screenshot link is successfully copied to the clipboard. */
  onLinkCopied?: () => void;
  onClose: () => void;
}

// Forced-dark, full-viewport lightbox. Spacing/radius use Foundation tokens; the arbitrary
// `[property:value]` classes are reserved for values with no Foundation token: the theme-independent
// dark colors and whites (the overlay must stay dark regardless of the app theme), viewport sizes,
// z-index, transforms, absolute-position offsets, and off-scale element sizes. Foundation Icons
// inherit `currentColor`, so a button's text color drives its icon color.
const OVERLAY_CLASS =
  'fixed flex flex-col [inset:0] [z-index:1300] [width:100vw] [height:100vh] [max-width:100vw] [max-height:100vh] margin-none padding-none [border:none] [color:#fff] [background-color:rgb(12,12,15)]';
const HEADER_CLASS = 'flex items-center gap-large padding-y-large padding-x-xxlarge';
const HEADER_SIDE_CLASS = 'flex items-center [flex:1_1_0] [min-width:0]';
const COUNTER_CLASS = '[color:rgba(255,255,255,0.7)] [font-size:14px]';
const TITLE_LINK_CLASS =
  'inline-flex items-center gap-small [max-width:100%] [color:#fff] [font-size:16px] [font-weight:500] [text-decoration:underline]';
const TITLE_LINK_PLAIN_CLASS =
  'inline-flex items-center gap-small [max-width:100%] [color:#fff] [font-size:16px] [font-weight:500] [text-decoration:none]';
const TITLE_TEXT_CLASS = '[overflow:hidden] [text-overflow:ellipsis] [white-space:nowrap]';
const ICON_BUTTON_CLASS =
  'inline-flex items-center justify-center padding-small [border:none] radius-medium [background:transparent] [color:#fff] [cursor:pointer]';
const STAGE_CLASS =
  'relative flex items-center justify-center [flex:1_1_auto] [min-height:0] padding-top-none padding-bottom-small [padding-inline:72px]';
const IMAGE_CLASS = 'width-full height-full [object-fit:contain] radius-medium';
const FOOTER_CLASS =
  'flex flex-col items-center gap-medium padding-top-small padding-x-xxlarge padding-bottom-xxlarge';
const STRIP_ROW_CLASS = 'flex items-center gap-medium width-full';
const STRIP_CLASS =
  'flex gap-small [overflow-x:auto] [scrollbar-width:none] [flex:1_1_auto] padding-xxsmall';
const CIRCLE_BUTTON_CLASS =
  'inline-flex items-center justify-center width-[36px] height-[36px] [flex:0_0_auto] [border:none] radius-circle [background-color:#fff] [color:#111] [cursor:pointer]';
const THUMBNAIL_WRAPPER_CLASS = 'relative [flex:0_0_auto]';
const THUMBNAIL_IMAGE_CLASS = 'block width-full height-full [object-fit:cover]';
const THUMBNAIL_LINK_BUTTON_CLASS =
  'absolute [top:4px] [right:4px] inline-flex items-center justify-center padding-xsmall [border:none] [border-radius:6px] [background-color:rgba(0,0,0,0.65)] [color:#fff] [cursor:pointer]';
const DOTS_CLASS = 'flex items-center justify-center [gap:6px]';

const navArrowClass = (side: 'left' | 'right', disabled: boolean): string =>
  [
    'inline-flex items-center justify-center padding-small [border:none] radius-medium [background:transparent] [color:#fff]',
    'absolute [top:50%] [transform:translateY(-50%)]',
    side === 'left' ? '[left:16px]' : '[right:16px]',
    disabled ? '[opacity:0.3] [cursor:default]' : '[cursor:pointer]',
  ].join(' ');

const thumbnailClass = (isActive: boolean): string =>
  [
    'block width-[96px] height-[64px] padding-none radius-medium [overflow:hidden] [background-color:#1c1c20] [cursor:pointer]',
    isActive ? '[border:2px_solid_#fff]' : '[border:2px_solid_transparent]',
  ].join(' ');

const dotClass = (isActive: boolean): string =>
  [
    'width-[6px] height-[6px] padding-none [border:none] radius-circle [cursor:pointer]',
    isActive ? '[background-color:#fff]' : '[background-color:rgba(255,255,255,0.3)]',
  ].join(' ');

/**
 * Full-screen overlay that presents the passed screenshots (already ordered by the caller: all in
 * grid order, or the current selection in click order). Supports keyboard navigation and a thumbnail
 * strip. It renders into a portal so it sits above the app chrome; closing simply unmounts it,
 * revealing the gallery tab beneath.
 */
const ScreenshotInspector: FunctionComponent<ScreenshotInspectorProps> = ({
  images,
  title,
  experienceHref,
  getShareUrl,
  onLinkCopied,
  onClose,
}) => {
  const { translate } = useTranslation();

  const [activeIndex, setActiveIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [activePage, setActivePage] = useState(0);
  const [hoveredThumbnailKey, setHoveredThumbnailKey] = useState<string | null>(null);
  const [copiedThumbnailKey, setCopiedThumbnailKey] = useState<string | null>(null);

  const stripRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeImage = images[activeIndex];
  const hasMultiple = images.length > 1;
  const isAtStart = activeIndex <= 0;
  const isAtEnd = activeIndex >= images.length - 1;

  const handleCopyLink = useCallback(
    (image: InspectorImage) => {
      if (!getShareUrl) {
        return;
      }
      const shareUrl = getShareUrl(image);
      if (!shareUrl) {
        return;
      }
      void navigator.clipboard
        ?.writeText(shareUrl)
        .then(() => {
          setCopiedThumbnailKey(image.key);
          onLinkCopied?.();
        })
        .catch(() => undefined);
    },
    [getShareUrl, onLinkCopied],
  );

  const goPrev = useCallback(() => {
    setActiveIndex((current) => Math.max(0, current - 1));
  }, []);
  const goNext = useCallback(() => {
    setActiveIndex((current) => Math.min(images.length - 1, current + 1));
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowLeft') {
        goPrev();
      } else if (event.key === 'ArrowRight') {
        goNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [goNext, goPrev, onClose]);

  // Keep the active thumbnail visible as navigation moves through the strip.
  useEffect(() => {
    thumbnailRefs.current[activeIndex]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [activeIndex]);

  const COPY_FEEDBACK_DURATION_MS = 1500;

  useEffect(() => {
    if (!copiedThumbnailKey) {
      return undefined;
    }
    const timer = setTimeout(() => setCopiedThumbnailKey(null), COPY_FEEDBACK_DURATION_MS);
    return () => clearTimeout(timer);
  }, [copiedThumbnailKey]);

  // Derive the thumbnail-strip page dots from actual scroll geometry so the dot count matches how
  // many "pages" of thumbnails exist at the current width.
  const recomputePaging = useCallback(() => {
    const element = stripRef.current;
    if (!element || element.clientWidth <= 0) {
      return;
    }
    setPageCount(Math.max(1, Math.ceil(element.scrollWidth / element.clientWidth)));
    setActivePage(Math.round(element.scrollLeft / element.clientWidth));
  }, []);

  // Runs after the portal (and thus stripRef) is in the DOM, so the strip controls (arrows/dots) are
  // sized correctly on open rather than only after the first manual scroll.
  useEffect(() => {
    recomputePaging();
    const element = stripRef.current;
    if (!element || typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver(recomputePaging);
    observer.observe(element);
    return () => observer.disconnect();
  }, [recomputePaging, images.length]);

  const scrollStripByPage = useCallback((direction: -1 | 1) => {
    const element = stripRef.current;
    if (!element) {
      return;
    }
    element.scrollBy({ left: direction * element.clientWidth, behavior: 'smooth' });
  }, []);

  const scrollToPage = useCallback((page: number) => {
    const element = stripRef.current;
    if (!element) {
      return;
    }
    element.scrollTo({ left: page * element.clientWidth, behavior: 'smooth' });
  }, []);

  // Precompute stable keys for the positional page dots so the JSX map keys off a value rather than
  // the array index (matching the repo's no-array-index-key convention).
  const dotPages = useMemo(
    () => Array.from({ length: pageCount }, (_unused, page) => ({ key: `page-${page}`, page })),
    [pageCount],
  );

  const closeLabel = translate('Action.Close');
  const previousLabel = translate('Action.PreviousScreenshot');
  const nextLabel = translate('Action.NextScreenshot');
  const openExperienceLabel = translate('Action.ViewExperience');
  const copyLinkLabel = translate('Action.CopyScreenshotLink');
  const linkCopiedLabel = translate('Label.LinkCopied');
  const viewScreenshotLabel = translate('Action.ViewScreenshot');
  const counterLabel = translate('Label.ScreenshotInspectorCounter', {
    current: String(activeIndex + 1),
    total: String(images.length),
  });

  const titleContent = useMemo(() => {
    if (!title) {
      return null;
    }
    if (!experienceHref) {
      return <span className={TITLE_LINK_PLAIN_CLASS}>{title}</span>;
    }
    return (
      <a
        className={TITLE_LINK_CLASS}
        href={experienceHref}
        target='_blank'
        rel='noreferrer'
        aria-label={openExperienceLabel}
        data-testid='inspector-title-link'>
        <span className={TITLE_TEXT_CLASS}>{title}</span>
        <Icon
          name='icon-regular-arrow-up-right-from-square'
          className='width-[16px] height-[16px]'
        />
      </a>
    );
  }, [experienceHref, openExperienceLabel, title]);

  if (images.length === 0 || typeof document === 'undefined') {
    return null;
  }

  const overlay = (
    <dialog open className={OVERLAY_CLASS} aria-modal='true' aria-label={title || undefined}>
      <div className={HEADER_CLASS}>
        <div className={`${HEADER_SIDE_CLASS} justify-start`}>
          <span className={COUNTER_CLASS} data-testid='inspector-counter'>
            {counterLabel}
          </span>
        </div>
        <div className={`${HEADER_SIDE_CLASS} justify-center`}>{titleContent}</div>
        <div className={`${HEADER_SIDE_CLASS} justify-end`}>
          <button
            type='button'
            className={ICON_BUTTON_CLASS}
            aria-label={closeLabel}
            onClick={onClose}
            data-testid='inspector-close'>
            <Icon name='icon-regular-x' className='width-[24px] height-[24px]' />
          </button>
        </div>
      </div>

      <div className={STAGE_CLASS}>
        {hasMultiple && (
          <button
            type='button'
            className={navArrowClass('left', isAtStart)}
            aria-label={previousLabel}
            onClick={goPrev}
            disabled={isAtStart}
            data-testid='inspector-prev'>
            <Icon name='icon-regular-chevron-large-left' className='width-[28px] height-[28px]' />
          </button>
        )}
        {activeImage && (
          <img
            className={IMAGE_CLASS}
            src={activeImage.src}
            alt=''
            data-testid='inspector-active-image'
          />
        )}
        {hasMultiple && (
          <button
            type='button'
            className={navArrowClass('right', isAtEnd)}
            aria-label={nextLabel}
            onClick={goNext}
            disabled={isAtEnd}
            data-testid='inspector-next'>
            <Icon name='icon-regular-chevron-large-right' className='width-[28px] height-[28px]' />
          </button>
        )}
      </div>

      <div className={FOOTER_CLASS}>
        <div className={STRIP_ROW_CLASS}>
          {pageCount > 1 && (
            <button
              type='button'
              className={CIRCLE_BUTTON_CLASS}
              aria-label={previousLabel}
              onClick={() => scrollStripByPage(-1)}
              data-testid='inspector-strip-prev'>
              <Icon name='icon-regular-chevron-small-left' className='width-[20px] height-[20px]' />
            </button>
          )}
          <div
            ref={stripRef}
            className={STRIP_CLASS}
            onScroll={recomputePaging}
            data-testid='inspector-strip'>
            {images.map((image, index) => {
              const isCopied = copiedThumbnailKey === image.key;
              const showLinkButton =
                Boolean(getShareUrl) && (hoveredThumbnailKey === image.key || isCopied);
              return (
                <div
                  key={image.key}
                  className={THUMBNAIL_WRAPPER_CLASS}
                  onMouseEnter={() => setHoveredThumbnailKey(image.key)}
                  onMouseLeave={() =>
                    setHoveredThumbnailKey((current) => (current === image.key ? null : current))
                  }>
                  <button
                    type='button'
                    ref={(node) => {
                      thumbnailRefs.current[index] = node;
                    }}
                    className={thumbnailClass(index === activeIndex)}
                    aria-label={viewScreenshotLabel}
                    aria-current={index === activeIndex}
                    onClick={() => setActiveIndex(index)}
                    data-testid='inspector-thumbnail'>
                    <img className={THUMBNAIL_IMAGE_CLASS} src={image.src} alt='' />
                  </button>
                  {showLinkButton && (
                    <button
                      type='button'
                      className={THUMBNAIL_LINK_BUTTON_CLASS}
                      aria-label={isCopied ? linkCopiedLabel : copyLinkLabel}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleCopyLink(image);
                      }}
                      data-testid='inspector-copy-link'>
                      <Icon
                        name={isCopied ? 'icon-regular-check' : 'icon-regular-chain-link'}
                        className='width-[14px] height-[14px]'
                      />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {pageCount > 1 && (
            <button
              type='button'
              className={CIRCLE_BUTTON_CLASS}
              aria-label={nextLabel}
              onClick={() => scrollStripByPage(1)}
              data-testid='inspector-strip-next'>
              <Icon
                name='icon-regular-chevron-small-right'
                className='width-[20px] height-[20px]'
              />
            </button>
          )}
        </div>
        {pageCount > 1 && (
          <div className={DOTS_CLASS}>
            {dotPages.map(({ key, page }) => (
              <button
                key={key}
                type='button'
                className={dotClass(page === activePage)}
                aria-label={`${page + 1}`}
                onClick={() => scrollToPage(page)}
                data-testid='inspector-page-dot'
              />
            ))}
          </div>
        )}
      </div>
    </dialog>
  );

  return createPortal(overlay, document.body);
};

export default ScreenshotInspector;
