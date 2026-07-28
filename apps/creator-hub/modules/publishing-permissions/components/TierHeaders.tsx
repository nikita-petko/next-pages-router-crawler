import type { FunctionComponent } from 'react';
import type { CreatorTierEnum } from '@rbx/client-core-content-api/v1';
import { clsx as cx } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import type { PublishingTier } from '../types';
import styles from './TierHeaders.module.css';

const TierHeaders: FunctionComponent<{
  currentTier: CreatorTierEnum;
  tierOrder: PublishingTier[];
  tierLabelKeys: Record<PublishingTier, string>;
  tierDescriptionKeys: Record<PublishingTier, string>;
}> = ({ currentTier, tierOrder, tierLabelKeys, tierDescriptionKeys }) => {
  const { translate } = useTranslation();

  return (
    <>
      <div className='flex items-end padding-large'>
        <Typography className='text-body-medium'>{translate('Heading.Requirements')}</Typography>
      </div>
      {tierOrder.map((tier) => {
        const isCurrent = tier === currentTier;
        return (
          <div
            key={tier}
            data-testid={`tier-column-${tier}`}
            className={cx(
              'relative padding-top-xxlarge padding-large',
              isCurrent && 'bg-shift-200',
            )}>
            {isCurrent && (
              <div
                className={cx(
                  styles.currentBadge,
                  'absolute bg-inverse-surface-0 content-action-over-media text-no-wrap padding-xsmall radius-medium',
                )}>
                <Typography className='padding-x-xsmall text-body-small'>
                  {translate('Label.CurrentTier')}
                </Typography>
              </div>
            )}
            <div className='flex flex-col gap-xsmall items-center'>
              <Typography className='text-label-medium text-align-x-center'>
                {translate(tierLabelKeys[tier])}
              </Typography>
              <Typography className='text-body-small text-align-x-center'>
                {translate(tierDescriptionKeys[tier])}
              </Typography>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default TierHeaders;
