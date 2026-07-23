import { useEffect, useMemo } from 'react';

import DismissibleTooltip from '@components/common/DismissibleTooltip';
import GenericNoDataPage from '@components/common/GenericNoDataPage';
import useCampaignManagementTableStyles from '@components/reporting/CampaignManagementTable.styles';
import CampaignTableRow from '@components/reporting/CampaignTableRow';
import GenericManagementTable from '@components/reporting/GenericManagementTable';
import { defaultTimeZone } from '@constants/app';
import { ServerDetailedTargetingMatchType, ServerPaymentType } from '@constants/campaign';
import { CampaignDisplayStatusType } from '@constants/campaignStatus';
import { EntityType } from '@constants/entity';
import { getCampaignTableHeadCells } from '@constants/headCells';
import { TranslationNamespace } from '@constants/localization';
import ReportingViewType from '@constants/reportingViewType';
import { Tooltips } from '@constants/tooltips';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import {
  CampaignCreatorStoreType,
  useCampaignCreatorStore,
} from '@stores/campaignCreatorStoreProvider';
import { NewFlowStoreType, useNewFlowStore } from '@stores/newFlowStoreProvider';
import { Campaign } from '@type/campaign';
import { GenericSortableRowData, UnsortableRowData } from '@type/genericManagementTable';
import { GetCancelTooltipTitle, GetEditTooltipTitle } from '@utils/campaignDetails';
import { MicroUsdToUsdStringRoundedDown } from '@utils/currency';
import { FormatDateToMMMDYYYY, GetDurationInDays } from '@utils/date';
import {
  GetBackendCampaignStatusText,
  GetCampaignStatusText,
  GetToggleDisabled,
} from '@utils/displayStatus';
import { GetTimezoneObjFromEnum, GetValidatedTimezoneDbName } from '@utils/timezone';

// Generally performance always has payment type (even if campaign doesn't have stats), but in case it doesn't, we fallback to the payment type stored on the campaign
const getCampaignPaymentType = (campaign: Campaign) =>
  campaign.performance?.payment_type || campaign.payment_type;

interface CampaignManagementTableProps {
  showCreatorColumn?: boolean;
}

const CampaignManagementTable = ({ showCreatorColumn = false }: CampaignManagementTableProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Report);
  const campaignsState = useNewFlowStore((state: NewFlowStoreType) => state.campaignsState);
  const { campaignStatuses, updatedCampaignStatuses } = useNewFlowStore(
    (state: NewFlowStoreType) => state.statusesState,
  );
  const campaignToggleLoadingMap = useNewFlowStore(
    (state: NewFlowStoreType) => state.tableRowsState.campaignToggleLoadingMap,
  );
  const campaignToggleLoadingDueToAdToggleMap = useNewFlowStore(
    (state: NewFlowStoreType) => state.tableRowsState.campaignToggleLoadingDueToAdToggleMap,
  );
  const filteredIdsState = useNewFlowStore((state: NewFlowStoreType) => state.filteredIdsState);
  const campaignNameSearchIsError = useNewFlowStore(
    (state: NewFlowStoreType) => state.campaignNameFilterState.isError,
  );
  const cancelCampaignTimeBufferMs = useAppStore(
    (state: AppStoreType) => state.appMetadataState.data?.cancelCampaignTimeBufferMs,
  );
  const adTogglingShouldBeEnabled = useAppStore((state) => state.adTogglingShouldBeEnabled);
  const { timezoneDbName: rawTimezoneDbName } = useAppStore((state) =>
    GetTimezoneObjFromEnum(
      state.advertiserState?.data?.organization?.time_zone || defaultTimeZone.value,
    ),
  );
  const timezoneDbName = GetValidatedTimezoneDbName(rawTimezoneDbName);

  const adCreditBalance = useAppStore(
    (state) => state.adCreditState.data?.ad_credit_balance_in_micro || 0,
  );
  const currentReportingView = useNewFlowStore(
    (state: NewFlowStoreType) =>
      state.reportingViewState?.currentSelection ?? ReportingViewType.REPORTING_VIEW_TYPE_DEFAULT,
  );
  const creatorProfilesByUserId = useCampaignCreatorStore(
    (state: CampaignCreatorStoreType) => state.creatorProfilesByUserId,
  );
  const getCampaignCreatorsBatch = useCampaignCreatorStore(
    (state: CampaignCreatorStoreType) => state.getCampaignCreatorsBatch,
  );
  const isCampaignRoasEnabled = useAppStore(
    (state: AppStoreType) => state.appMetadataState?.data?.isCampaignRoasEnabled ?? false,
  );

  const {
    classes: { campaignTable, nameMeasureAnchor, nameMeasureText },
  } = useCampaignManagementTableStyles();

  const headCells = getCampaignTableHeadCells({
    includeRoas: isCampaignRoasEnabled,
    showCreatorColumn,
  });
  const isLoading = campaignsState.isLoading || filteredIdsState.isLoading;

  const { filteredCampaignIds } = filteredIdsState;
  const filteredCampaigns = useMemo(() => {
    const data = campaignsState.data || [];
    if (filteredCampaignIds === undefined) {
      return data;
    }
    return data.filter((row) => filteredCampaignIds.has(row.id));
  }, [campaignsState.data, filteredCampaignIds]);

  const creatorUserIds = useMemo(() => {
    if (!showCreatorColumn) {
      return [];
    }

    return filteredCampaigns
      .map((campaign) => campaign.creator_user_id)
      .filter((userId): userId is number => userId !== undefined);
  }, [filteredCampaigns, showCreatorColumn]);

  useEffect(() => {
    if (creatorUserIds.length === 0) {
      return;
    }

    getCampaignCreatorsBatch(creatorUserIds).catch(() => undefined);
  }, [creatorUserIds, getCampaignCreatorsBatch]);

  const shouldMeasureNameColumn =
    !campaignsState.isError && !campaignNameSearchIsError && filteredCampaigns.length > 0;

  const firstColumnMeasurement = {
    anchorClassName: nameMeasureAnchor,
    enabled: shouldMeasureNameColumn,
    textClassName: nameMeasureText,
  };

  // Retention rows are visually restricted in every reporting view except "Recent Users".
  // We surface a one-time DismissibleTooltip on the topmost retention row of the current page to
  // explain why stats are hidden.
  const shouldAnchorRetentionTooltip =
    currentReportingView !== ReportingViewType.REPORTING_VIEW_TYPE_RECENT_USERS;

  const getRetentionTooltipAnchorRowId = (visibleRows: GenericSortableRowData[]) => {
    if (!shouldAnchorRetentionTooltip) {
      return undefined;
    }
    return visibleRows.find(
      (row) =>
        row.detailed_targeting_match_type ===
        ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_RETENTION,
    )?.id;
  };

  if (campaignsState.isError || campaignNameSearchIsError) {
    return (
      <GenericNoDataPage
        subtitle={translate('Description.FailedToFetchTryRefreshing')}
        title={translate('Heading.UnableToLoadCampaigns')}
      />
    );
  }

  if (!isLoading && filteredCampaigns.length === 0) {
    return (
      <GenericNoDataPage
        subtitle={translate('Description.NoResultsFound')}
        title={translate('Heading.NoCampaigns')}
      />
    );
  }

  if (isLoading) {
    return (
      <GenericManagementTable
        className={campaignTable}
        entityIdToUnsortableData={new Map()}
        entityType={EntityType.ENTITY_TYPE_CAMPAIGN}
        firstColumnMeasurement={firstColumnMeasurement}
        getTooltipAnchorRowId={getRetentionTooltipAnchorRowId}
        headCells={headCells}
        isLoading
        RowElement={CampaignTableRow}
        showFooter
        sortableData={[]}
      />
    );
  }

  const rows: GenericSortableRowData[] = filteredCampaigns.map((campaign: Campaign) => {
    const creatorProfile =
      campaign.creator_user_id === undefined
        ? undefined
        : creatorProfilesByUserId[campaign.creator_user_id]?.data;

    return {
      click_count: campaign.performance?.click_count || 0,
      click_through_rate: campaign.performance?.click_through_rate || 0,
      cost_per_play_usd: campaign.performance?.cost_per_play_usd || 0,
      created_timestamp_ms: campaign.created_timestamp_ms,
      creator_avatar_url: creatorProfile?.avatarUrl,
      creator_username: creatorProfile?.username ?? '',
      date_modified: showCreatorColumn
        ? FormatDateToMMMDYYYY({
            timestamp: campaign.updated_timestamp_ms,
            timezone: timezoneDbName,
          })
        : undefined,
      detailed_targeting_match_type: campaign.detailed_targeting_match_type,
      // Reporting stats || 0 to allow accurate number sorting
      display_spending_usd: campaign.performance?.display_spending_usd || 0,
      id: campaign.id,
      impression: campaign.performance?.impression || 0,
      is_auto_reload_ad_credit_enabled: campaign.is_auto_reload_ad_credit_enabled || false,
      is_off_platform_request: campaign.is_off_platform_request || false,
      is_reporting_enabled: campaign.is_reporting_enabled || false,
      name: campaign.name,
      objective: campaign.objective,
      play_count: campaign.performance?.play_count || 0,
      // Preserve undefined so missing ROAS (zero-spend / failed metrics) stays
      // distinct from a real 0.0 (spend with no revenue). AMSv2 leaves Roas unset
      // in the former case and sets 0 in the latter.
      roas: campaign.performance?.roas,
      status_text: GetBackendCampaignStatusText(campaignStatuses, campaign.id),
      total_play_time_hours_7d: campaign.performance?.total_play_time_hours_7d || 0,
      total_robux_revenue_30d: campaign.performance?.total_robux_revenue_30d || 0,
      updated_timestamp_ms: campaign.updated_timestamp_ms || 0,
    };
  });

  const campaignIdToUnsortableData = new Map<string, UnsortableRowData>(
    filteredCampaigns.map((campaign: Campaign) => {
      const campaignStatus = updatedCampaignStatuses.get(campaign.id);
      const togglingShouldBeEnabled = adTogglingShouldBeEnabled(campaign.payment_type);
      const toggleDisabled = GetToggleDisabled({
        adTogglingShouldBeEnabled: togglingShouldBeEnabled.togglingEnabled,
        campaignStatus,
        campaignToggleLoadingDueToAdToggleMap,
        campaignToggleLoadingMap,
      });
      const statusText = GetCampaignStatusText(campaignStatus?.display_status);
      let effectiveDailyBudget;
      if (campaign.budget.daily_budget_micro_usd) {
        effectiveDailyBudget = campaign.budget.daily_budget_micro_usd;
      } else if (campaign.budget.lifetime_budget_micro_usd) {
        const campaignDuration = GetDurationInDays(
          campaign.start_timestamp_ms,
          campaign.end_timestamp_ms,
          timezoneDbName,
        );
        effectiveDailyBudget = campaign.budget.lifetime_budget_micro_usd / campaignDuration;
      }

      const requiredAdditionalAdCredit = (effectiveDailyBudget || 0) - adCreditBalance;

      const disableToggleBecauseInsufficientAdCredit =
        (campaignStatus?.display_status ===
          CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_AUTO_PAUSED ||
          campaignStatus?.display_status ===
            CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_PAUSED) &&
        campaign.payment_type === ServerPaymentType.PAYMENT_TYPE_ADS_CREDIT &&
        requiredAdditionalAdCredit > 0;

      const insufficientAdCreditAmount = disableToggleBecauseInsufficientAdCredit
        ? MicroUsdToUsdStringRoundedDown(requiredAdditionalAdCredit)
        : '';

      // Check if this is an off-platform campaign
      const isOffPlatformCampaign = Boolean(campaign.off_platform_request_id);
      const finalToggleDisabled = toggleDisabled || isOffPlatformCampaign;
      let finalToggleDisabledTooltip: string | undefined;
      if (isOffPlatformCampaign) {
        finalToggleDisabledTooltip = translate('Description.OffPlatformCampaignsCannotBePaused');
      } else if (togglingShouldBeEnabled.disabledTooltip) {
        finalToggleDisabledTooltip = translate(togglingShouldBeEnabled.disabledTooltip);
      }

      const cancelResult = GetCancelTooltipTitle(
        campaign,
        cancelCampaignTimeBufferMs,
        isOffPlatformCampaign,
      );
      const cancelDisabledTooltipText = cancelResult
        ? translate(cancelResult.key, cancelResult.params)
        : undefined;
      const editTooltipKey = GetEditTooltipTitle(statusText, toggleDisabled);
      let editDisabledTooltipText: string | undefined;
      if (editTooltipKey === undefined) {
        editDisabledTooltipText = undefined;
      } else {
        editDisabledTooltipText = editTooltipKey === '' ? '' : translate(editTooltipKey);
      }

      return [
        campaign.id,
        {
          cancelDisabledTooltip: cancelDisabledTooltipText,
          editDisabledTooltip: editDisabledTooltipText,
          insufficientAdCreditTooltip: insufficientAdCreditAmount,
          paymentType: getCampaignPaymentType(campaign),
          statusText,
          toggleDisabledTooltip: finalToggleDisabledTooltip,
          toggleState: { isDisabled: finalToggleDisabled, isOn: campaignStatus?.is_on || false },
          universeId: campaign.universe_id,
        },
      ];
    }),
  );

  const tableElement = (
    <GenericManagementTable
      className={campaignTable}
      entityIdToUnsortableData={campaignIdToUnsortableData}
      entityType={EntityType.ENTITY_TYPE_CAMPAIGN}
      firstColumnMeasurement={firstColumnMeasurement}
      getTooltipAnchorRowId={getRetentionTooltipAnchorRowId}
      headCells={headCells}
      isLoading={isLoading}
      RowElement={CampaignTableRow}
      showFooter
      sortableData={rows}
    />
  );

  return (
    <DismissibleTooltip
      // GenericManagementTable renders a fragment (scroll container + pagination), so we wrap it
      // in a single element to satisfy DismissibleTooltip's Radix `asChild` anchor slot, which
      // requires exactly one React child.
      anchorElement={<div>{tableElement}</div>}
      tooltip={Tooltips.CAMPAIGN_TABLE}
    />
  );
};

export default CampaignManagementTable;
