import { FunctionComponent, useMemo } from 'react';
import { useMediaQuery } from '@rbx/ui';
import type { CreatorEligibilityEnum } from '@rbx/clients/coreContentApi';
import { PublishingTier, RequirementStatus, type TierRequirement } from '../types';
import { tierOrder, requirements } from '../constants/tiers';
import TierHeaders from './TierHeaders';
import SectionHeaderRow from './SectionHeaderRow';
import DesktopRequirementRow from './DesktopRequirementRow';
import MobileTierCard from './MobileTierCard';
import styles from './PublishingPermissionsTable.module.css';

interface PublishingPermissionsTableProps {
  completedRequirements: CreatorEligibilityEnum[];
}

const getCurrentTier = (
  completedReqs: CreatorEligibilityEnum[],
  allRequirements: TierRequirement[],
): PublishingTier => {
  const completedSet = new Set(completedReqs);

  const meetsAllForTier = (tier: PublishingTier) =>
    allRequirements.every(
      (req) => req.tiers[tier] === RequirementStatus.NotRequired || completedSet.has(req.id),
    );

  if (meetsAllForTier(PublishingTier.Professional)) return PublishingTier.Professional;
  if (meetsAllForTier(PublishingTier.Community)) return PublishingTier.Community;
  return PublishingTier.Starter;
};

const PublishingPermissionsTable: FunctionComponent<PublishingPermissionsTableProps> = ({
  completedRequirements,
}) => {
  const completedSet = useMemo(() => new Set(completedRequirements), [completedRequirements]);
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const currentTier = useMemo(
    () => getCurrentTier(completedRequirements, requirements),
    [completedRequirements],
  );

  if (isMobile) {
    return (
      <div className='flex flex-col gap-large'>
        {tierOrder.map((tier) => (
          <MobileTierCard
            key={tier}
            tier={tier}
            isCurrent={tier === currentTier}
            completedSet={completedSet}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`${styles.tableGrid} grid width-full gap-x-xsmall margin-top-large`}>
      <TierHeaders currentTier={currentTier} />

      <SectionHeaderRow labelKey='Heading.Requirements' currentTier={currentTier} />
      {requirements.map((requirement, index) => (
        <DesktopRequirementRow
          key={requirement.id}
          requirement={requirement}
          isCompleted={completedSet.has(requirement.id)}
          currentTier={currentTier}
          isLastRow={index === requirements.length - 1}
        />
      ))}
    </div>
  );
};

export default PublishingPermissionsTable;
