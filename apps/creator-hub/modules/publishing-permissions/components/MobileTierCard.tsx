import type { FunctionComponent } from 'react';
import type { CreatorEligibilityEnum, AgeBracketEnum } from '@rbx/client-core-content-api/v1';
import { clsx as cx } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import type { PublishingTier, TierRequirement } from '../types';
import { RequirementStatus } from '../types';
import RequirementChip from './RequirementChip';
import RequirementStatusIcon from './RequirementStatusIcon';
import styles from './MobileTierCard.module.css';

const MobileTierCard: FunctionComponent<{
  tier: PublishingTier;
  isCurrent: boolean;
  completedSet: Set<CreatorEligibilityEnum>;
  ageBracket: AgeBracketEnum;
  requirements: TierRequirement[];
  tierLabelKeys: Record<PublishingTier, string>;
  tierDescriptionKeys: Record<PublishingTier, string>;
}> = ({
  tier,
  isCurrent,
  completedSet,
  ageBracket,
  requirements,
  tierLabelKeys,
  tierDescriptionKeys,
}) => {
  const { translate } = useTranslation();

  const tierRequirements = requirements.filter(
    (req) => req.tiers[tier] === RequirementStatus.Required,
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
        <Typography className='text-label-medium'>{translate(tierLabelKeys[tier])}</Typography>
        <Typography className='text-body-small'>{translate(tierDescriptionKeys[tier])}</Typography>
      </div>
      {tierRequirements.map((requirement) => {
        const isCompleted = completedSet.has(requirement.id);
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
                status={requirement.tiers[tier]}
                isCompleted={isCompleted}
                comingSoon={requirement.comingSoon}
              />
            </div>
            <div className='grow basis-0'>
              <Typography className='text-label-medium block'>
                {translate(requirement.labelKey)}
              </Typography>
              <Typography className='text-body-small block text-center'>
                {translate(requirement.descriptionKey)}
              </Typography>
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
