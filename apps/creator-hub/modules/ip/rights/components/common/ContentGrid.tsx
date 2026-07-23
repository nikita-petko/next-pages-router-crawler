import React, { FunctionComponent } from 'react';
import { ClaimContentContentTypeEnum, ClaimItemSourceEnum } from '@rbx/clients/rightsV1';
import useContentDetails from '../../hooks/useContentDetails';
import ContentGridLayout from './ContentGridLayout';

interface ContentGridProps {
  contentId?: number;
  contentType?: ClaimContentContentTypeEnum;
  originalLink?: string;
  sourceOfCreation?: ClaimItemSourceEnum;
  isMyCreation?: boolean;
  showCreatorName?: boolean;
}

const ContentGrid: FunctionComponent<React.PropsWithChildren<ContentGridProps>> = ({
  contentId,
  contentType,
  originalLink,
  sourceOfCreation,
  isMyCreation,
  showCreatorName = true,
}) => {
  const { isPending, error, contentDetails } = useContentDetails(contentId!, contentType!);

  return (
    <ContentGridLayout
      contentId={contentId!}
      contentType={contentType!}
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

export default ContentGrid;
