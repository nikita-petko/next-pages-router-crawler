import {
  IconButton,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Toggle,
  type TStatusBadgeVariant,
} from '@rbx/foundation-ui';
import Link from 'next/link';

import AdIntegrationsCampaignActionMenu from '@components/adIntegrations/AdIntegrationsCampaignActionMenu';
import useAdIntegrationsCampaignTableStyles from '@components/adIntegrations/AdIntegrationsCampaignTable.styles';
import AppTooltip from '@components/common/AppTooltip';
import UniverseThumbnailImage from '@components/common/creative/UniverseThumbnailImage';
import { openEntitySubmitErrorDialog } from '@components/common/dialog/entitySubmitErrorDialog';
import { openImpersonationErrorDialog } from '@components/common/dialog/impersonationErrorDialog';
import GeneralTableTooltip from '@components/reporting/GenericTableTooltip';
import { UNAVAILABLE_VALUE_DISPLAY } from '@constants/displayConstants';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { parseAdIntegrationCampaignModerationStatus } from '@services/ads/adIntegrationCampaignService';
import { ThumbnailStoreType, useThumbnailStore } from '@stores/thumbnailStoreProvider';
import { AdIntegrationCampaignListItem } from '@type/adIntegrations';
import { AMAErrorResponseType } from '@type/errorResponse';
import {
  isAdIntegrationCampaignEndedByTimestamp,
  isAdIntegrationCampaignStatusArchived,
  isAdIntegrationCampaignStatusEnabled,
} from '@utils/adIntegrationCampaign';
import {
  CampaignModerationStatus,
  getCampaignModerationStatusLabelKey,
  getCampaignModerationTooltipBodyKey,
  shouldShowCampaignViewDetails,
} from '@utils/adIntegrationModerationTooltip';
import { IsImpersonationError } from '@utils/error';

interface AdIntegrationsCampaignTableProps {
  campaigns: AdIntegrationCampaignListItem[];
  isMultiUniverseEnabled?: boolean;
  onArchiveCampaign?: (campaignId: string) => void;
  onToggleCampaignStatus: (campaignId: string, currentStatus?: string) => Promise<void>;
  selectedUniverseId?: number;
  toggleLoadingMap: Record<string, boolean>;
}

const normalizeModerationStatus = (status?: string): CampaignModerationStatus | undefined =>
  parseAdIntegrationCampaignModerationStatus(status);

const getDateDisplayValue = (timestampMs?: number): string => {
  if (!timestampMs) {
    return UNAVAILABLE_VALUE_DISPLAY;
  }

  return new Date(timestampMs).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const AdIntegrationsCampaignTable = ({
  campaigns,
  isMultiUniverseEnabled = false,
  onArchiveCampaign,
  onToggleCampaignStatus,
  selectedUniverseId,
  toggleLoadingMap,
}: AdIntegrationsCampaignTableProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Report);
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const { translate: translateAccount } = useNamespacedTranslation(TranslationNamespace.Account);
  const { translate: translateCreativeLibrary } = useNamespacedTranslation(
    TranslationNamespace.CreativeLibrary,
  );
  const {
    classes: {
      campaignIdTooltipContent,
      campaignIdTooltipPopper,
      campaignLink,
      campaignName,
      experienceCell,
      experienceName,
      tableContainer,
      tooltipContent,
      tooltipLink,
    },
  } = useAdIntegrationsCampaignTableStyles();
  const thumbnailsByUniverseId = useThumbnailStore(
    (state: ThumbnailStoreType) => state.thumbnailsByUniverseId,
  );

  const getModerationStatusText = (status?: CampaignModerationStatus): string => {
    switch (status) {
      case 'APPROVED':
        return translateAccount('Label.ModerationStatusApproved');
      case 'IN_REVIEW':
        return translateCreativeLibrary('Label.InReview');
      case 'LIMITED':
        return translateAccount('Label.ModerationStatusLimited');
      case 'REJECTED':
        return translateCreativeLibrary('Label.Rejected');
      default:
        return translateAccount('Label.NoAssets');
    }
  };

  const getModerationStatusBadgeVariant = (
    status?: CampaignModerationStatus,
  ): TStatusBadgeVariant => {
    switch (status) {
      case 'APPROVED':
      case 'LIMITED':
        return 'Success';
      case 'REJECTED':
        return 'Alert';
      case 'IN_REVIEW':
      default:
        return 'Warning';
    }
  };

  return (
    <div className={tableContainer}>
      <Table>
        <TableHeader>
          <TableRow>
            {isMultiUniverseEnabled ? (
              <>
                <TableHeaderCell>{translate('Label.Campaign')}</TableHeaderCell>
                <TableHeaderCell>{translateMisc('Label.Games')}</TableHeaderCell>
              </>
            ) : (
              <>
                <TableHeaderCell>{translate('Label.Experience')}</TableHeaderCell>
                <TableHeaderCell>{translate('Label.Campaign')}</TableHeaderCell>
              </>
            )}
            <TableHeaderCell>
              <div className='inline-flex items-center'>
                {translate('Label.OffOn')}
                <GeneralTableTooltip
                  renderTooltip
                  tooltipText={translateCampaign('Tooltip.AdIntegrationOffOnTooltip')}
                />
              </div>
            </TableHeaderCell>
            <TableHeaderCell>{translate('Label.Status')}</TableHeaderCell>
            <TableHeaderCell>{translateCampaign('Label.CampaignStartDate')}</TableHeaderCell>
            <TableHeaderCell>{translate('Label.EndDate')}</TableHeaderCell>
            <TableHeaderCell aria-label={translate('Description.MoreOptions')}>
              {null}
            </TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => {
            const universeIds = campaign.universeIds ?? [campaign.universeId];
            // Surface the universe the user is actively filtering on as the
            // primary row, rather than positional API order — otherwise the
            // game they filtered for gets folded into "+N additional games".
            // Falls back to the first universe when viewing all games.
            const primaryUniverseIndex =
              selectedUniverseId !== undefined && universeIds.includes(selectedUniverseId)
                ? universeIds.indexOf(selectedUniverseId)
                : 0;
            const primaryUniverseId = universeIds[primaryUniverseIndex] ?? campaign.universeId;
            const primaryUniverseName =
              campaign.universeNames?.[primaryUniverseIndex] || campaign.universeName;
            const additionalUniverseCount = Math.max(universeIds.length - 1, 0);
            const universeThumbnailUrl =
              thumbnailsByUniverseId[primaryUniverseId]?.data?.imageUrl ?? undefined;
            const toggleLoading = toggleLoadingMap[campaign.campaignId] ?? false;
            const isEnabled = isAdIntegrationCampaignStatusEnabled(campaign.status);
            const isArchived = isAdIntegrationCampaignStatusArchived(campaign.status);
            const isCampaignEnded = isAdIntegrationCampaignEndedByTimestamp(
              campaign.endTimestampMs,
            );
            const toggleDisabled = toggleLoading || isCampaignEnded || isArchived;
            const moderationStatus = normalizeModerationStatus(campaign.moderationStatus);
            const isCompleted = !isArchived && isCampaignEnded && moderationStatus !== 'REJECTED';
            const moderationTooltipBodyKey =
              isArchived || isCompleted
                ? undefined
                : getCampaignModerationTooltipBodyKey(moderationStatus);
            const moderationStatusLabelKey =
              isArchived || isCompleted
                ? undefined
                : getCampaignModerationStatusLabelKey(moderationStatus);
            const getStatusLabelText = (): string => {
              if (isArchived) {
                return translateMisc('Status.Archived');
              }
              if (isCompleted) {
                return translate('Status.Completed');
              }
              return getModerationStatusText(moderationStatus);
            };
            const experienceTableCell = (
              <TableCell>
                <div className={experienceCell}>
                  <UniverseThumbnailImage size={24} src={universeThumbnailUrl} />
                  <div className='flex flex-col'>
                    <span className={`text-body-medium ${experienceName}`}>
                      {primaryUniverseName}
                    </span>
                    {isMultiUniverseEnabled && additionalUniverseCount > 0 && (
                      <span className='text-body-small content-muted'>
                        {translateMisc('Label.AdditionalGames', {
                          count: String(additionalUniverseCount),
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </TableCell>
            );
            const campaignTableCell = (
              <TableCell>
                <AppTooltip
                  ariaLabel={translate('Label.CampaignId', { id: campaign.campaignId })}
                  contentClassName={campaignIdTooltipPopper}
                  position='top-start'
                  title={
                    <div className={campaignIdTooltipContent}>
                      <span className='text-title-large'>
                        {translate('Label.CampaignId', {
                          id: campaign.campaignId,
                        })}
                      </span>
                      <IconButton
                        ariaLabel={translate('Description.CopyToClipboard')}
                        icon='icon-regular-two-stacked-squares'
                        iconColor='Inverse'
                        onClick={() => navigator.clipboard.writeText(campaign.campaignId)}
                        size='Small'
                        variant='Utility'
                      />
                    </div>
                  }>
                  <Link
                    className={campaignLink}
                    href={{
                      pathname: Routes.AD_INTEGRATIONS_CAMPAIGN,
                      query: { campaignId: campaign.campaignId },
                    }}>
                    <span className={`text-body-medium ${campaignName}`}>
                      {campaign.campaignName}
                    </span>
                  </Link>
                </AppTooltip>
              </TableCell>
            );

            return (
              <TableRow isHoverable key={campaign.campaignId}>
                {isMultiUniverseEnabled ? (
                  <>
                    {campaignTableCell}
                    {experienceTableCell}
                  </>
                ) : (
                  <>
                    {experienceTableCell}
                    {campaignTableCell}
                  </>
                )}
                <TableCell>
                  <Toggle
                    aria-label={translate('Description.ToggleEntity')}
                    data-testid={`ad-integration-toggle-${campaign.campaignId}`}
                    isChecked={isEnabled}
                    isDisabled={toggleDisabled}
                    onCheckedChange={() => {
                      onToggleCampaignStatus(campaign.campaignId, campaign.status).catch(
                        (error) => {
                          if (IsImpersonationError(error)) {
                            openImpersonationErrorDialog();
                            return;
                          }
                          openEntitySubmitErrorDialog(
                            (error as { response?: { data?: AMAErrorResponseType } })?.response
                              ?.data as AMAErrorResponseType,
                            { editMode: false },
                          );
                        },
                      );
                    }}
                    placement='Start'
                    size='Small'
                  />
                </TableCell>
                <TableCell>
                  <AppTooltip
                    ariaLabel={
                      moderationTooltipBodyKey
                        ? translateAccount(moderationTooltipBodyKey)
                        : undefined
                    }
                    position='top-center'
                    title={
                      moderationTooltipBodyKey && moderationStatusLabelKey ? (
                        <div className={tooltipContent}>
                          <span className='text-title-large'>
                            {getModerationStatusText(moderationStatus)}
                          </span>
                          <span className='text-body-medium'>
                            {translateAccount(moderationTooltipBodyKey)}
                          </span>
                          {shouldShowCampaignViewDetails(moderationStatus) && (
                            <Link
                              className={tooltipLink}
                              href={{
                                pathname: Routes.AD_INTEGRATIONS_CAMPAIGN,
                                query: { campaignId: campaign.campaignId },
                              }}>
                              {translateAccount('Action.ViewDetails')}
                            </Link>
                          )}
                        </div>
                      ) : (
                        ''
                      )
                    }>
                    <StatusBadge
                      label={getStatusLabelText()}
                      variant={
                        isArchived || isCompleted
                          ? 'Standard'
                          : getModerationStatusBadgeVariant(moderationStatus)
                      }
                    />
                  </AppTooltip>
                </TableCell>
                <TableCell>
                  <span className='text-body-medium'>
                    {getDateDisplayValue(campaign.startTimestampMs)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className='text-body-medium'>
                    {getDateDisplayValue(campaign.endTimestampMs)}
                  </span>
                </TableCell>
                <TableCell>
                  <AdIntegrationsCampaignActionMenu
                    campaignId={campaign.campaignId}
                    isCampaignArchived={isArchived}
                    isCampaignEnded={isCampaignEnded}
                    onArchiveCampaign={onArchiveCampaign}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdIntegrationsCampaignTable;
