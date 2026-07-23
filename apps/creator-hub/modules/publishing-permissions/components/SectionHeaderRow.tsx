import React, { FunctionComponent } from 'react';
import { clsx as cx } from '@rbx/foundation-ui';
import { Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { PublishingTier } from '../types';
import { tierOrder } from '../constants/tiers';
import styles from './SectionHeaderRow.module.css';

const SectionHeaderRow: FunctionComponent<{
  labelKey: string;
  currentTier: PublishingTier;
}> = ({ labelKey, currentTier }) => {
  const { translate } = useTranslation();

  return (
    <React.Fragment>
      <div className={styles.borderContainer} aria-hidden='true'>
        <div className={cx(styles.borders, 'stroke-emphasis stroke-standard')} />
      </div>
      <div className='padding-medium relative'>
        <Typography className='text-body-medium'>{translate(labelKey)}</Typography>
      </div>
      {tierOrder.map((tier) => (
        <div
          key={tier}
          className={cx(
            'padding-medium relative bg-surface-200',
            tier === currentTier && ['stroke-thin stroke-action-subtle', styles.currentColumnCell],
          )}
        />
      ))}
      <div className={styles.borderContainer} aria-hidden='true'>
        <div className={cx(styles.borders, 'stroke-emphasis stroke-standard')} />
      </div>
    </React.Fragment>
  );
};

export default SectionHeaderRow;
