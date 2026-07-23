import React from 'react';
import { itemconfigurationClient } from '@modules/clients';
import { PageNotFound } from '@modules/miscellaneous/error';
import useGetMetadata from '@modules/react-query/itemConfiguration/itemConfigurationQueries';
import ItemAnalyticsPageContext from '@modules/experience-monetization/context/ItemAnalyticsPageContext';
import AvatarCreationTokensPageContent from './AvatarCreationTokensPageContent';

function GetAvatarCreationTokensPage() {
  const { data: collectiblesMetadata } = useGetMetadata(itemconfigurationClient);

  // If the feature is not enabled, display "Page not found"
  return collectiblesMetadata !== undefined &&
    'isAvatarCreationTokensUIEnabled' in collectiblesMetadata &&
    collectiblesMetadata.isAvatarCreationTokensUIEnabled ? (
    <ItemAnalyticsPageContext>
      <AvatarCreationTokensPageContent />
    </ItemAnalyticsPageContext>
  ) : (
    <PageNotFound />
  );
}

const AvatarCreationTokensPageContentContainer = () => {
  return GetAvatarCreationTokensPage();
};

export default AvatarCreationTokensPageContentContainer;
