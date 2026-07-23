import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress, Link } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { analyticsNotificationsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import { AnalyticsPageDescription } from '@modules/charts-generic/layout/AnalyticsPageDescription';
import { AnalyticsPageTitle } from '@modules/charts-generic/layout/AnalyticsPageTitle';
import { AnalyticsContextLayerInnerProvider } from '@modules/experience-analytics-shared/context/AnalyticsContextLayerProvider';
import ExperienceAnalyticsTabbedPageLayout from '@modules/experience-analytics-shared/layout/NonConfigurationBasedExperienceAnalyticsTabbedPageLayout';
import getUniverseAnalyticsTabLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsTabLayout';
import { defaultAnalyticsPageSurfaceConfig } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useCreationsCustomSettings } from '../../common/implementations/creationsCustomSettings';
import {
  notificationContentExperienceNotificationAnalyticsDocUrl,
  notificationContentExperienceNotificationDocUrl,
} from '../constants/notificationContent';
import NotificationsMetadataContainerTabs from '../constants/notificationMetadataContainerTabs';
import NotificationsAnalyticsWrapper from '../notificationAnalytics/components/NotificationsAnalyticsWrapper';
import { NotificationsAnalyticsProvider } from '../notificationAnalytics/provider/NotificationsAnalyticsProvider';
import { NotificationsContentProvider } from '../notificationContent/provider/NotificationsContentProvider';
import NotificationsContainer from './NotificationsContainer';

const ExperienceNotificationHyperlink = (chunks: React.ReactNode) => {
  return (
    <Link href={notificationContentExperienceNotificationDocUrl} target='_blank'>
      {chunks}
    </Link>
  );
};

const ExperienceNotificationAnalyticsHyperlink = (chunks: React.ReactNode) => {
  return (
    <Link href={notificationContentExperienceNotificationAnalyticsDocUrl} target='_blank'>
      {chunks}
    </Link>
  );
};

const NotificationsMetadataContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const intl = useTranslation();
  const { translate, translateHTML } = useTranslationWrapper(intl);
  const { isFetched: isCreationsSettingsFetched } = useCreationsCustomSettings();
  const { isLoadingGame } = useCurrentGame();

  const title = (
    <AnalyticsPageTitle
      text={translate(translationKey('Title.Notifications', TranslationNamespace.Notifications))}
    />
  );

  const description = (
    <AnalyticsPageDescription
      text={translateHTML(
        translationKey('Description.NotificationsPage', TranslationNamespace.Notifications),
        [
          {
            opening: 'promptLinkStart',
            closing: 'promptLinkEnd',
            content: ExperienceNotificationHyperlink,
          },
          {
            opening: 'analyticsLinkStart',
            closing: 'analyticsLinkEnd',
            content: ExperienceNotificationAnalyticsHyperlink,
          },
        ],
      )}
    />
  );

  const tabs = useMemo(
    () => [
      {
        key: NotificationsMetadataContainerTabs.Creations,
        label: translate(translationKey('Tab.Creations', TranslationNamespace.Notifications)),
        content: <NotificationsContainer />,
      },
      {
        key: NotificationsMetadataContainerTabs.Analytics,
        label: translate(translationKey('Tab.Analytics', TranslationNamespace.Notifications)),
        content: (
          <AnalyticsContextLayerInnerProvider config={defaultAnalyticsPageSurfaceConfig}>
            <NotificationsAnalyticsWrapper />
          </AnalyticsContextLayerInnerProvider>
        ),
      },
    ],
    [translate],
  );

  const isLoading = !isCreationsSettingsFetched || isLoadingGame;

  return isLoading ? (
    <EmptyGrid>
      <CircularProgress color='secondary' />
    </EmptyGrid>
  ) : (
    getUniverseAnalyticsTabLayout(
      <NotificationsAnalyticsProvider>
        <NotificationsContentProvider>
          <ExperienceAnalyticsTabbedPageLayout
            title={title}
            description={description}
            controls={[]}
            tabs={tabs}
            navigationItem={analyticsNotificationsNavigationItem}
          />
        </NotificationsContentProvider>
      </NotificationsAnalyticsProvider>,
    )
  );
};

export default withTranslation(NotificationsMetadataContainer, [
  TranslationNamespace.Error,
  TranslationNamespace.Notifications,
]);
