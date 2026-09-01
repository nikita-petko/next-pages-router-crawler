import type { FunctionComponent } from 'react';
import type { AgeBracketEnum, CreatorTierEnum } from '@rbx/client-core-content-api/v1';
import { useMediaQuery } from '@rbx/ui';
import type { PublishPermissionRequirementView, PublishingTier } from '../constants/displayCopy';
import DesktopRequirementRow from './DesktopRequirementRow';
import MobileTierCard from './MobileTierCard';
import TierHeaders from './TierHeaders';
import styles from './PublishingPermissionsTable.module.css';

interface PublishingPermissionsTableProps {
  ageBracket: AgeBracketEnum;
  currentTier: CreatorTierEnum;
  tierOrder: PublishingTier[];
  tierLabels: Record<PublishingTier, string>;
  tierDescriptions: Record<PublishingTier, string>;
  requirements: PublishPermissionRequirementView[];
}

const PublishingPermissionsTable: FunctionComponent<PublishingPermissionsTableProps> = ({
  ageBracket,
  currentTier,
  tierOrder,
  tierLabels,
  tierDescriptions,
  requirements,
}) => {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  if (isMobile) {
    return (
      <div className='flex flex-col gap-xlarge padding-top-xlarge'>
        {tierOrder.map((tier) => (
          <MobileTierCard
            key={tier}
            tier={tier}
            isCurrent={tier === currentTier}
            ageBracket={ageBracket}
            requirements={requirements}
            tierLabels={tierLabels}
            tierDescriptions={tierDescriptions}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${styles.tableGrid} grid width-full margin-top-large stroke-standard stroke-emphasis radius-medium`}>
      <TierHeaders
        currentTier={currentTier}
        tierOrder={tierOrder}
        tierLabels={tierLabels}
        tierDescriptions={tierDescriptions}
      />
      {requirements.map((requirement) => (
        <DesktopRequirementRow
          key={requirement.id}
          requirement={requirement}
          isCompleted={requirement.isCompleted}
          currentTier={currentTier}
          ageBracket={ageBracket}
          tierOrder={tierOrder}
        />
      ))}
    </div>
  );
};

export default PublishingPermissionsTable;
