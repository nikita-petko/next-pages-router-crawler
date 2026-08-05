import { useCallback, useEffect, useRef } from 'react';
import { getPrettifiedNumber } from '@rbx/core';
import { Badge, IconButton, clsx as cx } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import useImpressionObserver from '@modules/charts-generic/charts/hooks/useImpressionObserver';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import styles from './RoadmapCard.module.css';

export type RoadmapCardData = {
  id: string;
  title: string;
  description: string;
};

type RoadmapCardProps = Omit<RoadmapCardData, 'id'> & {
  categoryLabels?: string[];
  likeCount: number;
  isLiked?: boolean;
  className?: string;
  onClick?: () => void;
  onToggleLike?: (nextLiked: boolean) => void;
  onImpression?: () => void;
};
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
  categoryLabels,
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
  const onImpressionRef = useRef(onImpression);
  useEffect(() => {
    onImpressionRef.current = onImpression;
  }, [onImpression]);
  const handleImpression = useCallback(() => onImpressionRef.current?.(), []);
  useImpressionObserver(cardRef, handleImpression);

  return (
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
        {categoryLabels && categoryLabels.length > 0 && (
          <div className='flex flex-row wrap gap-xsmall'>
            {categoryLabels.map((label) => (
              <Badge key={label} label={label} variant='Neutral' />
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
