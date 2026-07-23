import type { FC } from 'react';
import { useMemo } from 'react';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { withTranslation } from '@rbx/intl';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import { useRawAnalyticsQueryParams } from '@modules/experience-analytics-shared/context/rawQueryParams/RawAnalyticsQueryParamsProvider';
import { getFilterValueForDimension } from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/filterUtils';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import BreadcrumbItemType from '@modules/navigation/layout/enums/BreadcrumbsItemType';
import useBreadcrumbRegistration from '@modules/navigation/layout/hooks/useBreadcrumbRegistration';
import getJourneysPageConfig from './config/journeysPageConfig';

const JourneysPageContent: FC = () => {
  const { filters } = useRawAnalyticsQueryParams();
  const journeyName =
    getFilterValueForDimension(filters, RAQIV2Dimension.JourneyName, null) ?? undefined;

  useBreadcrumbRegistration(BreadcrumbItemType.AnalyticsJourneyDetail, journeyName);

  const config = useMemo(() => getJourneysPageConfig(), []);

  return <CreatorAnalyticsLayout config={config} />;
};

export default withTranslation(JourneysPageContent, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
]);
