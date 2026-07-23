import type { FunctionComponent } from 'react';
import Link from 'next/link';
import { Skeleton } from '@rbx/ui';

export const MAX_SCREENSHOTS = 6;

const screenshotsGridClassName =
  'grid gap-small items-start [grid-template-columns:repeat(3,minmax(0,1fr))]';
const screenshotFillClassName = 'absolute inset-0 width-full height-full';
const screenshotCellClassName = 'width-full relative clip radius-small [aspect-ratio:4/3]';
const screenshotImageClassName = `[object-fit:cover] ${screenshotFillClassName}`;

export interface DetectedScreenshotItem {
  imageUrl: string;
  href: string;
}

interface DetectedScreenshotsGridProps {
  /** Resolved screenshots with their deep-link hrefs (pending-moderation/unshared assets excluded upstream). */
  items: DetectedScreenshotItem[];
  isLoading?: boolean;
}

/**
 * Renders a 3-column grid of up to {@link MAX_SCREENSHOTS} detected screenshots for a match
 * candidate, showing shimmer placeholders while the screenshots load. Renders nothing when there
 * are no resolved screenshots.
 */
const DetectedScreenshotsGrid: FunctionComponent<DetectedScreenshotsGridProps> = ({
  items,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className={screenshotsGridClassName}>
        {Array.from({ length: MAX_SCREENSHOTS }, (_, index) => (
          <div key={index} className={screenshotCellClassName}>
            <Skeleton animate variant='rectangular' className={screenshotFillClassName} />
          </div>
        ))}
      </div>
    );
  }

  const visibleItems = items.slice(0, MAX_SCREENSHOTS);

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div className={screenshotsGridClassName}>
      {visibleItems.map((item) => (
        <Link
          key={item.imageUrl}
          href={item.href}
          className={`${screenshotCellClassName} cursor-pointer`}>
          <img className={screenshotImageClassName} src={item.imageUrl} alt='' />
        </Link>
      ))}
    </div>
  );
};

export default DetectedScreenshotsGrid;
