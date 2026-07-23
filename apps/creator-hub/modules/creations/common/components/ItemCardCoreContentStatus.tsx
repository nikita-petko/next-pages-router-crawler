import type { FunctionComponent } from 'react';
import React from 'react';
import type { UniverseEligibility } from '@rbx/client-core-content-api/v1';
import { SelectStatusEnum } from '@rbx/client-core-content-api/v1';
import { ReleaseStatus } from '@rbx/client-experience-releases-api/v1';
import type { SearchCreatorType } from '@rbx/client-universes-api/v1';
import { Skeleton } from '@rbx/ui';
import type { Audience } from '../audiences';
import PrivacyStatusBadge from './PrivacyStatusBadge';

export interface ItemCardCoreContentStatusProps {
  universeId: number;
  contentMaturity?: string;
  isActive: boolean;
  isLoading: boolean;
  releaseStatus?: ReleaseStatus;
  isFriendsOnly?: boolean;
  audiences?: Audience[];
  creatorType?: SearchCreatorType;
  coreContentEligibility?: UniverseEligibility;
  useNewBadgePattern?: boolean;
  ageRecommendation?: number | null;
  isSequestered?: boolean;
  isDiscoveryBlocked?: boolean;
  enableAtRiskAnnotation?: boolean;
}

const ItemCardCoreContentStatus: FunctionComponent<
  React.PropsWithChildren<ItemCardCoreContentStatusProps>
> = ({
  universeId,
  contentMaturity,
  isActive,
  isLoading,
  releaseStatus,
  isFriendsOnly = false,
  audiences,
  creatorType,
  coreContentEligibility,
  useNewBadgePattern,
  ageRecommendation,
  isSequestered,
  isDiscoveryBlocked,
  enableAtRiskAnnotation = false,
}) => {
  if (isLoading) {
    return <Skeleton width='50%' />;
  }

  const isBeta = releaseStatus === ReleaseStatus.Beta;
  const isSelect = coreContentEligibility?.selectStatus === SelectStatusEnum.Eligible;
  const isSelectAtRisk =
    enableAtRiskAnnotation && isSelect && (coreContentEligibility?.reasons.length ?? 0) > 0;

  // forward both legacy and new audience props; PrivacyStatusBadge does the
  // flag-based selection internally.
  return (
    <PrivacyStatusBadge
      universeId={universeId}
      isActive={isActive}
      isFriendsOnly={isFriendsOnly}
      audiences={audiences}
      creatorType={creatorType}
      contentMaturity={contentMaturity}
      isBeta={isBeta}
      isSelect={isSelect}
      isSelectAtRisk={isSelectAtRisk}
      useNewBadgePattern={useNewBadgePattern}
      ageRecommendation={ageRecommendation}
      isSequestered={isSequestered}
      isDiscoveryBlocked={isDiscoveryBlocked}
    />
  );
};

export default ItemCardCoreContentStatus;
