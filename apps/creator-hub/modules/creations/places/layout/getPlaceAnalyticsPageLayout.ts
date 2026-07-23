import type { ReactNode } from 'react';
import getUniverseAnalyticsTabLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsTabLayout';
import getPlacePageLayout from './getPlacePageLayout';

export default function getPlaceAnalyticsPageLayout(
  page: NonNullable<ReactNode>,
  placeLayoutProps: { title: string | React.ReactNode },
) {
  return getPlacePageLayout(getUniverseAnalyticsTabLayout(page), placeLayoutProps);
}
