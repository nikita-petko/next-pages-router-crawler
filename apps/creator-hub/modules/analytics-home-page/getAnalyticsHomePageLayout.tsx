import type { ReactNode } from 'react';
import React from 'react';
import { buildTitle, HubMeta } from '@rbx/creator-hub-history';
import { useTranslation, withTranslation } from '@rbx/intl';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import AnalyticsHomePageWrapper from '@modules/experience-analytics-shared/pages/AnalyticsHomePageWrapper';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import AnalyticsLeftRail, {
  ANALYTICS_NAVIGATION_NAMESPACES,
  useAnalyticsNavigation,
} from './AnalyticsLeftRail';

const AnalyticsHomePageHeading: React.FC = () => {
  const { translateWithNamespace } = useTranslation();
  const { activeItem } = useAnalyticsNavigation();
  const analyticsLabel = translateWithNamespace(
    TranslationNamespace.Navigation,
    'Heading.Analytics',
  );
  const heading = activeItem?.label ?? analyticsLabel;

  return (
    <>
      <HubMeta
        title={buildTitle(heading)}
        seoTitle={buildTitle(analyticsLabel, activeItem?.label)}
      />
      <h1 className='text-heading-large margin-none'>{heading}</h1>
    </>
  );
};

export const AnalyticsHomePageTitle = withTranslation(
  AnalyticsHomePageHeading,
  ANALYTICS_NAVIGATION_NAMESPACES,
);

export default function getAnalyticsHomePageLayout(page: NonNullable<ReactNode>) {
  return (
    <CreatorHubLayout
      title={<AnalyticsHomePageTitle />}
      noBreadCrumbs
      secondaryRail={<AnalyticsLeftRail />}
      secondarySize='small'>
      <AnalyticsHomePageWrapper>{page}</AnalyticsHomePageWrapper>
    </CreatorHubLayout>
  );
}
