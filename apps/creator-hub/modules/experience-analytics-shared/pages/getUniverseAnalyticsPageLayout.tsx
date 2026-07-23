import { ReactNode } from 'react';
import { getCreationsPageLayout, TGetCreationsPageLayoutContext } from '@modules/creations';
import type { AnalyticsNavigationItem } from '@modules/charts-generic';
import getUniverseAnalyticsTabLayout from './getUniverseAnalyticsTabLayout';

export type AnalyticsPageLayoutContext =
  | { navigationItem: AnalyticsNavigationItem; omitPageTitle?: boolean }
  | { noNavigationItem: true; context?: TGetCreationsPageLayoutContext };

export default function getUniverseAnalyticsPageLayout(
  page: NonNullable<ReactNode>,
  layoutContext: AnalyticsPageLayoutContext,
) {
  let context: TGetCreationsPageLayoutContext | undefined;
  if ('navigationItem' in layoutContext) {
    const { navigationItem, omitPageTitle } = layoutContext;
    context = {
      title: (navigationItem.titleOverrideForIAM2 ?? navigationItem.title).key,
      ...(omitPageTitle ? { omitPageTitle: true } : {}),
    };
  } else if ('noNavigationItem' in layoutContext) {
    context = layoutContext.context;
  }
  return getCreationsPageLayout(getUniverseAnalyticsTabLayout(page), context);
}
