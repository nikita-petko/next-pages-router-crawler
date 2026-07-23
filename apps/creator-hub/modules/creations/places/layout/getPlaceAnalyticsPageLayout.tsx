import { ReactNode } from 'react';
import { getUniverseAnalyticsTabLayout } from '@modules/experience-analytics-shared';
import getPlacePageLayout from './getPlacePageLayout';

export default function getPlaceAnalyticsPageLayout(
  page: NonNullable<ReactNode>,
  placeLayoutProps: { title: string },
) {
  return getPlacePageLayout(getUniverseAnalyticsTabLayout(page), placeLayoutProps);
}
