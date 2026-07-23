import Authenticated from '@modules/authentication/Authenticated';
import { getCreationsPageLayout, AssociatedItemsMetadataContainer } from '@modules/creations';
import { NextLayoutPage } from 'next';
import { UrlRedirectProvider } from '@modules/experience-analytics-shared';
import { Item, itemFullNameKeys } from '@modules/miscellaneous/common';

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
  const title = itemFullNameKeys[activeTab as Item];
  return getCreationsPageLayout(page, { title });
};

export default AssociatedItems;
