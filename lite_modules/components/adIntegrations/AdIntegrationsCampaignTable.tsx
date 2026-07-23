import {
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Toggle,
} from '@rbx/foundation-ui';
import { Label, Tooltip } from '@rbx/ui';
import Link from 'next/link';

import AdIntegrationsCampaignActionMenu from '@components/adIntegrations/AdIntegrationsCampaignActionMenu';
import useAdIntegrationsCampaignTableStyles from '@components/adIntegrations/AdIntegrationsCampaignTable.styles';
import useAdIntegrationStatusLabelStyles from '@components/adIntegrations/adIntegrationStatusLabel.styles';
import { openEntitySubmitErrorDialog } from '@components/common/dialog/entitySubmitErrorDialog';
import { openImpersonationErrorDialog } from '@components/common/dialog/impersonationErrorDialog';
import UniverseFilterAvatar from '@components/common/UniverseFilterAvatar';
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
  onArchiveCampaign?: (campaignId: string) => void;
  onToggleCampaignStatus: (campaignId: string, currentStatus?: string) => Promise<void>;
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
  onArchiveCampaign,
  onToggleCampaignStatus,
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
  const {
    classes: {
      labelRoot,
      statusCircleActive,
      statusCircleDisabled,
      statusCircleImportant,
      statusCircleNotice,
    },
  } = useAdIntegrationStatusLabelStyles();
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

  const getModerationStatusCircleClass = (status?: CampaignModerationStatus): string => {
    switch (status) {
      case 'APPROVED':
      case 'LIMITED':
        return statusCircleActive;
      case 'REJECTED':
        return statusCircleImportant;
      case 'IN_REVIEW':
      default:
        return statusCircleNotice;
    }
  };

  return (
    <div className={tableContainer}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>{translate('Label.Experience')}</TableHeaderCell>
            <TableHeaderCell>{translate('Label.Campaign')}</TableHeaderCell>
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
            const universeThumbnailUrl =
              thumbnailsByUniverseId[campaign.universeId]?.data?.imageUrl ?? undefined;
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

            return (
              <TableRow isHoverable key={campaign.campaignId}>
                <TableCell>
                  <div className={experienceCell}>
                    <UniverseFilterAvatar src={universeThumbnailUrl} />
                    <span className={`text-body-medium ${experienceName}`}>
                      {campaign.universeName}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Tooltip
                    placement='top-start'
                    slotProps={{
                      popper: {
                        className: campaignIdTooltipPopper,
                      },
                    }}
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
                  </Tooltip>
                </TableCell>
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
                  <Tooltip
                    placement='top'
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
                    <div>
                      <Label
                        classes={{ root: labelRoot }}
                        icon={
                          <div
                            className={
                              isArchived || isCompleted
                                ? statusCircleDisabled
                                : getModerationStatusCircleClass(moderationStatus)
                            }
                          />
                        }
                        labelText={getStatusLabelText()}
                        severity='default'
                        variant='contained'
                      />
                    </div>
                  </Tooltip>
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
