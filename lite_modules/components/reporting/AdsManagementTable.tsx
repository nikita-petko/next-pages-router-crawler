import { AdPolicyReviewLabelType } from '@rbx/ads-moderation-ui';

import GenericNoDataPage from '@components/common/GenericNoDataPage';
import AdTableRow from '@components/reporting/AdTableRow';
import useCampaignManagementTableStyles from '@components/reporting/CampaignManagementTable.styles';
import GenericManagementTable from '@components/reporting/GenericManagementTable';
import { ServerCampaignObjectiveType, ServerPaymentType } from '@constants/campaign';
import { MAX_DISPLAYABLE_ADS } from '@constants/campaignBuilder';
import { EntityType } from '@constants/entity';
import { getAdTableHeadCells } from '@constants/headCells';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useAppStore } from '@stores/appStoreProvider';
import { NewFlowStoreType, useNewFlowStore } from '@stores/newFlowStoreProvider';
import { Ad } from '@type/ad';
import { Campaign, GetAdStatusResponseType } from '@type/campaign';
import { GenericSortableRowData, UnsortableRowData } from '@type/genericManagementTable';
import { SimplifiedUploadedCreative } from '@type/uploadedCreative';
import { GetAdStatusTextForAd } from '@utils/displayStatus';
import { GetCreativesForAd, IsOffPlatformAd } from '@utils/offPlatformAdUtils';
import { buildReachTablePreviewDataFromAd } from '@utils/reachSponsoredAdUtils';

// === Regular Ads Logic ===
const createRegularAdRows = (
  ads: Ad[],
  adStatuses: Map<string, GetAdStatusResponseType>,
): GenericSortableRowData[] =>
  ads.map((ad: Ad) => ({
    click_count: ad.performance?.click_count || 0,
    click_through_rate: ad.performance?.click_through_rate || 0,
    cost_per_play_usd: ad.performance?.cost_per_play_usd || 0,
    display_spending_usd: ad.performance?.display_spending_usd || 0,
    id: ad.id,
    impression: ad.performance?.impression || 0,
    name: ad.name,
    play_count: ad.performance?.play_count || 0,
    status_text: GetAdStatusTextForAd(ad, adStatuses),
    total_play_time_hours_7d: ad.performance?.total_play_time_hours_7d || 0,
    total_robux_revenue_30d: ad.performance?.total_robux_revenue_30d || 0,
    updated_timestamp_ms: ad.updated_timestamp_ms || 0,
  }));

const createRegularAdUnsortableData = (
  ads: Ad[],
  updatedAdStatuses: Map<string, GetAdStatusResponseType>,
  campaign: Campaign,
  campaignToggleLoadingMap: Map<string, boolean>,
  adToggleLoadingMap: Map<string, boolean>,
  adTogglingShouldBeEnabled: (paymentType: ServerPaymentType) => { togglingEnabled: boolean },
  campaignHasOffPlatformAds: boolean,
  offPlatformTooltip: string,
  uploadedCreatives: SimplifiedUploadedCreative[] | undefined,
): [string, UnsortableRowData][] =>
  ads.map((ad: Ad) => {
    const adStatus = updatedAdStatuses.get(ad.id);
    const paymentType = ad.performance?.payment_type || campaign.payment_type;
    let toggleState = { isDisabled: true, isOn: false };
    if (adStatus) {
      const disabledWhileLoading =
        campaignToggleLoadingMap.get(campaign?.id) || adToggleLoadingMap.get(ad.id) || false;
      toggleState = {
        isDisabled:
          adStatus.disabled ||
          !adTogglingShouldBeEnabled(paymentType).togglingEnabled ||
          disabledWhileLoading,
        isOn: adStatus.is_on,
      };
    }

    const matchedCreatives = GetCreativesForAd(ad, uploadedCreatives);

    const isCurrentAdOffPlatform = IsOffPlatformAd(ad);

    return [
      ad.id,
      {
        adPolicyReviewLabels:
          ad.ad_policy_review_label === AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_UNSPECIFIED
            ? []
            : [ad.ad_policy_review_label],
        adPolicyReviewUpdatedTimestampMs: ad.ad_policy_review_updated_timestamp_ms || 0,
        assetId: ad.sponsored_universe_ad_metadata?.asset_metadata?.asset_id || 0,
        campaignHasOffPlatformAds,
        offPlatformCreatives: matchedCreatives,
        paymentType,
        platform: ad.platform || 'Roblox',
        reachTablePreview:
          campaign.objective === ServerCampaignObjectiveType.REACH && !isCurrentAdOffPlatform
            ? buildReachTablePreviewDataFromAd(ad)
            : undefined,
        statusText: GetAdStatusTextForAd(ad, updatedAdStatuses),
        toggleDisabledTooltip: isCurrentAdOffPlatform ? offPlatformTooltip : undefined,
        toggleState,
        universeId: campaign.universe_id,
      },
    ] as [string, UnsortableRowData];
  });

const AdsManagementTable = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Report);
  const adsState = useNewFlowStore(
    (state: NewFlowStoreType) => state.campaignDetailsState.adsState,
  );
  const campaign = useNewFlowStore(
    (state: NewFlowStoreType) => state.campaignDetailsState.campaign,
  );
  const uploadedCreatives = useNewFlowStore(
    (state: NewFlowStoreType) => state.campaignDetailsState.uploadedCreatives,
  );
  const { adStatuses, updatedAdStatuses } = useNewFlowStore(
    (state: NewFlowStoreType) => state.statusesState,
  );
  const { adToggleLoadingMap, campaignToggleLoadingMap } = useNewFlowStore(
    (state: NewFlowStoreType) => state.tableRowsState,
  );
  const adTogglingShouldBeEnabled = useAppStore((state) => state.adTogglingShouldBeEnabled);

  const {
    classes: { campaignTable },
  } = useCampaignManagementTableStyles();

  const campaignHasOffPlatformAds = Boolean(adsState.data?.some(IsOffPlatformAd));

  const hasRegularAds = adsState.data && adsState.data.length > 0;

  // Handle actual errors first
  if (adsState.isError || !campaign) {
    return (
      <GenericNoDataPage
        subtitle={translate('Description.FailedToFetchTryRefreshing')}
        title={translate('Heading.UnableToLoadAds')}
      />
    );
  }

  // Handle case where off-platform campaign has reporting disabled
  if (campaign?.off_platform_request_id && !campaign?.is_reporting_enabled) {
    return (
      <GenericNoDataPage
        iconName='icon-regular-eye-slash'
        subtitle={translate('Description.ReportingDisabledOffPlatform')}
        title={translate('Heading.ReportingDisabled')}
      />
    );
  }

  // Handle case where off-platform campaign has no ads yet
  if (!adsState.isLoading && !hasRegularAds && campaign?.off_platform_request_id) {
    return (
      <GenericNoDataPage
        subtitle={translate('Description.MetricsWillAppear')}
        title={translate('Heading.NoPublishedOffPlatformAds')}
      />
    );
  }

  // Handle case where regular campaign has no ads
  if (!adsState.isLoading && !hasRegularAds) {
    return (
      <GenericNoDataPage
        subtitle={translate('Description.FailedToFetchTryRefreshing')}
        title={translate('Heading.UnableToLoadAds')}
      />
    );
  }
  const headCells = getAdTableHeadCells(
    campaignHasOffPlatformAds, // Include platform column when there are any off-platform ads
    false, // Always show toggle column (we disable individual toggles for off-platform ads)
  );

  // === Main Flow: Regular Roblox Ads ===
  const regularAdRows = createRegularAdRows(adsState.data || [], adStatuses);
  const regularAdUnsortableData = createRegularAdUnsortableData(
    adsState.data || [],
    updatedAdStatuses,
    campaign,
    campaignToggleLoadingMap,
    adToggleLoadingMap,
    adTogglingShouldBeEnabled,
    campaignHasOffPlatformAds,
    translate('Description.OffPlatformAdsCannotBePaused'),
    uploadedCreatives,
  );

  const rows: GenericSortableRowData[] = regularAdRows;
  const adIdToUnsortableData = new Map<string, UnsortableRowData>(regularAdUnsortableData);

  return (
    <GenericManagementTable
      className={campaignTable}
      defaultRowsPerPage={MAX_DISPLAYABLE_ADS}
      entityIdToUnsortableData={adIdToUnsortableData}
      entityType={EntityType.ENTITY_TYPE_AD}
      headCells={headCells}
      isLoading={adsState.isLoading}
      RowElement={AdTableRow}
      showFooter={false}
      sortableData={rows}
      tableId='campaignDrawer'
    />
  );
};

export default AdsManagementTable;
