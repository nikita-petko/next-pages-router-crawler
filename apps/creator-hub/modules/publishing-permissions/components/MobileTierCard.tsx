import type { FunctionComponent } from 'react';
import type { AgeBracketEnum } from '@rbx/client-core-content-api/v1';
import { clsx as cx } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import type { PublishPermissionRequirementView, PublishingTier } from '../constants/displayCopy';
import { isRequiredForTier } from '../utils/mapPublishPermissionsToView';
import RequirementChip from './RequirementChip';
import RequirementStatusIcon from './RequirementStatusIcon';
import styles from './MobileTierCard.module.css';

const MobileTierCard: FunctionComponent<{
  tier: PublishingTier;
  isCurrent: boolean;
  ageBracket: AgeBracketEnum;
  requirements: PublishPermissionRequirementView[];
  tierLabels: Record<PublishingTier, string>;
  tierDescriptions: Record<PublishingTier, string>;
}> = ({ tier, isCurrent, ageBracket, requirements, tierLabels, tierDescriptions }) => {
  const { translate } = useTranslation();

  const tierRequirements = requirements.filter((requirement) =>
    isRequiredForTier(requirement, tier),
  );

  return (
    <div className='relative radius-medium stroke-standard stroke-emphasis'>
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
      <div
        className={cx(
          styles.tierCardHeader,
          isCurrent ? 'bg-shift-200' : 'bg-shift-100',
          'flex flex-col gap-xsmall padding-top-xxlarge padding-x-xlarge padding-bottom-large radius-medium items-center',
        )}>
        <Typography className='text-label-medium'>{tierLabels[tier]}</Typography>
        <Typography className='text-body-small'>{tierDescriptions[tier]}</Typography>
      </div>
      {tierRequirements.map((requirement) => {
        const isCompleted = requirement.isCompleted;
        return (
          <div
            key={requirement.id}
            className={cx(
              isCurrent ? 'bg-shift-100' : 'bg-surface-200',
              'flex items-center gap-medium padding-y-medium padding-x-large',
              styles.borderTop,
            )}>
            <div className='grow-0 shrink-0'>
              <RequirementStatusIcon
                isRequired
                isCompleted={isCompleted}
                isEnabled={requirement.isEnabled}
              />
            </div>
            <div className='grow basis-0'>
              <Typography className='text-label-medium block'>{requirement.label}</Typography>
              <Typography className='text-body-small block'>{requirement.description}</Typography>
            </div>
            <div className={cx('grow-0 shrink-0', styles.requirementChipCell)}>
              <RequirementChip
                requirement={requirement}
                isCompleted={isCompleted}
                ageBracket={ageBracket}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MobileTierCard;
