import type { FunctionComponent } from 'react';
import { useMemo } from 'react';
import type {
  AgeBracketEnum,
  CreatorEligibilityEnum,
  CreatorTierEnum,
} from '@rbx/client-core-content-api/v1';
import { useMediaQuery } from '@rbx/ui';
import type { PublishingPermissionsConfig } from '../constants/configs';
import DesktopRequirementRow from './DesktopRequirementRow';
import MobileTierCard from './MobileTierCard';
import TierHeaders from './TierHeaders';
import styles from './PublishingPermissionsTable.module.css';

interface PublishingPermissionsTableProps {
  completedRequirements: CreatorEligibilityEnum[];
  ageBracket: AgeBracketEnum;
  creatorTier: CreatorTierEnum;
  config: PublishingPermissionsConfig;
}

const PublishingPermissionsTable: FunctionComponent<PublishingPermissionsTableProps> = ({
  completedRequirements,
  ageBracket,
  creatorTier,
  config,
}) => {
  const completedSet = useMemo(() => new Set(completedRequirements), [completedRequirements]);
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const requirements = useMemo(() => config.getRequirements(ageBracket), [config, ageBracket]);

  if (isMobile) {
    return (
      <div className='flex flex-col gap-xlarge padding-top-xlarge'>
        {config.tierOrder.map((tier) => (
          <MobileTierCard
            key={tier}
            tier={tier}
            isCurrent={tier === creatorTier}
            completedSet={completedSet}
            ageBracket={ageBracket}
            requirements={requirements}
            tierLabelKeys={config.tierLabelKeys}
            tierDescriptionKeys={config.tierDescriptionKeys}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${styles.tableGrid} grid width-full margin-top-large stroke-standard stroke-emphasis radius-medium`}>
      <TierHeaders
        currentTier={creatorTier}
        tierOrder={config.tierOrder}
        tierLabelKeys={config.tierLabelKeys}
        tierDescriptionKeys={config.tierDescriptionKeys}
      />
      {requirements.map((requirement) => (
        <DesktopRequirementRow
          key={requirement.id}
          requirement={requirement}
          isCompleted={completedSet.has(requirement.id)}
          currentTier={creatorTier}
          ageBracket={ageBracket}
          tierOrder={config.tierOrder}
        />
      ))}
    </div>
  );
};

export default PublishingPermissionsTable;
