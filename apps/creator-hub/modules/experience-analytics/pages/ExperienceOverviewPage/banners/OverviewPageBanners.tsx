import React, { FC, useMemo } from 'react';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Grid } from '@rbx/ui';
import { useUniverseResource } from '@modules/experience-analytics-shared';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import UnifiedAlertBanner from '@modules/unified-alerts/components/UnifiedAlertBanner';
import useGetExperienceStatusAlertItem from './hooks/useGetExperienceStatusAlertItem';
import useGetDataIssueAlertItems from './hooks/useGetDataIssueAlertItems';
import useGetUnratedExperienceAlertItem from './hooks/useGetUnratedExperienceAlertItem';
import useBannerStyles from './hooks/useBannerStyles';
import renderAlertItemAsLegacyBanner from './utils/renderAlertItemAsLegacyBanner';

const OverviewPageBanners: FC = () => {
  const {
    classes: { bannerContainer, bannerGrid },
  } = useBannerStyles();

  const { isOverviewUnifiedAlertBannerEnabled } = useFeatureFlagsForNamespace(
    'isOverviewUnifiedAlertBannerEnabled',
    FeatureFlagNamespace.Analytics,
  );

  const { id: universeId } = useUniverseResource();

  // Shared data -- single source of truth for both rendering paths
  const experienceStatusAlert = useGetExperienceStatusAlertItem();
  const dataIssueAlerts = useGetDataIssueAlertItems();
  const unratedExperienceAlert = useGetUnratedExperienceAlertItem();

  const allAlerts = useMemo(() => {
    const items = [...dataIssueAlerts];
    if (experienceStatusAlert) {
      items.unshift(experienceStatusAlert);
    }
    if (isOverviewUnifiedAlertBannerEnabled) {
      if (unratedExperienceAlert) {
        items.push(unratedExperienceAlert);
      }
    }
    return items;
  }, [
    experienceStatusAlert,
    dataIssueAlerts,
    unratedExperienceAlert,
    isOverviewUnifiedAlertBannerEnabled,
  ]);

  const bannerElements = useMemo(() => {
    if (isOverviewUnifiedAlertBannerEnabled) {
      return (
        <Grid item className={bannerGrid}>
          <UnifiedAlertBanner alerts={allAlerts} />
        </Grid>
      );
    }

    return allAlerts.map((item) => (
      <Grid item className={bannerGrid} key={item.id}>
        {renderAlertItemAsLegacyBanner(item, universeId)}
      </Grid>
    ));
  }, [isOverviewUnifiedAlertBannerEnabled, allAlerts, bannerGrid, universeId]);

  return allAlerts.length > 0 ? (
    <Grid container className={bannerContainer} spacing={2}>
      {bannerElements}
    </Grid>
  ) : null;
};

export default withTranslation(OverviewPageBanners, [
  TranslationNamespace.Analytics,
  TranslationNamespace.RegionalPricing,
  TranslationNamespace.Creations,
  TranslationNamespace.DeveloperItem,
]);
