import { memo } from 'react';
import type { NextLayoutPage } from 'next';
import { withTranslation } from '@rbx/intl';
import { analyticsItemFreeAvatarsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import { useCreationsCustomSettings } from '@modules/creations/common/implementations/creationsCustomSettings';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import FreeAvatarsPageContent from '@modules/free-avatars/FreeAvatarsPageContent';
import PageLoading from '@modules/miscellaneous/components/PageLoading';
import { PageNotFound } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import PageTitle from '@modules/monetization-shared/title';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';

const FreeAvatarsTitle = withTranslation(
  memo(function FreeAvatarsTitle() {
    const { universeId } = useUniverseId();
    const { settings, isFetched: isSettingsFetched } = useSettings();
    const { isFreeAvatarSystemEnabled, isFetched: isCustomSettingsFetched } =
      useCreationsCustomSettings();

    if (!universeId) {
      return null;
    }

    if (isSettingsFetched && isCustomSettingsFetched && !isFreeAvatarSystemEnabled) {
      return null;
    }

    return (
      <PageTitle
        titleKey={analyticsItemFreeAvatarsNavigationItem.title.key}
        subtitleKey='Description.FreeAvatarsPageSubtitle'
        subtitleLink={settings.freeAvatarDocumentationUrl}
      />
    );
  }),
  [TranslationNamespace.Creations, TranslationNamespace.Navigation],
);

const FreeAvatarsPage: NextLayoutPage = () => {
  const { universeId } = useUniverseId();
  const { isFreeAvatarSystemEnabled, isFetched: isCustomSettingsFetched } =
    useCreationsCustomSettings();

  if (!isCustomSettingsFetched) {
    return <PageLoading />;
  }

  if (!isFreeAvatarSystemEnabled || !universeId) {
    return <PageNotFound />;
  }

  return <FreeAvatarsPageContent universeId={universeId} />;
};

FreeAvatarsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, {
    noNavigationItem: true,
    context: { title: <FreeAvatarsTitle /> },
  });
FreeAvatarsPage.loggerConfig = { rosId: RosTeams.AvatarMarketplace };

export default FreeAvatarsPage;
