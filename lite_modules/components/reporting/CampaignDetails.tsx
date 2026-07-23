import { Button, Link } from '@rbx/foundation-ui';
import { Grid, Tooltip } from '@rbx/ui';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import useCampaignDetailsStyles from '@components/reporting/CampaignDetails.styles';
import StatusLabel from '@components/reporting/StatusLabel';
import { defaultTimeZone } from '@constants/app';
import { getStatusTooltipLinkTags, statusTextToTooltipKey } from '@constants/campaignStatus';
import { EntityType } from '@constants/entity';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { getUniverses } from '@services/ads/getUniversesService';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { NewFlowStoreType, useNewFlowStore } from '@stores/newFlowStoreProvider';
import { InfoGridCell } from '@type/genericManagementTable';
import {
  GetAudienceLabelKey,
  GetEditTooltipTitle,
  GetEndUserBudgetParts,
  GetEndUserObjectiveString,
  GetEndUserPaymentTypeString,
  GetEndUserScheduleParts,
} from '@utils/campaignDetails';
import { GetCampaignStatusText, GetToggleDisabled } from '@utils/displayStatus';
import { ConvertEntityTypeEnumToString } from '@utils/enumToString';
import { SessionStorageKeys, SetSessionStorage } from '@utils/sessionStorage';
import { GetTimezoneObjFromEnum } from '@utils/timezone';
import { GetSitetestBaseUrl, GetUrlWithParams } from '@utils/url';

const CampaignDetails = () => {
  const { translate: translateReport, translateHTML: translateReportHTML } =
    useNamespacedTranslation(TranslationNamespace.Report);
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const router = useRouter();
  const {
    classes: {
      container,
      editRow,
      itemContainer,
      labelContainer,
      labelFont,
      scheduleContainer,
      valueFont,
    },
  } = useCampaignDetailsStyles();

  const { campaign } = useNewFlowStore((state: NewFlowStoreType) => state.campaignDetailsState);

  const onEditClick = () => {
    logNativeClickEvent(EventName.EditButtonClicked, {
      entityType: ConvertEntityTypeEnumToString(EntityType.ENTITY_TYPE_CAMPAIGN),
    });
    SetSessionStorage(SessionStorageKeys.PREVIOUS_PAGE, Routes.MANAGE);
    router.push(GetUrlWithParams(Routes.EDIT_CAMPAIGN, { campaignId: campaign?.id }));
  };

  const updatedCampaignStatuses = useNewFlowStore(
    (state: NewFlowStoreType) => state.statusesState.updatedCampaignStatuses,
  );

  const { timezoneDbName, title: timezoneTitle } = useAppStore((state: AppStoreType) =>
    GetTimezoneObjFromEnum(
      state.advertiserState.data?.organization.time_zone || defaultTimeZone.value,
    ),
  );

  const universesCanCurrentlyAdvertise = useCampaignBuilderStore(
    (state) => state.universesCanAdvertise.data,
  );
  const universeName = useNewFlowStore(
    (state) =>
      state.advertisedUniversesState?.data?.find(
        ({ universe_id }) => universe_id === campaign?.universe_id,
      )?.universe_name ||
      // fallback to universes endpoint response if there is ElasticSearch delay
      universesCanCurrentlyAdvertise?.find(
        ({ universe_id }) => universe_id === campaign?.universe_id,
      )?.universe_name ||
      '',
  );
  const campaignUniverseId = campaign?.universe_id;
  const { data: universeRootPlaceId } = useQuery({
    enabled: campaignUniverseId !== undefined,
    queryFn: () => {
      if (campaignUniverseId === undefined) {
        throw new Error('Campaign universe ID is required');
      }
      return getUniverses([campaignUniverseId]);
    },
    queryKey: ['campaignDetailsUniverseRootPlaceId', campaignUniverseId],
    select: (response) => response.data?.[0]?.rootPlaceId,
  });

  const campaignToggleLoadingMap = useNewFlowStore(
    (state: NewFlowStoreType) => state.tableRowsState.campaignToggleLoadingMap,
  );
  const campaignToggleLoadingDueToAdToggleMap = useNewFlowStore(
    (state: NewFlowStoreType) => state.tableRowsState.campaignToggleLoadingDueToAdToggleMap,
  );
  const adTogglingShouldBeEnabled = useAppStore((state) => state.adTogglingShouldBeEnabled);

  if (campaign === undefined) {
    return null;
  }

  const campaignStatus = updatedCampaignStatuses.get(campaign.id);
  const toggleDisabled = GetToggleDisabled({
    adTogglingShouldBeEnabled: adTogglingShouldBeEnabled(campaign.payment_type).togglingEnabled,
    campaignStatus,
    campaignToggleLoadingDueToAdToggleMap,
    campaignToggleLoadingMap,
  });
  const statusText = GetCampaignStatusText(campaignStatus?.display_status);
  const statusTooltipKey = statusTextToTooltipKey.get(statusText);
  const statusTooltipText = statusTooltipKey
    ? translateReportHTML(
        statusTooltipKey,
        getStatusTooltipLinkTags(statusText, campaign?.universe_id),
      )
    : undefined;
  const editDisabledTooltipKey = GetEditTooltipTitle(statusText, toggleDisabled);
  const editDisabledTooltip = editDisabledTooltipKey
    ? translateReport(editDisabledTooltipKey)
    : editDisabledTooltipKey;
  const isOffPlatformCampaign = Boolean(campaign.off_platform_request_id);

  const budgetParts = GetEndUserBudgetParts(campaign);
  const budgetDisplay = budgetParts
    ? `${budgetParts.prefixKey ? translateReport(budgetParts.prefixKey) : ''}${budgetParts.amount} / ${translateCampaign(budgetParts.typeKey)}`
    : '';
  const scheduleParts = GetEndUserScheduleParts(campaign, timezoneDbName);
  const scheduleDisplay = scheduleParts.runContinuouslyKey
    ? `${scheduleParts.startDate} - ${translateCampaign(scheduleParts.runContinuouslyKey)}`
    : `${scheduleParts.startDate} - ${scheduleParts.endDate}`;

  const campaignInfoGridFirstColumnLabels: InfoGridCell[] = [
    {
      id: 'experienceLabel',
      label: translateReport('Label.Experience'),
      value: universeRootPlaceId ? (
        <Link
          color='Standard'
          data-testid='campaign-details-experience-link'
          href={`https://${GetSitetestBaseUrl()}/games/${universeRootPlaceId}`}
          isExternal={false}
          rel='noopener noreferrer'
          target='_blank'>
          {universeName}
        </Link>
      ) : (
        universeName
      ),
    },
    {
      id: 'objectiveLabel',
      label: translateReport('Label.Objective'),
      value: translateCampaign(
        GetEndUserObjectiveString(campaign.objective, isOffPlatformCampaign),
      ),
    },
    {
      id: 'audienceLabel',
      label: translateCampaign('Heading.Audience'),
      value: translateCampaign(GetAudienceLabelKey(campaign.detailed_targeting_match_type)),
    },
    {
      id: 'statusLabel',
      label: translateReport('Label.Status'),
      value: <StatusLabel status={statusText} tooltipContent={statusTooltipText} />,
    },
  ];
  const campaignInfoGridSecondColumnLabels: InfoGridCell[] = [
    {
      id: 'budgetLabel',
      label: translateCampaign('Label.Budget'),
      value: budgetDisplay,
    },
    {
      id: 'paymentLabel',
      label: translateReport('Label.Payment'),
      value: translateReport(GetEndUserPaymentTypeString(campaign.payment_type)),
    },
    {
      id: 'scheduleLabel',
      label: translateReport('Label.Schedule'),
      value: (
        <div className={scheduleContainer}>
          {scheduleDisplay}
          <span className='text-body-medium content-default'>{timezoneTitle}</span>
        </div>
      ),
    },
  ];

  const campaignInfoGrid = (
    <Grid alignItems='left' container data-testid='campaign-info-grid' spacing={3}>
      <Grid alignItems='left' container direction='column' item Medium={6} spacing={2} XSmall={12}>
        {campaignInfoGridFirstColumnLabels.map((label) => (
          <Grid item key={label.id}>
            <div className={itemContainer}>
              <div className={labelContainer}>
                <span className={`text-body-medium ${labelFont}`}>{label.label}</span>
              </div>
              <span className={`text-body-medium ${valueFont}`}>{label.value}</span>
            </div>
          </Grid>
        ))}
      </Grid>
      <Grid alignItems='left' container direction='column' item Medium={6} spacing={2} XSmall={12}>
        {campaignInfoGridSecondColumnLabels.map((label) => (
          <Grid item key={label.id}>
            <div className={itemContainer}>
              <div className={labelContainer}>
                <span className={`text-body-medium ${labelFont}`}>{label.label}</span>
              </div>
              <span className={`text-body-medium ${valueFont}`}>{label.value}</span>
            </div>
          </Grid>
        ))}
      </Grid>
    </Grid>
  );

  return (
    <Grid className={container} container data-testid='campaign-details'>
      {campaignInfoGrid}
      <Grid className={editRow} container>
        <Grid item>
          <Tooltip placement='right' title={editDisabledTooltip ?? ''}>
            <div>
              <Button
                data-testid='campaign-details-edit-button'
                isDisabled={editDisabledTooltipKey !== undefined}
                onClick={onEditClick}
                size='Medium'
                variant='Standard'>
                {translateMisc('Action.Edit')}
              </Button>
            </div>
          </Tooltip>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default CampaignDetails;
