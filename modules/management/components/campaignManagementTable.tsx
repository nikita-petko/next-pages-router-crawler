import {
  Alert,
  AlertTitle,
  Button,
  DeleteOutlinedIcon,
  Drawer,
  EditOutlinedIcon,
  FileCopyOutlinedIcon,
  Grid,
  HighlightOffIcon,
  IconButton,
  makeStyles,
  RobuxIcon,
  Switch,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from '@rbx/ui';
import { Formik } from 'formik';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { MouseEvent, ReactNode, useState } from 'react';
import { NumericFormat } from 'react-number-format';

import { EventName, unifiedLogger } from '@clients/unifiedLogger';
import StatusLabel from '@components/reporting/StatusLabel';
import { AdFormatDisplayType } from '@constants/ad';
import { PaymentMethodActionEnum } from '@constants/billing';
import { ServerCampaignStatusType, ServerPaymentType } from '@constants/campaign';
import { DefaultTimeZone } from '@constants/campaignBuilder';
import {
  getStatusTooltipLinkTags,
  StatusText,
  statusTextToTooltipKey,
} from '@constants/campaignStatus';
import { contentStaticDark } from '@constants/colors';
import { UNAVAILABLE_VALUE_DISPLAY } from '@constants/displayConstants';
import { EntityType } from '@constants/entity';
import ErrorCodes from '@constants/errorCodes';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import {
  cancelCampaign,
  deleteCampaign,
  getAds,
  getAdSets,
  getUpdatedStatuses,
  toggleCampaign,
  updateCampaign,
} from '@modules/clients/ads/adsClient';
import { BudgetType } from '@modules/clients/ads/adsClientTypes';
import {
  convertFormikDataToUpdateCampaignRequest,
  END_USER_AD_CREDIT_PAYMENT_TYPE,
  getEndUserPaymentUnit,
  MICRO_USD_IN_USD,
  microUsdToUsd,
  ServerToClient,
  toAdCreditString,
  toUsdString,
} from '@modules/clients/ads/serverClientTransformationUtilities';
import { FilterRefresh } from '@modules/filtering/utils/filterEnums';
import useManagementTableStyles from '@modules/management/components/managementTableStyles';
import {
  getEditCampaignInitialValues,
  getEditCampaignValidationSchema,
} from '@modules/management/models/editCampaignComponentModel';
import SummaryRowCell from '@modules/miscellaneous/common/components/SummaryRowCell';
import { convertMsToDate, getDurationInDays } from '@modules/miscellaneous/utils/dateUtilities';
import { GetTooltipText } from '@modules/miscellaneous/utils/tooltipStrings';
import {
  DisplayStatusesStoreType,
  useDisplayStatusesStore,
} from '@modules/stores/displayStatusStoreProvider';
import useFilteringStore from '@modules/stores/filteringStoreProvider';
import { useLimitInfoStore } from '@modules/stores/limitInfoStoreProvider';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { useModalStore } from '@stores/modalStoreProvider';
import { ServerGetAdRowResponse } from '@type/ad';
import { ServerGetAdSetRowResponse } from '@type/adSet';
import { AMAErrorResponseType } from '@type/errorResponse';
import {
  MicroUsdToUsd,
  MicroUsdToUsdStringRoundedDown,
  ToFixedNoRounding,
  UsdToMicroUsd,
} from '@utils/currency';
import { GetTimezoneOffsetMs } from '@utils/date';
import { GetBackendCampaignStatusText, IsCompletedStatus } from '@utils/displayStatus';
import { ConvertEntityTypeEnumToString } from '@utils/enumToString';
import { CaptureException } from '@utils/error';
import { SetErrorModalImpersonationConfig } from '@utils/errorModalImpersonation';
import { GetTimezoneObjFromEnum } from '@utils/timezone';
import { MillisecondsToHours } from '@utils/unitConversion';
import { HOME_PAGE_TABLE_VIEWS } from 'app/pages/classic';
import { TODOFIXANY } from 'app/shared/types';

import { EditCampaignComponent } from './editCampaignComponent';
import {
  allAdFormats,
  CellAlignType,
  GenericManagementTable,
  getDisplayedHeadCells,
  getDisplayedRowCells,
  RowType,
  TableNameCell,
} from './genericManagementTable';

const stickyRowStyles = {
  background: contentStaticDark,
  boxShadow: 'none',
  left: 0,
  paddingLeft: 8,
  paddingRight: 8,
  position: 'sticky' as const,
  textAlign: 'left' as const,
  zIndex: 999,
};

const nameRowWidth = 360;
const toggleRowWidth = 95;
const statusRowWidth = 110;

const nameRowStyles = {
  ...stickyRowStyles,
  minWidth: nameRowWidth,
  paddingLeft: 24,
  width: nameRowWidth,
};
const topAlignedNameRowStyles = {
  ...nameRowStyles,
  paddingBottom: 5,
  verticalAlign: 'top',
};
const toggleRowStyles = {
  ...stickyRowStyles,
  left: nameRowWidth - 2,
  minWidth: toggleRowWidth,
  paddingLeft: 8,
  paddingRight: 8,
  width: toggleRowWidth,
};
const topAlignedToggleRowStyles = {
  ...toggleRowStyles,
  paddingBottom: 5,
  paddingTop: 8,
  verticalAlign: 'top',
};
const statusRowStyles = {
  ...stickyRowStyles,
  left: nameRowWidth + toggleRowWidth - 3,
  minWidth: statusRowWidth,
  width: statusRowWidth,
};
const topAlignedStatusRowStyles = {
  ...statusRowStyles,
  paddingBottom: 5,
  verticalAlign: 'top',
};
const topAlignedContentRowStyles = {
  paddingLeft: 8,
  paddingRight: 8,
  verticalAlign: 'top',
};
const columnSpacingStyles = {
  paddingLeft: 8,
  paddingRight: 8,
};

const offOnHeaderTooltip = 'CampaignManagementTable.OffOnHeader';
const spentHeaderTooltip = 'CampaignManagementTable.SpentHeader';
const impressionsHeaderTooltip = 'CampaignManagementTable.ImpressionsHeader';
const cpmHeaderTooltip = 'CampaignManagementTable.CpmHeader';
const twoSecondViewsHeaderTooltip = 'CampaignManagementTable.2SecVideoViewsHeader';
const fifteenSecondViewsHeaderTooltip = 'CampaignManagementTable.15SecVideoViewsHeader';
const cpv15HeaderTooltip = 'CampaignManagementTable.Cpv15Header';
const clicksHeaderTooltip = 'CampaignManagementTable.ClicksHeader';
const ctrHeaderTooltip = 'CampaignManagementTable.CtrHeader';
const cpcHeaderTooltip = 'CampaignManagementTable.CpcHeader';
const playsHeaderTooltip = 'CampaignManagementTable.PlaysHeader';
const playRateHeaderTooltip = 'CampaignManagementTable.PlayRateHeader';
const costPerPlayHeaderTooltip = 'CampaignManagementTable.CostPerPlayHeader';
const completedCampaignToggleTooltip = 'CampaignManagementTable.CompletedCampaignToggle';
const insufficientAdCreditToggleTooltip = 'CampaignManagementTable.InsufficientAdCreditToggle';
const totalPlayTimeHeaderTooltip = 'CampaignManagementTable.TotalPlayTimeHeader';
const totalRobuxRevenueHeaderTooltip = 'CampaignManagementTable.TotalRobuxRevenueHeader';

// https://uiblox.roblox.com/?path=/docs/components-table--base
// https://github.rbx.com/Roblox/uiblox-web/blob/master/stories/Table.stories.tsx
interface CampaignManagementTableProps {
  adFormats: AdFormatDisplayType[];
  hasNoPaymentMethod?: boolean;
  inFilterView: boolean;
  loadMore: TODOFIXANY;
  nextCursor: string;
  onCancelFailure: TODOFIXANY;
  onCancelSuccess: TODOFIXANY;
  onEditClick: TODOFIXANY;
  onEditSuccess: TODOFIXANY;
  rows: TODOFIXANY[];
  showDelete: boolean;
  tableSummaryRowData?: TODOFIXANY;
}

// TODO: Make Translated String - Toggle Campaign
const CampaignTableToggleCell = ({
  align = 'center',
  campaignOn = false,
  className,
  onToggleClicked,
  toggleDisabled = false,
  toggleDisabledTooltip = '',
}: {
  align: CellAlignType;
  campaignOn: boolean;
  className: string;
  onToggleClicked: TODOFIXANY;
  toggleDisabled: boolean;
  toggleDisabledTooltip: ReactNode;
}) => {
  const {
    classes: { disabledToggle },
  } = makeStyles()(() => ({
    disabledToggle: {
      '& .Mui-disabled': {
        color: '#989898 !important',
      },
    },
  }))();

  const disabledClass = toggleDisabled ? disabledToggle : '';
  return (
    <TableCell align={align} className={className}>
      <Tooltip
        arrow
        placement='right'
        title={
          toggleDisabled && toggleDisabledTooltip ? (
            <div>
              <span>{toggleDisabledTooltip}</span>
            </div>
          ) : (
            ''
          )
        }>
        <span>
          <Switch
            aria-label='Toggle Campaign'
            checked={campaignOn}
            classes={{
              root: disabledClass,
            }}
            data-testid='toggle-campaign'
            disabled={toggleDisabled}
            onClick={onToggleClicked}
          />
        </span>
      </Tooltip>
    </TableCell>
  );
};

interface CampaignTableDateCellProps {
  align: CellAlignType;
  className: string;
  endTimestampMs: number;
  startTimestampMs: number;
  timezone?: string;
}

const CampaignTableDateCell = ({
  align = 'center',
  className,
  endTimestampMs,
  startTimestampMs,
  timezone,
}: CampaignTableDateCellProps) => {
  return (
    <TableCell align={align} className={className}>
      <div>
        <div>
          {convertMsToDate(startTimestampMs, timezone)} -{' '}
          {endTimestampMs ? convertMsToDate(endTimestampMs, timezone) : 'Run Indefinitely'}
        </div>
      </div>
    </TableCell>
  );
};

interface CampaignTableBudgetCellProps {
  align: CellAlignType;
  campaignRow: TODOFIXANY;
  className: string;
}

const CampaignTableBudgetCell = ({
  align = 'center',
  campaignRow,
  className,
}: CampaignTableBudgetCellProps) => {
  const {
    classes: { budgetTypeFont },
  } = makeStyles()((_theme) => ({
    budgetTypeFont: {
      fontSize: 12,
    },
  }))();
  const { budgetTypeEndUserText, budgetUsd } =
    ServerToClient.getEndUserCampaignBudgetInfo(campaignRow);

  return (
    <TableCell align={align} className={className}>
      <div>
        <div>
          <NumericFormat
            decimalScale={2}
            displayType='text'
            fixedDecimalScale
            thousandSeparator
            value={budgetUsd}
          />{' '}
          {getEndUserPaymentUnit(campaignRow)}
        </div>
        <div className={budgetTypeFont}>{budgetTypeEndUserText}</div>
      </div>
    </TableCell>
  );
};

// TODO: Make Translated String - Labels
export const getHeadCells = () => [
  {
    align: 'left',
    customStyles: { ...nameRowStyles, zIndex: 1000 },
    disabled: false,
    id: 'name',
    label: 'Name',
    sortable: true,
  },
  {
    align: 'left',
    customStyles: { ...toggleRowStyles, zIndex: 1000 },
    disabled: false,
    id: 'active',
    label: 'Off/On',
    renderTooltip: true,
    sortable: false,
    tooltipText: GetTooltipText(offOnHeaderTooltip),
  },
  {
    align: 'left',
    customStyles: { ...statusRowStyles, zIndex: 1000 },
    disabled: false,
    id: 'statusText',
    label: 'Status',
    sortable: true,
  },
  {
    align: 'right',
    customStyles: { paddingLeft: 70, paddingRight: 8 },
    disabled: true,
    id: 'spent',
    label: 'Spent',
    renderTooltip: true,
    sortable: true,
    tooltipText: GetTooltipText(spentHeaderTooltip),
  },
  {
    align: 'right',
    customStyles: { ...columnSpacingStyles },
    disabled: true,
    id: 'impressions',
    label: 'Impressions',
    renderTooltip: true,
    sortable: true,
    tooltipText: GetTooltipText(impressionsHeaderTooltip),
  },
  {
    align: 'right',
    customStyles: { paddingLeft: 100, paddingRight: 8 },
    disabled: true,
    id: 'cpm',
    label: 'CPM',
    renderTooltip: true,
    sortable: true,
    tooltipText: GetTooltipText(cpmHeaderTooltip),
  },
  {
    align: 'right',
    customStyles: {
      ...columnSpacingStyles,
      minWidth: 240,
      width: 240,
    },
    disabled: false,
    id: 'twoSecondViews',
    label: '2-sec video view',
    renderTooltip: true,
    sortable: true,
    tooltipText: GetTooltipText(twoSecondViewsHeaderTooltip),
  },
  {
    align: 'right',
    customStyles: {
      ...columnSpacingStyles,
      minWidth: 240,
      width: 240,
    },
    disabled: false,
    id: 'fifteenSecondViews',
    label: '15-sec video view',
    renderTooltip: true,
    sortable: true,
    tooltipText: GetTooltipText(fifteenSecondViewsHeaderTooltip),
  },
  {
    align: 'right',
    customStyles: { paddingLeft: 100, paddingRight: 8 },
    disabled: false,
    id: 'cpv15',
    label: 'CPV15',
    renderTooltip: true,
    sortable: true,
    tooltipText: GetTooltipText(cpv15HeaderTooltip),
  },
  {
    align: 'right',
    customStyles: { ...columnSpacingStyles },
    disabled: true,
    id: 'clicks',
    label: 'Clicks',
    renderTooltip: true,
    sortable: true,
    tooltipText: GetTooltipText(clicksHeaderTooltip),
  },
  {
    align: 'right',
    customStyles: { paddingLeft: 100, paddingRight: 8 },
    disabled: true,
    id: 'ctr',
    label: 'CTR',
    renderTooltip: true,
    sortable: true,
    tooltipText: GetTooltipText(ctrHeaderTooltip),
  },
  {
    align: 'right',
    customStyles: { paddingLeft: 100, paddingRight: 8 },
    disabled: true,
    id: 'cpc',
    label: 'CPC',
    renderTooltip: true,
    sortable: true,
    tooltipText: GetTooltipText(cpcHeaderTooltip),
  },
  {
    align: 'right',
    customStyles: { ...columnSpacingStyles },
    disabled: true,
    id: 'plays',
    label: 'Plays',
    renderTooltip: true,
    sortable: true,
    tooltipText: GetTooltipText(playsHeaderTooltip),
  },
  {
    align: 'right',
    customStyles: {
      ...columnSpacingStyles,
      minWidth: 165,
      width: 165,
    },
    disabled: true,
    id: 'playRate',
    label: 'Play rate',
    renderTooltip: true,
    sortable: true,
    tooltipText: GetTooltipText(playRateHeaderTooltip),
  },
  {
    align: 'right',
    customStyles: { paddingLeft: 100, paddingRight: 8 },
    disabled: true,
    id: 'cpp',
    label: 'CPP',
    renderTooltip: true,
    sortable: true,
    tooltipText: GetTooltipText(costPerPlayHeaderTooltip),
  },
  {
    align: 'right',
    customStyles: { ...columnSpacingStyles, minWidth: 160 },
    disabled: true,
    id: 'totalPlayTime7d',
    label: '7D Playtime',
    renderTooltip: true,
    sortable: true,
    tooltipText: GetTooltipText(totalPlayTimeHeaderTooltip),
  },
  {
    align: 'right',
    customStyles: { ...columnSpacingStyles, minWidth: 210 },
    disabled: true,
    id: 'totalRobuxRevenue30d',
    label: '30D Robux Earnings',
    renderTooltip: true,
    sortable: true,
    tooltipText: GetTooltipText(totalRobuxRevenueHeaderTooltip),
  },
  {
    align: 'right',
    customStyles: { paddingLeft: 92, paddingRight: 8 },
    disabled: false,
    id: 'budgetUsd',
    label: 'Budget',
    sortable: true,
  },
  {
    align: 'left',
    customStyles: { ...columnSpacingStyles },
    disabled: false,
    id: 'objective',
    label: 'Objective',
    sortable: true,
  },
  {
    align: 'left',
    customStyles: { ...columnSpacingStyles },
    disabled: false,
    id: 'schedule',
    label: 'Schedule',
    sortable: true,
  },
  {
    align: 'left',
    customStyles: { ...columnSpacingStyles },
    disabled: false,
    id: 'paymentMethod',
    label: 'Payment',
    sortable: true,
  },
];

export const headCellsWithData = [];

export const headCellsFinalColumns = [
  { disabled: false, id: 'delete', label: '', sortable: false },
];

export const campaignsTableAdFormatRenderMap = new Map<string, Set<AdFormatDisplayType>>([
  ['name', allAdFormats],
  ['active', allAdFormats],
  ['statusText', allAdFormats],
  ['spent', allAdFormats],
  ['impressions', allAdFormats],
  ['cpm', allAdFormats],
  ['twoSecondViews', new Set<AdFormatDisplayType>([AdFormatDisplayType.AD_FORMAT_VIDEO])],
  ['fifteenSecondViews', new Set<AdFormatDisplayType>([AdFormatDisplayType.AD_FORMAT_VIDEO])],
  ['cpv15', new Set<AdFormatDisplayType>([AdFormatDisplayType.AD_FORMAT_VIDEO])],
  [
    'clicks',
    new Set<AdFormatDisplayType>([
      AdFormatDisplayType.AD_FORMAT_SPONSORED_UNIVERSE,
      AdFormatDisplayType.AD_FORMAT_SEARCH,
    ]),
  ],
  [
    'ctr',
    new Set<AdFormatDisplayType>([
      AdFormatDisplayType.AD_FORMAT_SPONSORED_UNIVERSE,
      AdFormatDisplayType.AD_FORMAT_SEARCH,
    ]),
  ],
  [
    'cpc',
    new Set<AdFormatDisplayType>([
      AdFormatDisplayType.AD_FORMAT_SPONSORED_UNIVERSE,
      AdFormatDisplayType.AD_FORMAT_SEARCH,
    ]),
  ],
  [
    'plays',
    new Set<AdFormatDisplayType>([
      AdFormatDisplayType.AD_FORMAT_PORTAL,
      AdFormatDisplayType.AD_FORMAT_SPONSORED_UNIVERSE,
      AdFormatDisplayType.AD_FORMAT_SEARCH,
    ]),
  ],
  [
    'playRate',
    new Set<AdFormatDisplayType>([
      AdFormatDisplayType.AD_FORMAT_PORTAL,
      AdFormatDisplayType.AD_FORMAT_SPONSORED_UNIVERSE,
      AdFormatDisplayType.AD_FORMAT_SEARCH,
    ]),
  ],
  [
    'cpp',
    new Set<AdFormatDisplayType>([
      AdFormatDisplayType.AD_FORMAT_PORTAL,
      AdFormatDisplayType.AD_FORMAT_SPONSORED_UNIVERSE,
      AdFormatDisplayType.AD_FORMAT_SEARCH,
    ]),
  ],
  ['budgetUsd', allAdFormats],
  ['objective', allAdFormats],
  ['schedule', allAdFormats],
  ['paymentMethod', allAdFormats],
  [
    'totalPlayTime7d',
    new Set<AdFormatDisplayType>([
      AdFormatDisplayType.AD_FORMAT_SPONSORED_UNIVERSE,
      AdFormatDisplayType.AD_FORMAT_SEARCH,
    ]),
  ],
  [
    'totalRobuxRevenue30d',
    new Set<AdFormatDisplayType>([
      AdFormatDisplayType.AD_FORMAT_SPONSORED_UNIVERSE,
      AdFormatDisplayType.AD_FORMAT_SEARCH,
    ]),
  ],
]);

interface CampaignTableRowProps {
  adFormats: AdFormatDisplayType[];
  hasNoPaymentMethod?: boolean;
  headerAlignments: CellAlignType[];
  onCancelFailure: TODOFIXANY;
  onCancelSuccess: TODOFIXANY;
  onEditClick: TODOFIXANY;
  onEditSuccess: TODOFIXANY;
  row: TODOFIXANY;
  showFinalColumns: boolean;
}

const CampaignTableRow = ({
  adFormats,
  hasNoPaymentMethod,
  headerAlignments,
  onCancelFailure,
  onCancelSuccess,
  onEditClick,
  onEditSuccess,
  row,
  showFinalColumns,
}: CampaignTableRowProps) => {
  const { translateHTML } = useNamespacedTranslation(TranslationNamespace.Report);
  const {
    ads,
    adSets,
    campaignLimit,
    campaignMinimumDailyBudgetUsd,
    campaigns,
    organizationInfo,
    selectedCampaigns,
  } = useAppStore((state: AppStoreType) => state.appData);

  const { cancelCampaignTimeBufferMs } = useAppStore(
    (state: AppStoreType) => state.appMetadataState.data,
  );

  const adTogglingShouldBeEnabled = useAppStore((state) => state.adTogglingShouldBeEnabled);

  const {
    setAds,
    setAdSets,
    setCampaigns,
    setSelectedAds,
    setSelectedAdSets,
    setSelectedAdSetsLoading,
    setSelectedAdsLoading,
    setSelectedCampaigns,
  } = useAppStore((state: AppStoreType) => state);

  const {
    classes: {
      button,
      contentRow,
      icon,
      iconButton,
      iconWrapper,
      nameRow,
      rowContainer,
      statusRow,
      toggleRow,
    },
  } = makeStyles<void, 'button'>()((_, __, classes) => ({
    button: {
      ':first-child': {
        marginLeft: 13.5,
      },
      marginLeft: 0,
      paddingLeft: 0,
      visibility: 'hidden',
    },

    // @ts-ignore
    contentRow: topAlignedContentRowStyles,

    icon: {
      fontSize: 25,
      height: 18,
      verticalAlign: 'top',
    },

    iconButton: {
      padding: 0,
    },

    iconWrapper: {
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'center',
    },

    // @ts-ignore
    nameRow: topAlignedNameRowStyles,

    rowContainer: {
      '&:hover': {
        [`& .${classes.button}`]: {
          backgroundColor: 'inherit',
          visibility: 'visible',
        },
      },
    },

    // @ts-ignore
    statusRow: topAlignedStatusRowStyles,

    // @ts-ignore
    toggleRow: topAlignedToggleRowStyles,
  }))();
  const {
    classes: { robuxIconContainer },
  } = useManagementTableStyles();

  const { setModalConfigData, setModalOpen } = useModalStore();
  // TODO: Write logic for disabling delete icon
  const [toggleDisabled, setToggleDisabled] = useState(false);
  // TODO: When we have a call to fetch campaign using campaignId - use that instead
  const [editCampaignDrawerOpen, setEditCampaignDrawerOpen] = useState(false);
  const [showEditCampaignFailureMessage, setShowEditCampaignFailureMessage] = useState(false);
  const numCampaigns = useLimitInfoStore((state) => state.numCampaigns);

  const router = useRouter();

  const usersTimezone = organizationInfo.time_zone || DefaultTimeZone.value;

  const backendStatuses = useDisplayStatusesStore(
    (state: DisplayStatusesStoreType) => state.campaignStatuses,
  );
  const updateStatuses = useDisplayStatusesStore(
    (state: DisplayStatusesStoreType) => state.updateStatuses,
  );
  const setErrorStatuses = useDisplayStatusesStore(
    (state: DisplayStatusesStoreType) => state.setErrorStatuses,
  );

  const setRefreshFilter = useFilteringStore((state: TODOFIXANY) => state.setRefreshFilter);

  const updateDisplayStatuses = (campaignId: string) => {
    getUpdatedStatuses(campaignId)
      .then((statuses) => {
        updateStatuses(statuses);
      })
      .catch((error) => {
        CaptureException(error as Error);
        // Show error statuses if response did not come back successful
        const allAdsUnderCampaign = ads
          .filter((ad: TODOFIXANY) => {
            return ad.campaign_id === campaignId;
          })
          .map((ad) => ad.id);
        const allAdSetsUnderCampaign = adSets
          .filter((adSet: TODOFIXANY) => {
            return adSet.campaign_id === campaignId;
          })
          .map((adSet) => adSet.id);
        setErrorStatuses({
          adIds: allAdsUnderCampaign,
          adSetIds: allAdSetsUnderCampaign,
          campaignId,
        });
      });
  };

  const showPatchErrorModal = (errorResponse?: AMAErrorResponseType) => {
    const amaError = (errorResponse as AMAErrorResponseType)?.error;
    setModalConfigData({
      dialogActions: (
        <Button
          onClick={() => {
            setModalOpen(false);
          }}
          variant='outlined'>
          Close
        </Button>
      ),
      dialogContent: amaError?.message ? (
        <>
          <div>{amaError.message}</div>
          {amaError.code && (
            <div style={{ marginTop: '8px', opacity: 0.5 }}>
              Error Code: {String(amaError.code)}
            </div>
          )}
        </>
      ) : (
        'Something went wrong. Please try again later'
      ),
      handleClose: () => {
        setModalOpen(false);
      },
      title: 'Error',
    });
    setModalOpen(true);
  };

  const deleteCampaignRow = (campaignId: string) => {
    deleteCampaign(campaignId)
      .then((res: TODOFIXANY) => {
        if (res.status === 200) {
          const campaignsWithoutThisOne = campaigns!.filter((campaign: TODOFIXANY) => {
            return campaign.id !== campaignId;
          });

          setCampaigns(campaignsWithoutThisOne);

          getAdSets().then((adSetsres) => {
            setAdSets(adSetsres.ad_sets);
          });

          getAds().then((adsRes) => {
            setAds(adsRes.ads);
          });

          updateDisplayStatuses(campaignId);

          setModalOpen(false);
        } else {
          showPatchErrorModal();
        }
      })
      .catch(showPatchErrorModal);
  };

  const onDeleteIconClicked = (campaignId: string) => {
    setModalOpen(true);
    setModalConfigData({
      dialogActions: (
        <>
          <Button
            onClick={() => {
              setModalOpen(false);
            }}
            variant='outlined'>
            Cancel
          </Button>
          <Button
            onClick={() => {
              deleteCampaignRow(campaignId);
            }}
            variant='contained'>
            Delete
          </Button>
        </>
      ),
      dialogContent: `Deleting ${row.name} will remove all Ad Sets and Ads under this Campaign. This action cannot be undone.`,
      handleClose: () => {
        setModalOpen(false);
      },
      title: `Delete Campaign: ${row.name}?`,
    });
  };

  const onToggleClicked = (campaignId: string) => {
    setToggleDisabled(true);
    const campaignActive = ServerToClient.getBackendStatusIsOn(backendStatuses, campaignId);
    const toggleTo = campaignActive
      ? ServerCampaignStatusType.STOPPED
      : ServerCampaignStatusType.ENABLED;
    // @ts-ignore
    toggleCampaign(campaignId, toggleTo)
      .then((res: TODOFIXANY) => {
        if (res.status === 200) {
          const editedCampaignIndex = campaigns!.findIndex(
            (campaign) => campaign.id === campaignId,
          );
          if (editedCampaignIndex >= 0) {
            const newCampaigns = [...(campaigns || [])];
            newCampaigns[editedCampaignIndex] = {
              ...newCampaigns[editedCampaignIndex],
              status: toggleTo,
            };
            setCampaigns(newCampaigns);
            updateDisplayStatuses(campaignId);
          }
        } else {
          res.json().then((obj: AMAErrorResponseType) => {
            if (obj?.error?.code === ErrorCodes.FORBIDDEN_ACTION) {
              SetErrorModalImpersonationConfig(setModalOpen, setModalConfigData);
            } else showPatchErrorModal(obj);
          });
        }
      })
      .catch(showPatchErrorModal)
      .finally(() => {
        setToggleDisabled(false);
      });
    unifiedLogger.logClickEvent({
      eventName: EventName.ToggleEntity,
      parameters: {
        entityType: ConvertEntityTypeEnumToString(EntityType.ENTITY_TYPE_CAMPAIGN),
        toggleStateBefore: campaignActive.toString(),
      },
    });
  };

  const spendValue = ServerToClient.getEndUserSpend(row);
  const spendContent: TODOFIXANY = spendValue ? (
    <>
      <NumericFormat
        decimalScale={2}
        displayType='text'
        fixedDecimalScale
        thousandSeparator
        value={spendValue}
      />{' '}
      {getEndUserPaymentUnit(row)}
    </>
  ) : (
    UNAVAILABLE_VALUE_DISPLAY
  );

  const impressionValue = ServerToClient.getEndUserImpressions(row);
  const impressionContent: TODOFIXANY = impressionValue
    ? impressionValue.toLocaleString()
    : UNAVAILABLE_VALUE_DISPLAY;

  const CPMValue = ServerToClient.getEndUserCPM(row);
  const CPMContent: TODOFIXANY = CPMValue ? (
    <>
      <NumericFormat
        decimalScale={2}
        displayType='text'
        fixedDecimalScale
        thousandSeparator
        value={CPMValue}
      />{' '}
      {getEndUserPaymentUnit(row)}
    </>
  ) : (
    UNAVAILABLE_VALUE_DISPLAY
  );

  const clicksContent = ServerToClient.getEndUserClicks(row);
  const playsContent = ServerToClient.getEndUserPlays(row);
  const playRateContent = ServerToClient.getEndUserPlayRate(row);
  const CPPContent = ServerToClient.getEndUserCPP(row);
  const CTRContent = ServerToClient.getEndUserCTR(row);
  const CPCContent = ServerToClient.getEndUserCPC(row);
  const twoSecondViewsContent = ServerToClient.getEndUserTwoSecondViews(row);
  const fifteenSecondViewsContent = ServerToClient.getEndUserFifteenSecondViews(row);
  const CPV15Content = ServerToClient.getEndUserCPV15(row);
  const totalPlayTime7dContent = row.totalPlayTime7d;
  const totalRobuxRevenue30dContent = row.totalRobuxRevenue30d;

  const impersonationCookie = document.cookie.includes('ad-account-imp-info');

  const paymentMethodContent = row.paymentMethod;

  const handleCampaignEditSave = async (values: TODOFIXANY, actions: TODOFIXANY) => {
    if (impersonationCookie) {
      SetErrorModalImpersonationConfig(setModalOpen, setModalConfigData);
      return;
    }

    actions.setSubmitting(true);

    const { timezoneDbName } = GetTimezoneObjFromEnum(usersTimezone);

    updateCampaign(
      row.id,
      convertFormikDataToUpdateCampaignRequest(
        row,
        values,
        GetTimezoneObjFromEnum(usersTimezone)?.timezoneDbName,
      ),
    )
      .then((res: TODOFIXANY) => {
        if (res.status === 200) {
          // update display
          const editedCampaignIndex = campaigns!.findIndex((campaign) => campaign.id === row.id);
          if (editedCampaignIndex >= 0) {
            const newCampaigns = [...(campaigns || [])];
            let budgetInfo;
            if (values.campaignBudgetType === BudgetType.DAILY) {
              budgetInfo = {
                daily_budget_micro_usd: UsdToMicroUsd(values.campaignBudgetCapUsd),
              };
            }
            if (values.campaignBudgetType === BudgetType.LIFETIME) {
              budgetInfo = {
                lifetime_budget_micro_usd: UsdToMicroUsd(values.campaignBudgetCapUsd),
              };
            }
            newCampaigns[editedCampaignIndex] = {
              ...newCampaigns[editedCampaignIndex],
              advertiser_name: {
                value: values.campaignAdvertiserName,
              },
              ...(budgetInfo && { budget: budgetInfo }),
              end_timestamp_ms: values.campaignHasEndDate
                ? new Date(values.campaignEndTimestampMs).getTime() -
                  GetTimezoneOffsetMs(timezoneDbName)
                : 0,
              name: values.campaignName,
              start_timestamp_ms:
                new Date(values.campaignStartTimestampMs).getTime() -
                GetTimezoneOffsetMs(timezoneDbName),
            };
            setCampaigns(newCampaigns);
            updateDisplayStatuses(row.id);
            setRefreshFilter(FilterRefresh.FILTER_REFRESH_AFTER_EDIT);
            // show success banner
            onEditSuccess();
          }
          setEditCampaignDrawerOpen(false);
        } else {
          res.json().then((obj: AMAErrorResponseType) => {
            if (obj.error?.code === ErrorCodes.FORBIDDEN_ACTION) {
              SetErrorModalImpersonationConfig(setModalOpen, setModalConfigData);
            } else {
              // show error banner
              setShowEditCampaignFailureMessage(true);
            }
          });
        }
      })
      .catch((err) => {
        CaptureException(err as Error);
      });
  };

  const adAccountIsExternalManaged = useAppStore(
    (state: AppStoreType) => state.adAccountIsExternalManaged,
  );
  const adAccountIsInternalManaged = useAppStore(
    (state: AppStoreType) => state.adAccountIsInternalManaged,
  );

  const dailySpendLimitMicroUsd = useAppStore(
    (state) => state.advertiserState.data?.ad_account?.daily_spend_limit_micro_usd || 0,
  );
  const dailySpendLimitUsd = MicroUsdToUsd(dailySpendLimitMicroUsd);

  const currentValidationSchema = getEditCampaignValidationSchema(
    dailySpendLimitUsd,
    adAccountIsExternalManaged(),
    adAccountIsInternalManaged(),
    campaignMinimumDailyBudgetUsd,
    GetTimezoneObjFromEnum(usersTimezone)?.timezoneDbName,
  );

  const errorBanner = (
    // TODO: translation
    <Alert severity='error' variant='filled'>
      <AlertTitle>Unknown errors occurred while saving your edits</AlertTitle>Please try saving
      again or come back later.
    </Alert>
  );

  const editComponentDisabled = () =>
    ServerToClient.getBackendStatusDisabled(backendStatuses, row.id);

  const handleClickAway = (__: MouseEvent<Document>, reason: TODOFIXANY) => {
    if (reason === 'backdropClick') {
      setEditCampaignDrawerOpen(false);
    }
  };

  const editButtonComponent = (
    <>
      <Button
        className={button}
        color='primary'
        data-testid='edit-campaign-button'
        onClick={() => {
          setEditCampaignDrawerOpen(true);
          onEditClick();
          unifiedLogger.logClickEvent({
            eventName: EventName.EditButtonClicked,
            parameters: {
              entityType: ConvertEntityTypeEnumToString(EntityType.ENTITY_TYPE_CAMPAIGN),
            },
          });
        }}
        size='small'>
        <Typography className={iconWrapper} noWrap variant='largeLabel1'>
          <EditOutlinedIcon className={icon} />
          Edit
        </Typography>
      </Button>
      <Drawer
        anchor='right'
        onClose={handleClickAway}
        open={editCampaignDrawerOpen}
        PaperProps={{ style: { minWidth: 800, width: '60%' } }}>
        <Formik
          initialValues={getEditCampaignInitialValues(row)}
          validationSchema={currentValidationSchema}
          // eslint-disable-next-line
          onSubmit={handleCampaignEditSave}>
          {(formik) => (
            <div>
              {showEditCampaignFailureMessage && errorBanner}
              <EditCampaignComponent
                disableEdit={editComponentDisabled()}
                disableStartDateInput={row.start_timestamp_ms < Date.now()}
                formikInfo={formik}
                onCancelClick={() => {
                  setEditCampaignDrawerOpen(false);
                  setShowEditCampaignFailureMessage(false);
                }}
                paymentType={row.payment_type}
              />
            </div>
          )}
        </Formik>
      </Drawer>
    </>
  );

  let effectiveDailyBudget;
  if (row.budget.daily_budget_micro_usd) {
    effectiveDailyBudget = row.budget.daily_budget_micro_usd;
  } else if (row.budget.lifetime_budget_micro_usd) {
    const campaignDuration = getDurationInDays(
      row.start_timestamp_ms,
      row.end_timestamp_ms,
      GetTimezoneObjFromEnum(usersTimezone)?.timezoneDbName,
    );
    effectiveDailyBudget = row.budget.lifetime_budget_micro_usd / campaignDuration;
  }

  const adCreditBalance = useAppStore(
    (state) => state.adCreditState.data?.ad_credit_balance_in_micro || 0,
  );

  const requiredAdditionalAdCredit = (effectiveDailyBudget || 0) - adCreditBalance;

  const disableToggleBecauseInsufficientAdCredit =
    (GetBackendCampaignStatusText(backendStatuses, row.id) === StatusText.DISPLAY_STATUS_PAUSED ||
      GetBackendCampaignStatusText(backendStatuses, row.id) ===
        StatusText.DISPLAY_STATUS_AUTO_PAUSED) &&
    row.payment_type === ServerPaymentType.PAYMENT_TYPE_ADS_CREDIT &&
    requiredAdditionalAdCredit > 0;

  const insufficientAdCreditToggleTooltipElement = (
    <span>
      {GetTooltipText(insufficientAdCreditToggleTooltip, {
        '_{credits}': MicroUsdToUsdStringRoundedDown(requiredAdditionalAdCredit),
      })}
      <NextLink
        href={{
          pathname: Routes.ADD_PAYMENT,
          query: { action: PaymentMethodActionEnum.RELOAD_AD_CREDIT },
        }}
        style={{ textDecoration: 'underline' }}>
        add credit.
      </NextLink>
    </span>
  );

  const cancelCampaignRow = (campaignId: string) => {
    if (impersonationCookie) {
      SetErrorModalImpersonationConfig(setModalOpen, setModalConfigData);
      return;
    }

    cancelCampaign(campaignId)
      .then((res: TODOFIXANY) => {
        if (res.status === 200) {
          const editedCampaignIndex = campaigns!.findIndex(
            (campaign) => campaign.id === campaignId,
          );
          if (editedCampaignIndex >= 0) {
            const newCampaigns = [...(campaigns || [])];
            newCampaigns[editedCampaignIndex] = {
              ...newCampaigns[editedCampaignIndex],
              status: ServerCampaignStatusType.CANCELLED,
            };
            setCampaigns(newCampaigns);
          }

          updateDisplayStatuses(campaignId);
          onCancelSuccess();
          setModalOpen(false);
        } else {
          res.json().then((obj: AMAErrorResponseType) => {
            if (obj?.error?.code === ErrorCodes.FORBIDDEN_ACTION) {
              SetErrorModalImpersonationConfig(setModalOpen, setModalConfigData);
            } else {
              setModalOpen(false);
              onCancelFailure();
            }
          });
        }
      })
      .catch(showPatchErrorModal);
    unifiedLogger.logClickEvent({ eventName: EventName.CancelCampaign });
  };

  const onCancelIconClicked = () => {
    setModalOpen(true);
    setModalConfigData({
      dialogActions: (
        <>
          <Button
            color='primary'
            onClick={() => {
              setModalOpen(false);
            }}
            variant='outlined'>
            Go back
          </Button>
          <Button
            onClick={() => {
              cancelCampaignRow(row.id);
            }}
            variant='contained'>
            Cancel Campaign
          </Button>
        </>
      ),
      dialogContent: (
        <Grid container>
          <p>
            You’re about to cancel this upcoming campaign. This can’t be undone, but don’t worry —
            you won’t be charged.
          </p>
        </Grid>
      ),
      handleClose: () => {
        setModalOpen(false);
      },
      title: 'Cancel Campaign',
    });
  };

  const cancelButtonDisabled = () => {
    if (
      row.start_timestamp_ms - Date.now() < cancelCampaignTimeBufferMs ||
      row.status === ServerCampaignStatusType.CANCELLED
    ) {
      return true;
    }
    return false;
  };

  const getCancelTooltipTitle = () => {
    if (row.status === ServerCampaignStatusType.CANCELLED) {
      return 'The campaign is already canceled.';
    }
    if (row.start_timestamp_ms - Date.now() < cancelCampaignTimeBufferMs) {
      return `You can only cancel a campaign up to ${MillisecondsToHours(
        cancelCampaignTimeBufferMs,
      )} hours before its scheduled time.`;
    }
    return 'Cancel the campaign';
  };

  const cancelButtonComponent = (
    <Tooltip
      disableHoverListener={!cancelButtonDisabled()}
      placement='bottom-start'
      title={getCancelTooltipTitle()}>
      <span>
        <Button
          className={button}
          color='primary'
          disabled={cancelButtonDisabled()}
          onClick={() => {
            onCancelIconClicked();
          }}
          size='small'>
          <Typography className={iconWrapper} noWrap variant='largeLabel1'>
            <HighlightOffIcon className={icon} />
            Cancel
          </Typography>
        </Button>
      </span>
    </Tooltip>
  );

  const getDuplicateTooltipTitle = () => {
    if (hasNoPaymentMethod && !(adAccountIsExternalManaged() || adAccountIsInternalManaged())) {
      return 'No payment method on file';
    }
    if (!row?.cloningData?.isCampaignCapableOfDuplication) {
      return 'Campaign contains multiple ad sets or ads.';
    }
    if (row?.objective === 'Video Views') {
      return 'Legacy Video Views campaigns cannot be duplicated.';
    }
    if (numCampaigns >= campaignLimit) {
      return 'You have reached the maximum number of campaigns allowed.';
    }

    return null;
  };

  const duplicateTooltipTitle = getDuplicateTooltipTitle();

  const duplicateButtonComponent = (
    <Tooltip placement='bottom-start' title={duplicateTooltipTitle}>
      <span>
        <Button
          className={button}
          color='primary'
          disabled={Boolean(duplicateTooltipTitle)}
          onClick={() => {
            router
              .push(
                {
                  pathname: Routes.CREATE_CAMPAIGN,
                  query: {
                    adIdToClone: row?.cloningData?.adIdToClone,
                    adSetIdToClone: row?.cloningData?.adSetIdToClone,
                    campaignIdToClone: row?.id,
                    currStep: 3,
                  },
                },
                // Do not expose query parameters in URL
                Routes.CREATE_CAMPAIGN,
              )
              .then(() => {
                unifiedLogger.logClickEvent({
                  eventName: EventName.CloneCampaign,
                  parameters: { campaignId: row?.id },
                });
              });
          }}
          size='small'>
          <Typography className={iconWrapper} noWrap variant='largeLabel1'>
            <FileCopyOutlinedIcon className={icon} />
            Duplicate
          </Typography>
        </Button>
      </span>
    </Tooltip>
  );

  const onRowCheckboxClicked = async (__: TODOFIXANY, newVal: boolean) => {
    let newSeletedCampaignIds: string[] = [];

    if (newVal === true) {
      newSeletedCampaignIds = selectedCampaigns.concat(row.id);
    } else {
      newSeletedCampaignIds = selectedCampaigns.filter(
        (campaignId: TODOFIXANY) => campaignId !== row.id,
      );
    }

    setSelectedCampaigns(newSeletedCampaignIds);

    setSelectedAdSetsLoading(true);

    setSelectedAdSets(
      adSets
        .filter((adSetObj: TODOFIXANY) => newSeletedCampaignIds.includes(adSetObj.campaign_id))
        .map((adSetObj: TODOFIXANY) => adSetObj.id),
    );
    setSelectedAdSetsLoading(false);

    setSelectedAdsLoading(true);

    setSelectedAds(
      ads.filter((adObj: ServerGetAdRowResponse) => {
        return newSeletedCampaignIds.includes(adObj.campaign_id);
      }),
    );
    setSelectedAdsLoading(false);
  };

  const clipboardContent = `Campaign ID: ${row.id}`;

  const query: TODOFIXANY = {
    selectedCampaign: row.id,
    tableView: HOME_PAGE_TABLE_VIEWS.adSets,
  };

  const onNameClicked = async () => {
    setSelectedCampaigns([row.id]);

    setSelectedAdSetsLoading(true);

    setSelectedAdSets(
      adSets
        .filter((adSetObj: ServerGetAdSetRowResponse) => {
          return [row.id].includes(adSetObj.campaign_id);
        })
        .map((adSetObj: ServerGetAdSetRowResponse) => adSetObj.id),
    );
    setSelectedAdSetsLoading(false);

    setSelectedAdsLoading(true);

    setSelectedAds(
      ads.filter((adObj: TODOFIXANY) => {
        return [row.id].includes(adObj.campaign_id);
      }),
    );
    setSelectedAdsLoading(false);

    router.push({
      pathname: Routes.CLASSIC,
      query,
    });
  };

  const campaignStatus = GetBackendCampaignStatusText(backendStatuses, row.id);
  const campaignStatusTooltipKey = statusTextToTooltipKey.get(campaignStatus);
  const campaignStatusTooltipContent = campaignStatusTooltipKey
    ? translateHTML(
        campaignStatusTooltipKey,
        getStatusTooltipLinkTags(campaignStatus, row.universe_id),
      )
    : undefined;

  let toggleTooltipText: ReactNode;
  if (IsCompletedStatus(campaignStatus)) {
    toggleTooltipText = GetTooltipText(completedCampaignToggleTooltip);
  } else if (disableToggleBecauseInsufficientAdCredit) {
    toggleTooltipText = insufficientAdCreditToggleTooltipElement;
  }

  const rowCells = [
    {
      cell: (
        <TableNameCell
          align={headerAlignments[0]}
          cancelButton={cancelButtonComponent}
          className={nameRow}
          copyToClipboardContent={clipboardContent}
          duplicateButton={duplicateButtonComponent}
          editButton={editButtonComponent}
          name={row.name}
          onNameClicked={onNameClicked}
          onRowChange={onRowCheckboxClicked}
          rowChecked={selectedCampaigns.includes(row.id)}
          rowType={RowType.Campaign}
          tooltipTextToDisplay={clipboardContent}
        />
      ),
      id: 'name',
    },
    {
      cell: (
        <CampaignTableToggleCell
          align={headerAlignments[1]}
          campaignOn={ServerToClient.getBackendStatusIsOn(backendStatuses, row.id)}
          className={toggleRow}
          onToggleClicked={() => {
            return onToggleClicked(row.id);
          }}
          toggleDisabled={
            !adTogglingShouldBeEnabled(row.payment_type) ||
            ServerToClient.getBackendStatusDisabled(backendStatuses, row.id) ||
            toggleDisabled ||
            disableToggleBecauseInsufficientAdCredit
          }
          toggleDisabledTooltip={toggleTooltipText}
        />
      ),
      id: 'active',
    },
    {
      cell: (
        <TableCell align={headerAlignments[2]} className={statusRow}>
          <StatusLabel status={campaignStatus} tooltipContent={campaignStatusTooltipContent} />
        </TableCell>
      ),
      id: 'statusText',
    },
    {
      cell: (
        <TableCell align='right' className={contentRow}>
          {spendContent}
        </TableCell>
      ),
      id: 'spent',
    },
    {
      cell: (
        <TableCell align='right' className={contentRow}>
          {impressionContent}
        </TableCell>
      ),
      id: 'impressions',
    },
    {
      cell: (
        <TableCell align='right' className={contentRow}>
          {CPMContent}
        </TableCell>
      ),
      id: 'cpm',
    },
    {
      cell: (
        <TableCell align='right' className={contentRow}>
          {twoSecondViewsContent}
        </TableCell>
      ),
      id: 'twoSecondViews',
    },
    {
      cell: (
        <TableCell align='right' className={contentRow}>
          {fifteenSecondViewsContent}
        </TableCell>
      ),
      id: 'fifteenSecondViews',
    },
    {
      cell: (
        <TableCell align='right' className={contentRow}>
          {CPV15Content}
        </TableCell>
      ),
      id: 'cpv15',
    },
    {
      cell: (
        <TableCell align='right' className={contentRow}>
          {clicksContent}
        </TableCell>
      ),
      id: 'clicks',
    },
    {
      cell: (
        <TableCell align='right' className={contentRow}>
          {CTRContent}
        </TableCell>
      ),
      id: 'ctr',
    },
    {
      cell: (
        <TableCell align='right' className={contentRow}>
          {CPCContent}
        </TableCell>
      ),
      id: 'cpc',
    },
    {
      cell: (
        <TableCell align='right' className={contentRow}>
          {playsContent}
        </TableCell>
      ),
      id: 'plays',
    },
    {
      cell: (
        <TableCell align='right' className={contentRow}>
          {playRateContent}
        </TableCell>
      ),
      id: 'playRate',
    },
    {
      cell: (
        <TableCell align='right' className={contentRow}>
          {CPPContent}
        </TableCell>
      ),
      id: 'cpp',
    },
    {
      cell: (
        <TableCell align='right' className={contentRow}>
          {totalPlayTime7dContent}
        </TableCell>
      ),
      id: 'totalPlayTime7d',
    },
    {
      cell: (
        <TableCell align='right' className={contentRow}>
          <div className={robuxIconContainer}>
            {totalRobuxRevenue30dContent !== UNAVAILABLE_VALUE_DISPLAY && (
              <RobuxIcon fontSize='small' />
            )}
            {totalRobuxRevenue30dContent}
          </div>
        </TableCell>
      ),
      id: 'totalRobuxRevenue30d',
    },
    {
      cell: <CampaignTableBudgetCell align='right' campaignRow={row} className={contentRow} />,
      id: 'budgetUsd',
    },
    {
      cell: (
        <TableCell align='left' className={contentRow}>
          {row.objective}
        </TableCell>
      ),
      id: 'objective',
    },
    {
      cell: (
        <CampaignTableDateCell
          align='left'
          className={contentRow}
          endTimestampMs={row.end_timestamp_ms!}
          startTimestampMs={row.start_timestamp_ms!}
          timezone={GetTimezoneObjFromEnum(usersTimezone)?.timezoneDbName}
        />
      ),
      id: 'schedule',
    },
    {
      cell: (
        <TableCell align='left' className={contentRow}>
          {paymentMethodContent}
        </TableCell>
      ),
      id: 'paymentMethod',
    },
  ];

  const rowCellsToRender: ReactNode[] = getDisplayedRowCells(
    rowCells,
    adFormats,
    campaignsTableAdFormatRenderMap,
    false, // do not include creative column in campaign table
  ).map((cellObject) => cellObject.cell);

  return (
    <TableRow classes={{ root: rowContainer }} key={row.name}>
      {rowCellsToRender}
      {showFinalColumns && (
        <TableCell align='right' className={contentRow}>
          <Tooltip placement='bottom' title={`Delete the "${row.name}" campaign`}>
            <IconButton
              aria-label='delete-button'
              classes={{ root: iconButton }}
              color='primary'
              data-testid='campaign-delete-button'
              disabled={false}
              onClick={() => {
                onDeleteIconClicked(row.id);
              }}>
              <DeleteOutlinedIcon />
            </IconButton>
          </Tooltip>
        </TableCell>
      )}
    </TableRow>
  );
};

const CampaignTableSummaryRow = ({
  adFormats,
  firstColumnContent,
  showFinalColumns,
  tableSummaryRowData,
}: TODOFIXANY) => {
  const {
    classes: { tableStickyFooter },
  } = makeStyles()((theme) => ({
    tableStickyFooter: {
      background: theme.palette.content.static.dark,
      bottom: 0,
      position: 'sticky',
      transform: 'translateZ(0)',
      zIndex: 1000,
    },
  }))();
  const {
    classes: { robuxIconContainer },
  } = useManagementTableStyles();

  let spendContent: TODOFIXANY = UNAVAILABLE_VALUE_DISPLAY;

  if (tableSummaryRowData?.chargeable_spend_micro_usd || tableSummaryRowData?.display_spending) {
    const spendContentValue = microUsdToUsd(
      tableSummaryRowData?.display_spending || tableSummaryRowData?.chargeable_spend_micro_usd,
    );
    spendContent = (
      <>
        <NumericFormat
          decimalScale={2}
          displayType='text'
          fixedDecimalScale
          thousandSeparator
          value={spendContentValue}
        />{' '}
        {getEndUserPaymentUnit(tableSummaryRowData)}
      </>
    );
  }

  const { adCreditEndUserSpendString, usdEndUserSpendString } =
    ServerToClient.getEndUserSpendSummary(tableSummaryRowData);

  if (usdEndUserSpendString && adCreditEndUserSpendString) {
    spendContent = (
      <>
        <Typography variant='subtitle2'>{usdEndUserSpendString}</Typography> <br />
        <Typography variant='subtitle2'>{adCreditEndUserSpendString}</Typography>
      </>
    );
  } else if (usdEndUserSpendString) {
    spendContent = <Typography variant='subtitle2'>{usdEndUserSpendString}</Typography>;
  } else if (adCreditEndUserSpendString) {
    spendContent = <Typography variant='subtitle2'>{adCreditEndUserSpendString}</Typography>;
  }

  let impressionContent: TODOFIXANY = UNAVAILABLE_VALUE_DISPLAY;

  if (tableSummaryRowData?.impression_count) {
    impressionContent = Number(tableSummaryRowData?.impression_count).toLocaleString();
  }

  const totalClicksContent = ServerToClient.getEndUserClicks(tableSummaryRowData);
  const totalPlaysContent = ServerToClient.getEndUserPlays(tableSummaryRowData);
  const averagePlayRateContent = ServerToClient.getEndUserPlayRateSummary(tableSummaryRowData);
  const { adCreditEndUserCPPString, usdEndUserCPPString } =
    ServerToClient.getEndUserCPPSummary(tableSummaryRowData);
  const totalTwoSecondViewsContent = ServerToClient.getEndUserTwoSecondViews(tableSummaryRowData);
  const totalFifteenSecondViewsContent =
    ServerToClient.getEndUserFifteenSecondViews(tableSummaryRowData);

  let averageCPC: TODOFIXANY = UNAVAILABLE_VALUE_DISPLAY;
  const { performance = {} } = tableSummaryRowData;
  const { averageAdCreditCPC, averageUSDCPC } = performance;

  if (averageAdCreditCPC && averageUSDCPC) {
    averageCPC = (
      <>
        <Typography variant='subtitle2'>{toUsdString(averageUSDCPC)}</Typography> <br />
        <Typography variant='subtitle2'>{toAdCreditString(averageAdCreditCPC)}</Typography>
      </>
    );
  } else if (averageUSDCPC) {
    averageCPC = <Typography variant='subtitle2'>{toUsdString(averageUSDCPC)}</Typography>;
  } else if (averageAdCreditCPC) {
    averageCPC = (
      <Typography variant='subtitle2'>{toAdCreditString(averageAdCreditCPC)}</Typography>
    );
  }

  let averageCTR: TODOFIXANY = UNAVAILABLE_VALUE_DISPLAY;

  if (tableSummaryRowData?.click_count && tableSummaryRowData?.impression_count) {
    averageCTR = (
      <Typography variant='subtitle2'>
        {`${ToFixedNoRounding(
          (Number(tableSummaryRowData?.click_count) /
            Number(tableSummaryRowData?.impression_count)) *
            100,
          2,
        )}%`}
      </Typography>
    );
  }

  let averageCPP: TODOFIXANY = UNAVAILABLE_VALUE_DISPLAY;
  if (usdEndUserCPPString && adCreditEndUserCPPString) {
    averageCPP = (
      <>
        <Typography variant='subtitle2'>{usdEndUserCPPString}</Typography> <br />
        <Typography variant='subtitle2'>{adCreditEndUserCPPString}</Typography>
      </>
    );
  } else if (usdEndUserCPPString) {
    averageCPP = <Typography variant='subtitle2'>{usdEndUserCPPString}</Typography>;
  } else if (adCreditEndUserCPPString) {
    averageCPP = <Typography variant='subtitle2'>{adCreditEndUserCPPString}</Typography>;
  }

  let averageCPM: TODOFIXANY = UNAVAILABLE_VALUE_DISPLAY;

  if (Number(tableSummaryRowData?.average_cost_per_mille)) {
    const averageCPMValue = tableSummaryRowData.average_cost_per_mille / 1000000;
    averageCPM = (
      <>
        <NumericFormat
          decimalScale={2}
          displayType='text'
          fixedDecimalScale
          thousandSeparator
          value={averageCPMValue}
        />{' '}
        {getEndUserPaymentUnit(tableSummaryRowData)}
      </>
    );
  }

  const { adCreditEndUserCPMString, usdEndUserCPMString } =
    ServerToClient.getEndUserCPMSummary(tableSummaryRowData);
  if (usdEndUserCPMString && adCreditEndUserCPMString) {
    averageCPM = (
      <>
        <Typography variant='subtitle2'>{usdEndUserCPMString}</Typography> <br />
        <Typography variant='subtitle2'>{adCreditEndUserCPMString}</Typography>
      </>
    );
  } else if (usdEndUserCPMString) {
    averageCPM = <Typography variant='subtitle2'>{usdEndUserCPMString}</Typography>;
  } else if (adCreditEndUserCPMString) {
    averageCPM = <Typography variant='subtitle2'>{adCreditEndUserCPMString}</Typography>;
  }

  let averageCPV15: TODOFIXANY = UNAVAILABLE_VALUE_DISPLAY;

  if (Number(tableSummaryRowData?.cost_per_fifteen_sec_video_view_usd)) {
    const averageCPV15Value = tableSummaryRowData.cost_per_fifteen_sec_video_view_usd;
    averageCPV15 = (
      <>
        <NumericFormat
          decimalScale={3}
          displayType='text'
          fixedDecimalScale
          thousandSeparator
          value={averageCPV15Value}
        />{' '}
        {getEndUserPaymentUnit(tableSummaryRowData)}
      </>
    );
  }

  const totalPlayTime7dContent = ServerToClient.getEndUserTotalPlayTime7d(tableSummaryRowData);
  const totalRobuxRevenue30dContent =
    ServerToClient.getEndUserTotalRobuxRevenue30d(tableSummaryRowData);

  let firstThreeCells = (
    <>
      {/*
      // @ts-ignore */}
      <SummaryRowCell align='left' style={{ ...nameRowStyles, background: contentStaticDark }} />
      {/*
      // @ts-ignore */}
      <SummaryRowCell align='right' style={{ ...toggleRowStyles, background: contentStaticDark }} />
      {/*
      // @ts-ignore */}
      <SummaryRowCell align='right' style={{ ...statusRowStyles, background: contentStaticDark }} />
    </>
  );

  if (firstColumnContent) {
    firstThreeCells = (
      <TableCell
        align='left'
        colSpan={3}
        style={{ ...nameRowStyles, background: contentStaticDark }}>
        {firstColumnContent}
      </TableCell>
    );
  }

  const spendCell = (
    <SummaryRowCell align='right'>
      <Typography variant='subtitle2'>{spendContent}</Typography>
      <br />
      <Typography variant='footer'>Total</Typography>
    </SummaryRowCell>
  );

  const spacingCell = <SummaryRowCell align='right' />;

  const summaryCells = [
    {
      cell: (
        <SummaryRowCell align='right'>
          <Typography variant='subtitle2'>{impressionContent}</Typography>
          <br />
          <Typography variant='footer'>Total</Typography>
        </SummaryRowCell>
      ),
      id: 'impressions',
    },
    {
      cell: (
        <SummaryRowCell align='right'>
          <Typography variant='subtitle2'>{averageCPM}</Typography>
          <br />
          <Typography variant='footer'>Average</Typography>
        </SummaryRowCell>
      ),
      id: 'cpm',
    },
    {
      cell: (
        <SummaryRowCell align='right'>
          {totalTwoSecondViewsContent}
          <br />
          <Typography variant='footer'>Total</Typography>
        </SummaryRowCell>
      ),
      id: 'twoSecondViews',
    },
    {
      cell: (
        <SummaryRowCell align='right'>
          {totalFifteenSecondViewsContent}
          <br />
          <Typography variant='footer'>Total</Typography>
        </SummaryRowCell>
      ),
      id: 'fifteenSecondViews',
    },
    {
      cell: (
        <SummaryRowCell align='right'>
          {averageCPV15}
          <br />
          <Typography variant='footer'>Average</Typography>
        </SummaryRowCell>
      ),
      id: 'cpv15',
    },
    {
      cell: (
        <SummaryRowCell align='right'>
          <Typography variant='subtitle2'>
            {totalClicksContent}
            <br />
            <Typography variant='footer'>Total</Typography>
          </Typography>
        </SummaryRowCell>
      ),
      id: 'clicks',
    },
    {
      cell: (
        <SummaryRowCell align='right'>
          {averageCTR}
          <br />
          <Typography variant='footer'>Average</Typography>
        </SummaryRowCell>
      ),
      id: 'ctr',
    },
    {
      cell: (
        <SummaryRowCell align='right'>
          {averageCPC}
          <br />
          <Typography variant='footer'>Average</Typography>
        </SummaryRowCell>
      ),
      id: 'cpc',
    },
    {
      cell: (
        <SummaryRowCell align='right'>
          <Typography variant='subtitle2'>
            {totalPlaysContent}
            <br />
            <Typography variant='footer'>Total</Typography>
          </Typography>
        </SummaryRowCell>
      ),
      id: 'plays',
    },
    {
      cell: (
        <SummaryRowCell align='right'>
          <Typography variant='subtitle2'>{averagePlayRateContent}</Typography>
          <br />
          <Typography variant='footer'>Average</Typography>
        </SummaryRowCell>
      ),
      id: 'playRate',
    },
    {
      cell: (
        <SummaryRowCell align='right'>
          {averageCPP}
          <br />
          <Typography variant='footer'>Average</Typography>
        </SummaryRowCell>
      ),
      id: 'cpp',
    },
    {
      cell: (
        <SummaryRowCell align='right'>
          <Typography variant='subtitle2'>{totalPlayTime7dContent}</Typography>
          <br />
          <Typography variant='footer'>Total</Typography>
        </SummaryRowCell>
      ),
      id: 'totalPlayTime7d',
    },
    {
      cell: (
        <SummaryRowCell align='right'>
          <div className={robuxIconContainer}>
            {totalRobuxRevenue30dContent !== UNAVAILABLE_VALUE_DISPLAY && (
              <RobuxIcon fontSize='small' />
            )}
            <Typography variant='subtitle2'>{totalRobuxRevenue30dContent}</Typography>
          </div>
          <Typography variant='footer'>Total</Typography>
        </SummaryRowCell>
      ),
      id: 'totalRobuxRevenue30d',
    },
  ];

  const summaryCellsToRender: ReactNode[] = getDisplayedRowCells(
    summaryCells,
    adFormats,
    campaignsTableAdFormatRenderMap,
    false, // do not include creative column in campaign table
  ).map((cellObject) => cellObject.cell);
  /*
   firstThreeCells contains pagination related components and is not dynamic.
   It should not be moved or included in the campaignsTableAdFormatRenderMap.

   spendCell and spacingCell also should not be moved. The spacing cell aligns
   with the budget column which is between the spend column and the remaining
   summary columns.
   */
  return (
    <TableRow classes={{ root: tableStickyFooter }} key={tableSummaryRowData.name}>
      {firstThreeCells}
      {spendCell}
      {summaryCellsToRender}
      <SummaryRowCell align='right' />
      <SummaryRowCell align='right' />
      <SummaryRowCell align='left' />
      {showFinalColumns && <SummaryRowCell align='right' />}
      {spacingCell}
    </TableRow>
  );
};

export const CampaignManagementTable = ({
  adFormats,
  hasNoPaymentMethod,
  inFilterView,
  loadMore,
  nextCursor,
  onCancelFailure,
  onCancelSuccess,
  onEditClick,
  onEditSuccess,
  rows,
  showDelete,
  tableSummaryRowData,
}: CampaignManagementTableProps): TODOFIXANY => {
  const { ads, adSets } = useAppStore((state: AppStoreType) => state.appData);

  const backendStatuses = useDisplayStatusesStore(
    (state: DisplayStatusesStoreType) => state.campaignStatuses,
  );

  let totalAdCreditClicks = 0;
  let totalAdCreditSpend = 0;
  let totalUSDClicks = 0;
  let totalUSDSpend = 0;

  if (rows) {
    const transformedRows = rows.map((rowObj: TODOFIXANY) => {
      const { budgetUsd } = ServerToClient.getEndUserCampaignBudgetInfo(rowObj);
      const newRow = { ...rowObj };
      newRow.statusText = GetBackendCampaignStatusText(backendStatuses, rowObj.id);
      newRow.objective = ServerToClient.getEndUserCampaignObjectiveText(rowObj);
      newRow.schedule = rowObj.start_timestamp_ms;
      newRow.budgetUsd = budgetUsd;
      newRow.spent = ServerToClient.getEndUserSpend(rowObj);
      newRow.clicks = ServerToClient.getEndUserClicks(rowObj);
      newRow.ctr = ServerToClient.getEndUserCTR(rowObj);
      newRow.cpc = ServerToClient.getEndUserCPC(rowObj);
      newRow.plays = ServerToClient.getEndUserPlays(rowObj);
      newRow.playRate = ServerToClient.getEndUserPlayRate(rowObj);
      newRow.cpp = ServerToClient.getEndUserCPP(rowObj);
      newRow.impressions = ServerToClient.getEndUserImpressions(rowObj);
      newRow.cpm = ServerToClient.getEndUserCPM(rowObj);
      newRow.teleports = ServerToClient.getEndUserTeleports(rowObj);
      newRow.teleportRate = ServerToClient.getEndUserTeleportRate(rowObj);
      newRow.cpt = ServerToClient.getEndUserCPT(rowObj);
      newRow.twoSecondViews = ServerToClient.getEndUserTwoSecondViews(rowObj);
      newRow.fifteenSecondViews = ServerToClient.getEndUserFifteenSecondViews(rowObj);
      newRow.cpv15 = ServerToClient.getEndUserCPV15(rowObj);
      newRow.totalPlayTime7d = ServerToClient.getEndUserTotalPlayTime7d(rowObj);
      newRow.totalRobuxRevenue30d = ServerToClient.getEndUserTotalRobuxRevenue30d(rowObj);

      newRow.paymentMethod = ServerToClient.getEndUserPaymentType(rowObj);
      newRow.performance = rowObj.performance;
      newRow.cloningData = ServerToClient.getCampaignCloningData(rowObj.id, adSets, ads);
      if (newRow.paymentMethod === END_USER_AD_CREDIT_PAYMENT_TYPE) {
        if (newRow?.performance?.click_count) {
          totalAdCreditClicks += newRow.performance.click_count;
        }

        if (newRow?.performance?.spend_micro_usd) {
          totalAdCreditSpend += newRow.performance.spend_micro_usd / MICRO_USD_IN_USD;
        }
      } else {
        if (newRow?.performance?.click_count) {
          totalUSDClicks += newRow.performance.click_count;
        }

        if (newRow?.performance?.spend_micro_usd) {
          totalUSDSpend += newRow.performance.spend_micro_usd / MICRO_USD_IN_USD;
        }
      }

      newRow.advertiser_name = rowObj.advertiser_name?.value || '';

      return newRow;
    });

    let finalSummaryRowData = tableSummaryRowData;

    if (inFilterView) {
      const {
        filteredTableSummaryRowData,
        filteredTotalAdCreditClicks,
        filteredTotalAdCreditSpend,
        filteredTotalUSDClicks,
        filteredTotalUSDSpend,
      } = ServerToClient.getSummaryForFilteredRows(transformedRows);
      finalSummaryRowData = {
        ...filteredTableSummaryRowData,
        name: 'filtered-campaigns-summary-row',
      };
      totalUSDSpend = filteredTotalUSDSpend;
      totalAdCreditSpend = filteredTotalAdCreditSpend;
      totalUSDClicks = filteredTotalUSDClicks;
      totalAdCreditClicks = filteredTotalAdCreditClicks;
    }

    let averageUSDCPC = 0;

    if (totalUSDSpend && totalUSDClicks) {
      averageUSDCPC = totalUSDSpend / totalUSDClicks;
    }

    let averageAdCreditCPC = 0;

    if (totalAdCreditSpend && totalAdCreditClicks) {
      averageAdCreditCPC = totalAdCreditSpend / totalAdCreditClicks;
    }

    const augmentedTableSummaryRowData = {
      ...finalSummaryRowData,
      averageAdCreditCPC,
      averageUSDCPC,
    };

    return (
      <GenericManagementTable
        adFormats={adFormats}
        hasNoPaymentMethod={hasNoPaymentMethod}
        headCells={getDisplayedHeadCells(
          getHeadCells(),
          adFormats,
          campaignsTableAdFormatRenderMap,
          false, // do not include creative column in campaign table
        )}
        headCellsFinalColumns={headCellsFinalColumns}
        headCellsWithData={headCellsWithData}
        loadMore={loadMore}
        nextCursor={nextCursor}
        onCancelFailure={onCancelFailure}
        onCancelSuccess={onCancelSuccess}
        onEditClick={onEditClick}
        onEditSuccess={onEditSuccess}
        paginationEnabled
        rows={transformedRows}
        showFinalColumns={showDelete}
        TableRowElement={CampaignTableRow}
        tableSummaryRowData={{
          ...finalSummaryRowData,
          performance: augmentedTableSummaryRowData,
        }}
        TableSummaryRowElement={CampaignTableSummaryRow}
        tableView={HOME_PAGE_TABLE_VIEWS.campaigns}
      />
    );
  }
  return null;
};
