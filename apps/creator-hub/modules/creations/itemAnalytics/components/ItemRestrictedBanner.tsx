import {
  ContentRestrictionBanner,
  useContentRestriction,
} from '@modules/experience-analytics-shared';
import React from 'react';

const ItemRestrictedBanner = ({
  contentId,
  isBundle = false,
}: {
  contentId: string;
  isBundle?: boolean;
}) => {
  const contentType = isBundle ? 'bundle' : 'asset';
  const { shouldDisplay, isLoading } = useContentRestriction(contentId, contentType);

  if (isLoading || !shouldDisplay) {
    return null;
  }

  return (
    <div style={{ paddingBottom: '32px' }}>
      <ContentRestrictionBanner contentId={contentId} contentType={contentType} />
    </div>
  );
};

export default ItemRestrictedBanner;
