import type { FunctionComponent } from 'react';
import type { AgeBracketEnum, CreatorTierEnum } from '@rbx/client-core-content-api/v1';
import { clsx as cx } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import type { PublishingTier, TierRequirement } from '../types';
import RequirementChip from './RequirementChip';
import RequirementStatusIcon from './RequirementStatusIcon';

const DesktopRequirementRow: FunctionComponent<{
  requirement: TierRequirement;
  isCompleted: boolean;
  currentTier: CreatorTierEnum;
  ageBracket: AgeBracketEnum;
  tierOrder: PublishingTier[];
}> = ({ requirement, isCompleted, currentTier, ageBracket, tierOrder }) => {
  const { translate } = useTranslation();

  return (
    <>
      <div className='flex items-center gap-xsmall padding-large place-content-between'>
        <div className='flex flex-col gap-xsmall'>
          <Typography className='text-label-medium'>{translate(requirement.labelKey)}</Typography>
          <Typography className='text-body-small text-center'>
            {translate(requirement.descriptionKey)}
          </Typography>
        </div>
        <div className='grow-0 shrink-0'>
          <RequirementChip
            requirement={requirement}
            isCompleted={isCompleted}
            ageBracket={ageBracket}
          />
        </div>
      </div>
      {tierOrder.map((tier) => (
        <div
          key={tier}
          className={cx(
            'flex items-center padding-large justify-center',
            tier === currentTier && 'bg-shift-100',
          )}>
          <RequirementStatusIcon
            status={requirement.tiers[tier]}
            isCompleted={isCompleted}
            comingSoon={requirement.comingSoon}
          />
        </div>
      ))}
    </>
  );
};

export default DesktopRequirementRow;
