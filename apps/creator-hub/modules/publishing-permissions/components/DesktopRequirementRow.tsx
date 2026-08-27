import type { FunctionComponent } from 'react';
import type { AgeBracketEnum, CreatorTierEnum } from '@rbx/client-core-content-api/v1';
import { clsx as cx } from '@rbx/foundation-ui';
import { Typography } from '@rbx/ui';
import type { PublishPermissionRequirementView, PublishingTier } from '../constants/displayCopy';
import { isRequiredForTier } from '../utils/mapPublishPermissionsToView';
import RequirementChip from './RequirementChip';
import RequirementStatusIcon from './RequirementStatusIcon';

const DesktopRequirementRow: FunctionComponent<{
  requirement: PublishPermissionRequirementView;
  isCompleted: boolean;
  currentTier: CreatorTierEnum;
  ageBracket: AgeBracketEnum;
  tierOrder: PublishingTier[];
}> = ({ requirement, isCompleted, currentTier, ageBracket, tierOrder }) => {
  return (
    <>
      <div className='flex items-center gap-xsmall padding-large place-content-between'>
        <div className='flex flex-col gap-xsmall'>
          <Typography className='text-label-medium'>{requirement.label}</Typography>
          <Typography className='text-body-small'>{requirement.description}</Typography>
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
            isRequired={isRequiredForTier(requirement, tier)}
            isCompleted={isCompleted}
            isEnabled={requirement.isEnabled}
          />
        </div>
      ))}
    </>
  );
};

export default DesktopRequirementRow;
