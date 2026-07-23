import React, { FunctionComponent } from 'react';
import { Skeleton } from '@rbx/ui';
import { ReleaseStatus } from '@rbx/clients/experienceReleases';
import { SearchCreatorType } from '@rbx/clients/universesApi';
import { useSettings } from '@modules/settings';
import { ReasonEnum, SelectStatusEnum, UniverseEligibility } from '@rbx/clients/coreContentApi';
import PrivacyStatusBadge from './PrivacyStatusBadge';

export interface ItemCardCoreContentStatusProps {
  universeId: number;
  contentMaturity?: string;
  isActive: boolean;
  isLoading: boolean;
  releaseStatus?: ReleaseStatus;
  isFriendsOnly?: boolean;
  creatorType?: SearchCreatorType;
  coreContentEligibility?: UniverseEligibility;
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
  creatorType,
  coreContentEligibility,
}) => {
  const { settings } = useSettings();
  const enablePublishingPermissions = settings.enableCoreContentStatusLabelLink;

  if (isLoading) {
    return <Skeleton width='50%' />;
  }

  const isBeta = releaseStatus === ReleaseStatus.Beta;
  const isSelect =
    !!enablePublishingPermissions &&
    coreContentEligibility?.selectStatus === SelectStatusEnum.Eligible;
  const isSelectAtRisk = isSelect && coreContentEligibility?.reasons.includes(ReasonEnum.Threshold);

  return (
    <PrivacyStatusBadge
      universeId={universeId}
      isActive={isActive}
      isFriendsOnly={isFriendsOnly}
      creatorType={creatorType}
      contentMaturity={contentMaturity}
      isBeta={!!isBeta}
      isSelect={isSelect}
      isSelectAtRisk={isSelectAtRisk}
    />
  );
};

export default ItemCardCoreContentStatus;
