import type { ReactNode } from 'react';
import { Translate } from '@rbx/intl';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import AnalyticsHomePageWrapper from '@modules/experience-analytics-shared/pages/AnalyticsHomePageWrapper';

export default function getAnalyticsHomePageLayout(page: NonNullable<ReactNode>) {
  return (
    <CreatorHubLayout
      title={
        <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Analytics' />
      }
      noBreadCrumbs>
      <AnalyticsHomePageWrapper>{page}</AnalyticsHomePageWrapper>
    </CreatorHubLayout>
  );
}
