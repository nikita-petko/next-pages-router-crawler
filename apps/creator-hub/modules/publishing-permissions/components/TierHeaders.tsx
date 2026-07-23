import React, { FunctionComponent } from 'react';
import { clsx as cx } from '@rbx/foundation-ui';
import { Typography, Link } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { PublishingTier } from '../types';
import { tierOrder, tierLabelKeys, tierDescriptionKeys } from '../constants/tiers';
import styles from './TierHeaders.module.css';

const TierHeaders: FunctionComponent<{ currentTier: PublishingTier }> = ({ currentTier }) => {
  const { translate, translateHTML } = useTranslation();

  return (
    <React.Fragment>
      <div className='flex items-center padding-y-large padding-x-medium'>
        <div className='flex items-center gap-small' />
      </div>
      {tierOrder.map((tier) => {
        const isCurrent = tier === currentTier;
        const descriptionKey = tierDescriptionKeys[tier];
        return (
          <div
            key={tier}
            className={cx(
              'padding-y-large padding-x-medium bg-surface-300 relative radius-medium',
              styles.tierHeaderCell,
              isCurrent && 'stroke-thin stroke-action-subtle',
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
            <div className='flex flex-col gap-xsmall'>
              <Typography className='text-label-medium'>
                {translate(tierLabelKeys[tier])}
              </Typography>
              {descriptionKey && (
                <Typography className='text-body-small'>
                  {translateHTML(descriptionKey, [
                    {
                      opening: 'linkStart',
                      closing: 'linkEnd',
                      content: (chunks) => (
                        <Link
                          href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/promotion/content-maturity`}
                          target='_blank'>
                          {chunks}
                        </Link>
                      ),
                    },
                  ])}
                </Typography>
              )}
            </div>
          </div>
        );
      })}
    </React.Fragment>
  );
};

export default TierHeaders;
