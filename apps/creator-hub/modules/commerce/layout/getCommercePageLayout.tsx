import type { ReactNode } from 'react';
import { analyticsCommerceNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import CommerceProvider from '../context/CommerceProvider';

const DEFAULT_PAGE_COUNT = 500;

const getCommercePageLayout = (page: NonNullable<ReactNode>) => {
  return getAnalyticsPageLayout(
    <CommerceProvider defaultPageCount={DEFAULT_PAGE_COUNT}>{page}</CommerceProvider>,
    { navigationItem: analyticsCommerceNavigationItem },
  );
};

export default getCommercePageLayout;
