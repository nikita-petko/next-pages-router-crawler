import { AnalyticsNavigationItem, AnalyticsPageTitle } from '@modules/charts-generic';
import {
  TranslationKey,
  translationKey,
  withNamespaceSwitchedTranslation,
} from '@modules/analytics-translations';
import { urls } from '@modules/miscellaneous/common';
import CreatorDashboardLink from '@modules/miscellaneous/common/components/CreatorDashboardLink';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import React, { FC, useMemo } from 'react';
import { useUniverseResource } from '../../hooks/useChartResourceProvider';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';

type ExperienceAnalyticsFullScreenModeTitleOrBackLinkProps = {
  prevPage: AnalyticsNavigationItem;
  titleKey: TranslationKey;
  priorUri?: string | null;
  showTitle?: boolean;
};

const ExperienceAnalyticsFullScreenModeTitleOrBackLink: FC<
  ExperienceAnalyticsFullScreenModeTitleOrBackLinkProps
> = ({ prevPage, titleKey, priorUri, showTitle }) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const { id: universeId } = useUniverseResource();

  const href = useMemo(() => {
    if (priorUri) {
      return priorUri;
    }
    return urls.creatorHub.dashboard.getExperienceOverviewUrl(universeId);
  }, [priorUri, universeId]);

  const backLinkText = useMemo(() => {
    const pageTitle = translate(prevPage.title);
    return translate(translationKey('Action.BackToPreviousPage', TranslationNamespace.Analytics), {
      pageTitle,
    });
  }, [prevPage.title, translate]);

  if (showTitle) {
    return <AnalyticsPageTitle text={translate(titleKey)} />;
  }
  return <CreatorDashboardLink href={href}>{`< ${backLinkText}`}</CreatorDashboardLink>;
};
export default withNamespaceSwitchedTranslation(ExperienceAnalyticsFullScreenModeTitleOrBackLink, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Navigation,
]);
