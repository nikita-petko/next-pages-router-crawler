import { FunctionComponent } from 'react';
import { ClaimItem } from '@rbx/clients/rightsV1';
import useClaimItemContentDetails from '../../hooks/useClaimItemContentDetails';
import { ClaimContentRole } from '../../types/types';
import ContentGridLayout from './ContentGridLayout';

interface ClaimItemContentGridProps {
  claimItem: ClaimItem;
  role: ClaimContentRole;
  isMyCreation?: boolean;
  showCreatorName?: boolean;
}

const ClaimItemContentGrid: FunctionComponent<ClaimItemContentGridProps> = ({
  claimItem,
  role,
  isMyCreation,
  showCreatorName,
}) => {
  const {
    contentId,
    contentType,
    originalLink,
    sourceOfCreation,
    contentDetails,
    isPending,
    error,
  } = useClaimItemContentDetails(claimItem, role);

  return (
    <ContentGridLayout
      contentId={contentId}
      contentType={contentType}
      originalLink={originalLink}
      sourceOfCreation={sourceOfCreation}
      isMyCreation={isMyCreation}
      showCreatorName={showCreatorName}
      isPending={isPending}
      error={error}
      contentDetails={contentDetails}
    />
  );
};

export default ClaimItemContentGrid;
