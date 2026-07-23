import React, { FunctionComponent } from 'react';
import { clsx as cx } from '@rbx/foundation-ui';
import { Typography, Link } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import type { CreatorEligibilityEnum } from '@rbx/clients/coreContentApi';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { PublishingTier, RequirementStatus } from '../types';
import { tierLabelKeys, tierDescriptionKeys, requirements } from '../constants/tiers';
import RequirementStatusIcon from './RequirementStatusIcon';
import RequirementChip from './RequirementChip';
import styles from './MobileTierCard.module.css';

const MobileTierCard: FunctionComponent<{
  tier: PublishingTier;
  isCurrent: boolean;
  completedSet: Set<CreatorEligibilityEnum>;
}> = ({ tier, isCurrent, completedSet }) => {
  const { translate, translateHTML } = useTranslation();
  const descriptionKey = tierDescriptionKeys[tier];

  const tierRequirements = requirements.filter(
    (req) => req.tiers[tier] === RequirementStatus.Required,
  );

  const cardClass = isCurrent ? 'stroke-standard stroke-action-subtle' : '';

  return (
    <React.Fragment>
      {isCurrent && (
        <div
          className={cx(
            styles.currentBadge,
            'bg-inverse-surface-0 content-action-over-media text-no-wrap padding-xsmall radius-medium',
          )}>
          <Typography className='padding-x-xsmall text-body-small'>
            {translate('Label.CurrentTier')}
          </Typography>
        </div>
      )}
      <div className={cx(cardClass, 'relative radius-medium')}>
        <div
          className={cx(
            styles.tierCardHeader,
            'flex flex-col gap-xsmall bg-surface-300 padding-large radius-medium',
          )}>
          <Typography className='text-label-medium'>{translate(tierLabelKeys[tier])}</Typography>
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
        {tierRequirements.map((requirement, index) => {
          const isCompleted = completedSet.has(requirement.id);
          const isLastRequirement = index === tierRequirements.length - 1;
          return (
            <div
              key={requirement.id}
              className={cx(
                'flex items-center gap-medium padding-y-medium padding-x-large bg-surface-200',
                isLastRequirement && ['radius-medium', styles.lastRequirementRow],
              )}>
              <div className={cx('grow-0 shrink-0', styles.requirementChipCell)}>
                <RequirementChip requirement={requirement} isCompleted={isCompleted} />
              </div>
              <div className='grow basis-0'>
                <Typography className='text-label-medium block'>
                  {translate(requirement.labelKey)}
                </Typography>
                <Typography className='text-body-small block'>
                  {translate(requirement.descriptionKey)}
                </Typography>
              </div>
              <div className='grow-0 shrink-0'>
                <RequirementStatusIcon status={requirement.tiers[tier]} isCompleted={isCompleted} />
              </div>
            </div>
          );
        })}
      </div>
    </React.Fragment>
  );
};

export default MobileTierCard;
