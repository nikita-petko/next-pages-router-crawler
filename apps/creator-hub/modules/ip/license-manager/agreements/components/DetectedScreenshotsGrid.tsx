import type { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { Skeleton } from '@rbx/ui';

export const MAX_SCREENSHOTS = 6;

const screenshotsGridClassName =
  'grid gap-small items-start [grid-template-columns:repeat(3,minmax(0,1fr))]';
const screenshotFillClassName = 'absolute inset-0 width-full height-full';
const screenshotCellClassName = 'width-full relative clip radius-small [aspect-ratio:4/3]';

export interface DetectedScreenshotItem {
  imageUrl: string;
  assetId: number;
}

interface DetectedScreenshotsGridProps {
  /** Resolved screenshots (pending-moderation/unshared assets excluded upstream). */
  items: DetectedScreenshotItem[];
  isLoading?: boolean;
  /** Number of skeleton placeholders to show while loading. Defaults to {@link MAX_SCREENSHOTS}. */
  skeletonCount?: number;
  /** Called when a screenshot cell is clicked, passing the index within `items`. */
  onItemClick?: (index: number) => void;
}

/**
 * Renders a 3-column grid of up to {@link MAX_SCREENSHOTS} detected screenshots for a match
 * candidate, showing shimmer placeholders while the screenshots load. Renders nothing when there
 * are no resolved screenshots.
 */
const DetectedScreenshotsGrid: FunctionComponent<DetectedScreenshotsGridProps> = ({
  items,
  isLoading = false,
  skeletonCount = MAX_SCREENSHOTS,
  onItemClick,
}) => {
  const { translate } = useTranslation();

  if (isLoading) {
    return (
      <div className={screenshotsGridClassName}>
        {Array.from({ length: skeletonCount }, (_, index) => (
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
      {visibleItems.map((item, index) => (
        <div key={item.imageUrl} className={screenshotCellClassName}>
          <button
            type='button'
            aria-label={translate('Action.ViewScreenshot')}
            className='block width-full height-full cursor-pointer [border:none] [background:transparent] [padding:0]'
            onClick={() => onItemClick?.(index)}
            data-testid='detected-screenshot-cell'>
            <img className='width-full height-full [object-fit:cover]' src={item.imageUrl} alt='' />
          </button>
        </div>
      ))}
    </div>
  );
};

export default DetectedScreenshotsGrid;
