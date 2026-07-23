import { useCallback, useEffect, useRef } from 'react';
import { getPrettifiedNumber } from '@rbx/core';
import { Badge, IconButton, clsx as cx } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import useImpressionObserver from '@modules/charts-generic/charts/hooks/useImpressionObserver';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { RoadmapCategory } from './types';
import styles from './RoadmapCard.module.css';

export type RoadmapCardData = {
  id: string;
  title: string;
  description: string;
};

type RoadmapCardProps = Omit<RoadmapCardData, 'id'> & {
  category?: RoadmapCategory[];
  likeCount: number;
  isLiked?: boolean;
  className?: string;
  onClick?: () => void;
  onToggleLike?: (nextLiked: boolean) => void;
  /** Fired once when the card has been ≥50% visible for a sustained moment (roadmap_item_impression). */
  onImpression?: () => void;
};

// StateLayer replicates Foundation's hover/press overlay (not exported from @rbx/foundation-ui). It
// uses the group name `card`, not `interactable`: reusing `interactable` would nest the heart's own
// StateLayer in the same group and tint the heart whenever the card is hovered.
function StateLayer() {
  return (
    <div
      role='presentation'
      className='absolute inset-[0] pointer-events-none transition-colors group-hover/card:bg-[var(--color-state-hover)] group-active/card:bg-[var(--color-state-press)] group-disabled/card:bg-none'
    />
  );
}

function RoadmapCard({
  title,
  description,
  category,
  likeCount,
  isLiked = false,
  className,
  onClick,
  onToggleLike,
  onImpression,
}: RoadmapCardProps) {
  const { translate } = useTranslation();

  const handleToggleLike = () => onToggleLike?.(!isLiked);

  const cardRef = useRef<HTMLDivElement>(null);
  // The parent passes a fresh onImpression closure each render; keep the latest in a ref (updated in an
  // effect, not during render) so the observer's callback identity stays stable and useImpressionObserver
  // doesn't rebuild the observer on every parent re-render.
  const onImpressionRef = useRef(onImpression);
  useEffect(() => {
    onImpressionRef.current = onImpression;
  }, [onImpression]);
  const handleImpression = useCallback(() => onImpressionRef.current?.(), []);
  useImpressionObserver(cardRef, handleImpression);

  return (
    // A plain div wrapper: the overlay click target and the heart are sibling buttons, since nesting
    // one button inside another is invalid HTML.
    <div
      ref={cardRef}
      className={cx(
        styles.card,
        'flex flex-col gap-small bg-surface-0 radius-medium padding-y-large padding-x-xlarge stroke-standard stroke-default',
        'relative clip group/card',
        className,
      )}>
      <StateLayer />
      <button
        type='button'
        onClick={onClick}
        aria-haspopup='dialog'
        aria-label={title}
        className='absolute inset-[0] cursor-pointer [appearance:none] bg-[transparent] [border:none] padding-none focus-visible:outline-focus'
      />
      <div className='flex flex-col gap-small text-align-x-left pointer-events-none'>
        {category && category.length > 0 && (
          <div className='flex flex-row wrap gap-xsmall'>
            {category.map((name) => (
              <Badge key={name} label={name} variant='Neutral' />
            ))}
          </div>
        )}
        <span className='text-title-large content-emphasis'>{title}</span>
        <span className='text-body-small content-muted'>{description}</span>
      </div>
      <div className='relative [z-index:1] flex flex-row items-center justify-end gap-xsmall margin-top-auto pointer-events-none'>
        <IconButton
          icon={isLiked ? 'icon-filled-heart' : 'icon-regular-heart'}
          ariaLabel={translate('Action.Like')}
          aria-pressed={isLiked}
          variant='Utility'
          size='Small'
          isCircular
          className='pointer-events-auto'
          onClick={handleToggleLike}
        />
        <span className='text-body-medium content-muted'>{getPrettifiedNumber(likeCount)}</span>
      </div>
    </div>
  );
}

export default withTranslation(RoadmapCard, [TranslationNamespace.RoadMap]);
