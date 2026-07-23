import {
  AnalyticsPageDescription,
  AnalyticsPageTitle,
  analyticsNotificationsNavigationItem,
} from '@modules/charts-generic';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import {
  AnalyticsContextLayerInnerProvider,
  ExperienceAnalyticsTabbedPageLayout,
  getUniverseAnalyticsTabLayout,
  defaultAnalyticsPageSurfaceConfig,
} from '@modules/experience-analytics-shared';
import { EmptyGrid } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress, Link } from '@rbx/ui';
import React, { FunctionComponent, useMemo } from 'react';
import {
  notificationContentExperienceNotificationAnalyticsDocUrl,
  notificationContentExperienceNotificationDocUrl,
} from '../constants/notificationContent';
import NotificationsAnalyticsWrapper from '../notificationAnalytics/components/NotificationsAnalyticsWrapper';
import { NotificationsAnalyticsProvider } from '../notificationAnalytics/provider/NotificationsAnalyticsProvider';
import { NotificationsContentProvider } from '../notificationContent/provider/NotificationsContentProvider';
import NotificationsContainer from './NotificationsContainer';
import { useCreationsCustomSettings } from '../../common/implementations/creationsCustomSettings';
import NotificationsMetadataContainerTabs from '../constants/notificationMetadataContainerTabs';

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

const NotificationsMetadataContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
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
          {/* eslint-disable-next-line deprecation/deprecation -- need to update this file for am adhoc fix, will migrate this later */}
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
