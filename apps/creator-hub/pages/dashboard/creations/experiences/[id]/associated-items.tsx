import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import AssociatedItemsMetadataContainer from '@modules/creations/associatedItems/containers/AssociatedItemsMetadataContainer';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import UrlRedirectProvider from '@modules/experience-analytics-shared/context/UrlRedirectProvider';
import { itemFullNameKeys } from '@modules/miscellaneous/common';

const AssociatedItems: NextLayoutPage = () => {
  return (
    <Authenticated>
      <UrlRedirectProvider>
        <AssociatedItemsMetadataContainer />
      </UrlRedirectProvider>
    </Authenticated>
  );
};

AssociatedItems.getPageLayout = (page, { query }) => {
  const { activeTab } = query;
  const title =
    typeof activeTab === 'string'
      ? (itemFullNameKeys as Record<string, string>)[activeTab]
      : undefined;
  return getCreationsPageLayout(page, { title });
};
AssociatedItems.loggerConfig = { rosId: RosTeams.MonetizationProducts };

export default AssociatedItems;
