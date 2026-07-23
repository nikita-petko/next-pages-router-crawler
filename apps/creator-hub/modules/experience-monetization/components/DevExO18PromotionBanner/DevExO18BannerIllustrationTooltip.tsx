import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import RAQIV2ClientProvider from '@modules/experience-analytics-shared/context/RAQIV2ClientProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useDevExO18PotentialEarningsSummary from '../../pages/DevExO18/useDevExO18PotentialEarningsSummary';

// Fixed anchor as a fraction of the illustration SVG itself (the <img> box,
// which the SVG fills) — not the banner bounding box. This keeps the tooltip in
// the same spot on the artwork as the banner height changes across breakpoints.
const TOOLTIP_LEFT_FRACTION = 0.21;
const TOOLTIP_TOP_FRACTION = 0.44;

// Cap the bubble width so long copy wraps to a second line instead of running off
// the illustration.
const TOOLTIP_MAX_WIDTH = 200;

type AnchorPosition = { leftPx: number; topPx: number };

// Foundation tooltip beak (see @rbx/foundation-ui internal Beak), drawn pointing
// down. Rotated 90deg so it points left, anchored to the bubble's left edge.
function LeftBeak() {
  return (
    <span
      // Match the bubble's inverse-surface color (the foundation tooltip
      // surface) so the beak reads as one shape with the bubble across themes.
      style={{
        position: 'relative',
        display: 'block',
        width: 6,
        height: 13,
        marginRight: -2,
        color: 'var(--color-inverse-surface-0)',
      }}>
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='13'
        height='6'
        viewBox='0 0 13 6'
        fill='none'
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(90deg)',
        }}>
        <path
          d='M0.249999 0.666628L4.83579 5.25241C5.61683 6.03346 6.88316 6.03346 7.66421 5.25241L12.25 0.666626L0.249999 0.666628Z'
          fill='currentColor'
        />
      </svg>
    </span>
  );
}

// Inner content: fetches the earnings value and renders the positioned bubble.
// Rendered inside RAQIV2ClientProvider (required by the summary hook) only once
// an anchor exists, so the network request is skipped when no illustration is
// shown. Renders nothing until there is a real, non-zero value.
function DevExO18BannerTooltip({
  anchor,
  universeId,
}: {
  anchor: AnchorPosition;
  universeId: number;
}) {
  const { translate } = useTranslationWrapper(useTranslation());
  const { numericValue } = useDevExO18PotentialEarningsSummary(universeId);

  if (numericValue == null || numericValue === 0) {
    return null;
  }

  // Dollar amount: always exactly two decimal places ($ comes from the label).
  const formattedEarnings = numericValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div
      className='absolute z-1 flex items-center'
      style={{ left: anchor.leftPx, top: anchor.topPx, transform: 'translateY(-50%)' }}>
      <LeftBeak />
      <div
        className='radius-small bg-inverse-surface-0 padding-y-xsmall padding-x-small shadow-transient-low'
        style={{ width: 'max-content', maxWidth: TOOLTIP_MAX_WIDTH, whiteSpace: 'normal' }}>
        <span className='text-caption-medium content-inverse-default'>
          {translate(
            translationKey('Label.DevExO18BannerPotentialEarnings', TranslationNamespace.DevEx),
            { earnings: formattedEarnings },
          )}
        </span>
      </div>
    </div>
  );
}

type DevExO18BannerIllustrationTooltipProps = {
  universeId: number;
};

// Static, non-interactive tooltip overlaid on the banner illustration. It looks
// like a foundation-ui tooltip but is deliberately not one: no hover, no
// animation, no collision-aware placement — it is pinned to a fixed fraction of
// the illustration SVG and always opens to the right.
//
// Must be rendered as a direct child of a position:relative element that also
// contains the illustration <img> (i.e. the PromotionBanner wrapper).
function DevExO18BannerIllustrationTooltip({ universeId }: DevExO18BannerIllustrationTooltipProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<AnchorPosition | null>(null);

  useLayoutEffect(() => {
    // Resolve the positioning container from our own DOM node so we don't depend
    // on a parent ref being attached before this child effect runs.
    const container = rootRef.current?.parentElement;
    if (!container) {
      return undefined;
    }

    const measure = () => {
      const img = container.querySelector('img');
      if (!img) {
        setAnchor(null);
        return;
      }
      const imgRect = img.getBoundingClientRect();
      // The illustration is hidden (display:none) on narrow banners; skip then.
      if (imgRect.width === 0 || imgRect.height === 0) {
        setAnchor(null);
        return;
      }
      const containerRect = container.getBoundingClientRect();
      setAnchor({
        leftPx: imgRect.left - containerRect.left + imgRect.width * TOOLTIP_LEFT_FRACTION,
        topPx: imgRect.top - containerRect.top + imgRect.height * TOOLTIP_TOP_FRACTION,
      });
    };

    measure();

    // ResizeObserver is unavailable in some environments (e.g. jsdom); fall back
    // to the initial measure plus the image load below.
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(container);
    const img = container.querySelector('img');
    if (img) {
      observer?.observe(img);
      img.addEventListener('load', measure);
    }

    return () => {
      observer?.disconnect();
      if (img) {
        img.removeEventListener('load', measure);
      }
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden='true'
      className='pointer-events-none'
      style={{ position: 'absolute', top: 0, left: 0 }}>
      {anchor && (
        <RAQIV2ClientProvider>
          <DevExO18BannerTooltip anchor={anchor} universeId={universeId} />
        </RAQIV2ClientProvider>
      )}
    </div>
  );
}

export default DevExO18BannerIllustrationTooltip;
