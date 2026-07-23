import { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { analyticsDataStoresNavigationItem } from '@modules/charts-generic';
import DataStoresMainPageContainer from '@modules/data-stores-manager/pages/DataStoresMainPageContainer';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';

const DataStores: NextLayoutPage = () => {
  return (
    <Authenticated>
      <DataStoresMainPageContainer />
    </Authenticated>
  );
};

DataStores.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsDataStoresNavigationItem });

export default DataStores;
