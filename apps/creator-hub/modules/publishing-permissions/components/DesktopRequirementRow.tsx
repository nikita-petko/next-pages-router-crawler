import React, { FunctionComponent } from 'react';
import { clsx as cx } from '@rbx/foundation-ui';
import { Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { PublishingTier, type TierRequirement } from '../types';
import { tierOrder } from '../constants/tiers';
import RequirementStatusIcon from './RequirementStatusIcon';
import RequirementChip from './RequirementChip';
import styles from './DesktopRequirementRow.module.css';

const DesktopRequirementRow: FunctionComponent<{
  requirement: TierRequirement;
  isCompleted: boolean;
  currentTier: PublishingTier;
  isLastRow?: boolean;
}> = ({ requirement, isCompleted, currentTier, isLastRow }) => {
  const { translate } = useTranslation();

  const getColumnClass = (tier: PublishingTier) =>
    cx(
      tier === currentTier && 'stroke-thin stroke-action-subtle',
      isLastRow ? ['radius-medium', styles.currentColumnCellLast] : styles.currentColumnCell,
    );

  return (
    <React.Fragment>
      <div className='flex items-center gap-medium padding-medium'>
        <div className={cx(styles.requirementChipCell, 'grow-0 shrink-0')}>
          <RequirementChip requirement={requirement} isCompleted={isCompleted} />
        </div>
        <div className='flex flex-col gap-xxsmall'>
          <Typography className='text-label-medium'>{translate(requirement.labelKey)}</Typography>
          <Typography className='text-body-small'>
            {translate(requirement.descriptionKey)}
          </Typography>
        </div>
      </div>
      {tierOrder.map((tier) => (
        <div
          key={tier}
          className={cx('flex items-center padding-medium bg-surface-200', getColumnClass(tier))}>
          <RequirementStatusIcon status={requirement.tiers[tier]} isCompleted={isCompleted} />
        </div>
      ))}
    </React.Fragment>
  );
};

export default DesktopRequirementRow;
