import type { FC } from 'react';
import { useMemo } from 'react';
import { withTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import UnifiedAlertBanner from '@modules/unified-alerts/components/UnifiedAlertBanner';
import useBannerStyles from './hooks/useBannerStyles';
import useGetDataIssueAlertItems from './hooks/useGetDataIssueAlertItems';
import useGetExperienceStatusAlertItem from './hooks/useGetExperienceStatusAlertItem';
import useGetUnratedExperienceAlertItem from './hooks/useGetUnratedExperienceAlertItem';

const OverviewPageBanners: FC = () => {
  const {
    classes: { bannerContainer, bannerGrid },
  } = useBannerStyles();

  const {
    params: { enableAudienceReachOnOverviewPage },
    isFetched: isIxpFetched,
  } = useIXPParameters(IXPLayers.CreatorHubCreationsPermission);

  const experienceStatusAlert = useGetExperienceStatusAlertItem();
  const dataIssueAlerts = useGetDataIssueAlertItems();
  const unratedExperienceAlert = useGetUnratedExperienceAlertItem();

  const allAlerts = useMemo(() => {
    const items = [...dataIssueAlerts];
    if (experienceStatusAlert) {
      items.unshift(experienceStatusAlert);
    }
    if (!enableAudienceReachOnOverviewPage && isIxpFetched && unratedExperienceAlert) {
      items.push(unratedExperienceAlert);
    }
    return items;
  }, [
    experienceStatusAlert,
    dataIssueAlerts,
    unratedExperienceAlert,
    enableAudienceReachOnOverviewPage,
    isIxpFetched,
  ]);

  return allAlerts.length > 0 ? (
    <Grid container className={bannerContainer} spacing={2}>
      <Grid item className={bannerGrid}>
        <UnifiedAlertBanner alerts={allAlerts} />
      </Grid>
    </Grid>
  ) : null;
};

export default withTranslation(OverviewPageBanners, [
  TranslationNamespace.Analytics,
  TranslationNamespace.RegionalPricing,
  TranslationNamespace.Creations,
  TranslationNamespace.DeveloperItem,
]);
