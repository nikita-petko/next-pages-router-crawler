import {
  Alert,
  AlertTitle,
  Button,
  DeleteOutlinedIcon,
  Drawer,
  EditOutlinedIcon,
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
import { useRouter } from 'next/router';
import { MouseEvent, ReactNode, useState } from 'react';
import { NumericFormat } from 'react-number-format';

import { EventName, unifiedLogger } from '@clients/unifiedLogger';
import StatusLabel from '@components/reporting/StatusLabel';
import { AdFormatDisplayType } from '@constants/ad';
import { getStatusTooltipLinkTags, statusTextToTooltipKey } from '@constants/campaignStatus';
import { contentStaticDark } from '@constants/colors';
import { UNAVAILABLE_VALUE_DISPLAY } from '@constants/displayConstants';
import { EntityType } from '@constants/entity';
import ErrorCodes from '@constants/errorCodes';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import {
  deleteAdSet,
  getAds,
  getUpdatedStatuses,
  toggleAdSet,
  updateAdSet,
} from '@modules/clients/ads/adsClient';
import { ServerAdFormatType } from '@modules/clients/ads/adsClientTypes';
import {
  convertFormikDataToUpdateAdSetRequest,
  END_USER_AD_CREDIT_PAYMENT_TYPE,
  END_USER_CARD_PAYMENT_TYPE,
  getEndUserAdSetPlacement,
  getEndUserPaymentType,
  getEndUserPaymentUnit,
  mapServerAdTypeToFormik,
  MICRO_USD_IN_USD,
  microUsdToUsd,
  roundFloatDownToTwoDecimals,
  ServerToClient,
  toAdCreditString,
  toUsdString,
} from '@modules/clients/ads/serverClientTransformationUtilities';
import { FilterRefresh } from '@modules/filtering/utils/filterEnums';
import useManagementTableStyles from '@modules/management/components/managementTableStyles';
import {
  editAdSetValidationSchema,
  getEditAdSetInitialValues,
} from '@modules/management/models/editAdSetComponentModel';
import SummaryRowCell from '@modules/miscellaneous/common/components/SummaryRowCell';
import { GetTooltipText } from '@modules/miscellaneous/utils/tooltipStrings';
import {
  DisplayStatusesStoreType,
  useDisplayStatusesStore,
} from '@modules/stores/displayStatusStoreProvider';
import useFilteringStore from '@modules/stores/filteringStoreProvider';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { useModalStore } from '@stores/modalStoreProvider';
import { ServerGetAdRowResponse } from '@type/ad';
import { ServerAdSetStatusType } from '@type/adSet';
import { TableSummaryRowData } from '@type/classicTables';
import { AMAErrorResponseType } from '@type/errorResponse';
import { ToFixedNoRounding, UsdToMicroUsd } from '@utils/currency';
import { GetBackendAdSetStatusText } from '@utils/displayStatus';
import { ConvertEntityTypeEnumToString } from '@utils/enumToString';
import { CaptureException } from '@utils/error';
import { SetErrorModalImpersonationConfig } from '@utils/errorModalImpersonation';
import { HOME_PAGE_TABLE_VIEWS } from 'app/pages/classic';
import { TODOFIXANY } from 'app/shared/types';

import { EditAdSetComponent } from './editAdSetComponent';
import {
  allAdFormats,
  CellAlignType,
  GenericManagementTable,
  getDisplayedHeadCells,
  getDisplayedRowCells,
  RowType,
  TableNameCell,
  TableTextCell,
} from './genericManagementTable';

const stickyRowStyles = {
  background: contentStaticDark,
  boxShadow: 'none',
  left: 0,
  paddingLeft: 8,
  paddingRight: 8,
  position: 'sticky' as const,
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
const contentRowStyles = {
  paddingLeft: 8,
  paddingRight: 8,
  verticalAlign: 'top',
};
const columnSpacingStyles = {
  paddingLeft: 8,
  paddingRight: 8,
};

const offOnHeaderTooltip = 'AdSetsManagementTable.OffOnHeader';
const spentHeaderTooltip = 'AdSetsManagementTable.SpentHeader';
const impressionsHeaderTooltip = 'AdSetsManagementTable.ImpressionsHeader';
const cpmHeaderTooltip = 'AdSetsManagementTable.CpmHeader';
const twoSecondViewsHeaderTooltip = 'AdSetsManagementTable.2SecVideoViewsHeader';
const fifteenSecondViewsHeaderTooltip = 'AdSetsManagementTable.15SecVideoViewsHeader';
const cpv15HeaderTooltip = 'AdSetsManagementTable.Cpv15Header';
const clicksHeaderTooltip = 'AdSetsManagementTable.ClicksHeader';
const ctrHeaderTooltip = 'AdSetsManagementTable.CtrHeader';
const cpcHeaderTooltip = 'AdSetsManagementTable.CpcHeader';
const playsHeaderTooltip = 'AdSetsManagementTable.PlaysHeader';
const playRateHeaderTooltip = 'AdSetsManagementTable.PlayRateHeader';
const costPerPlayHeaderTooltip = 'AdSetsManagementTable.CostPerPlayHeader';
const totalPlayTime7dHeaderTooltip = 'AdSetsManagementTable.TotalPlayTime7dHeader';
const totalRobuxRevenue30dHeaderTooltip = 'AdSetsManagementTable.TotalRobuxRevenue30dHeader';

// https://uiblox.roblox.com/?path=/docs/components-table--base
// https://github.rbx.com/Roblox/uiblox-web/blob/master/stories/Table.stories.tsx

interface AdSetsManagementTableProps {
  adFormats: AdFormatDisplayType[];
  inFilterView: boolean;
  loadMore: TODOFIXANY;
  nextCursor: string;
  onCancelFailure: TODOFIXANY;
  onCancelSuccess: TODOFIXANY;
  onEditClick: TODOFIXANY;
  onEditSuccess: TODOFIXANY;
  rows: TODOFIXANY[];
  showDelete: boolean;
  tableSummaryRowData?: TableSummaryRowData;
}

// TODO: Make Translated String - Toggle Ad Sets
const AdSetsTableToggleCell = ({
  adSetOn = false,
  align = 'center',
  className,
  onToggleClicked,
  toggleDisabled = false,
}: {
  adSetOn: boolean;
  align: CellAlignType;
  className: string;
  onToggleClicked: TODOFIXANY;
  toggleDisabled: boolean;
}) => {
  return (
    <TableCell align={align} className={className}>
      <Switch
        aria-label='Toggle Ad Set'
        checked={adSetOn}
        data-testid='toggle-adset'
        disabled={toggleDisabled}
        onClick={onToggleClicked}
      />
    </TableCell>
  );
};

// TODO: Make Translated String - Max Ad Set Bid
const AdSetsTableBidTypeCell = ({
  adSetRow,
  align = 'center',
  className,
}: {
  adSetRow: TODOFIXANY;
  align: CellAlignType;
  className: string;
}) => {
  const { bidTypeText, maxBidUsd } = ServerToClient.getEndUserAdSetBidInfo(adSetRow);

  const {
    classes: { bidCellContent, bidTypeFont },
  } = makeStyles()(() => ({
    bidCellContent: {
      minWidth: 112,
    },

    bidTypeFont: {
      fontSize: 12,
    },
  }))();
  return (
    <TableCell align={align} className={className}>
      <div className={bidCellContent}>
        <div>
          <NumericFormat
            decimalScale={2}
            displayType='text'
            fixedDecimalScale
            thousandSeparator
            value={maxBidUsd}
          />{' '}
          {getEndUserPaymentUnit(adSetRow)}
        </div>
        <div className={bidTypeFont}>{bidTypeText}</div>
      </div>
    </TableCell>
  );
};

// TODO: Make Translated String - Labels
export const headCells = [
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
    align: 'left',
    customStyles: { ...columnSpacingStyles },
    disabled: false,
    id: 'parentCampaignName',
    label: 'Campaign',
    sortable: true,
  },
  {
    align: 'left',
    customStyles: { ...columnSpacingStyles },
    disabled: false,
    id: 'adFormat',
    label: 'Ad format',
    sortable: true,
  },
  {
    align: 'left',
    customStyles: {},
    disabled: false,
    id: 'bidType',
    label: 'Max bid ',
    sortable: true,
  },
  {
    align: 'right',
    customStyles: { ...columnSpacingStyles },
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
    customStyles: { ...columnSpacingStyles, minWidth: 165 },
    disabled: true,
    id: 'playRate',
    label: 'Play rate',
    renderTooltip: true,
    sortable: true,
    tooltipText: GetTooltipText(playRateHeaderTooltip),
  },
  {
    align: 'right',
    customStyles: { ...columnSpacingStyles },
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
    tooltipText: GetTooltipText(totalPlayTime7dHeaderTooltip),
  },
  {
    align: 'right',
    customStyles: { ...columnSpacingStyles, minWidth: 210, paddingRight: 16 },
    disabled: true,
    id: 'totalRobuxRevenue30d',
    label: '30D Robux Earnings',
    renderTooltip: true,
    sortable: true,
    tooltipText: GetTooltipText(totalRobuxRevenue30dHeaderTooltip),
  },
];

export const headCellsWithData = [];

export const headCellsFinalColumns = [
  { disabled: false, id: 'delete', label: '', sortable: false },
];

export const adSetsTableAdFormatRenderMap = new Map<string, Set<AdFormatDisplayType>>([
  ['name', allAdFormats],
  ['active', allAdFormats],
  ['statusText', allAdFormats],
  ['parentCampaignName', allAdFormats],
  ['adFormat', allAdFormats],
  ['bidType', allAdFormats],
  ['spent', allAdFormats],
  ['impressions', allAdFormats],
  ['cpm', allAdFormats],
  [
    'clicks',
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
  ['twoSecondViews', new Set<AdFormatDisplayType>([AdFormatDisplayType.AD_FORMAT_VIDEO])],
  ['fifteenSecondViews', new Set<AdFormatDisplayType>([AdFormatDisplayType.AD_FORMAT_VIDEO])],
  ['cpv15', new Set<AdFormatDisplayType>([AdFormatDisplayType.AD_FORMAT_VIDEO])],
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

interface AdSetsTableRowProps {
  adFormats: AdFormatDisplayType[];
  headerAlignments: CellAlignType[];
  onEditClick: TODOFIXANY;
  onEditSuccess: TODOFIXANY;
  row: TODOFIXANY;
  showFinalColumns: boolean;
}

const AdSetsTableRow = ({
  adFormats,
  headerAlignments,
  onEditClick,
  onEditSuccess,
  row,
  showFinalColumns,
}: AdSetsTableRowProps) => {
  const { translateHTML } = useNamespacedTranslation(TranslationNamespace.Report);
  const {
    classes: {
      contentRow,
      editButton,
      editIcon,
      iconButton,
      lastContentRow,
      nameRow,
      rowContainer,
      statusRow,
      toggleRow,
    },
  } = makeStyles<void, 'editButton'>()((_, __, classes) => ({
    contentRow: contentRowStyles,

    editButton: {
      paddingLeft: 0,
      visibility: 'hidden',
    },

    editIcon: {
      fontSize: 25,
      verticalAlign: 'top',
    },

    iconButton: {
      padding: 0,
    },

    lastContentRow: { ...contentRowStyles, paddingRight: 16 },
    nameRow: topAlignedNameRowStyles,
    rowContainer: {
      '&:hover': {
        [`& .${classes.editButton}`]: {
          backgroundColor: 'inherit',
          visibility: 'visible',
        },
      },
    },
    statusRow: topAlignedStatusRowStyles,
    toggleRow: topAlignedToggleRowStyles,
  }))();

  const {
    classes: { robuxIconContainer },
  } = useManagementTableStyles();

  const { setModalConfigData, setModalOpen } = useModalStore();

  const [toggleDisabled, setToggleDisabled] = useState(false);
  const [editAdSetDrawerOpen, setEditAdSetDrawerOpen] = useState(false);
  const [showEditAdSetFailureMessage, setShowEditAdSetFailureMessage] = useState(false);
  const impersonationCookie = document.cookie.includes('ad-account-imp-info');

  // TODO: When we have a call to fetch campaign using adSetId - use that instead
  const {
    ads,
    adSets,
    campaigns,
    coreCountryOverrideCodeList,
    coreRegionCodeList,
    coreRegionFloorPriceUsd,
    cpcCeilingPriceUsd,
    cpcFloorPriceUsd,
    cpmMaximumBidUsd,
    cpmMinimumBidUsd,
    cptMaximumBidUsd,
    cptMinimumBidUsd,
    mixedRegionFloorPriceUsd,
    opportunisticRegionCodeList,
    opportunisticRegionFloorPriceUsd,
    portalAdsMaximumBidValueUsd,
    selectedAdSets,
    strategicRegionCodeList,
    strategicRegionFloorPriceUsd,
    tileAdsMaximumBidValueUsd,
    tileAdsMinimumBidValueUsd,
    videoMinBidMappingsMicroUsd,
  } = useAppStore((state: AppStoreType) => state.appData);

  const setRefreshFilter = useFilteringStore((state: TODOFIXANY) => state.setRefreshFilter);

  const {
    adTogglingShouldBeEnabled,
    setAds,
    setAdSets,
    setSelectedAds,
    setSelectedAdSets,
    setSelectedAdsLoading,
  } = useAppStore((state: AppStoreType) => state);

  const router = useRouter();

  const backendStatuses = useDisplayStatusesStore(
    (state: DisplayStatusesStoreType) => state.adSetStatuses,
  );
  const updateStatuses = useDisplayStatusesStore(
    (state: DisplayStatusesStoreType) => state.updateStatuses,
  );
  const setErrorStatuses = useDisplayStatusesStore(
    (state: DisplayStatusesStoreType) => state.setErrorStatuses,
  );

  const updateDisplayStatuses = (adSetId: string, campaignId: string) => {
    getUpdatedStatuses(campaignId)
      .then((statuses) => {
        updateStatuses(statuses);
      })
      .catch((error) => {
        CaptureException(error as Error);
        // Show error statuses if response did not come back successful
        const allAdsUnderAdSet = ads
          .filter((ad: ServerGetAdRowResponse) => {
            return ad.ad_set_id === adSetId;
          })
          .map((ad: ServerGetAdRowResponse) => ad.id);
        setErrorStatuses({ adIds: allAdsUnderAdSet, adSetIds: [adSetId], campaignId });
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

  const deleteAdSetRow = (adSetId: string) => {
    if (impersonationCookie) {
      SetErrorModalImpersonationConfig(setModalOpen, setModalConfigData);
      return;
    }

    deleteAdSet(adSetId)
      .then((res: TODOFIXANY) => {
        if (res.status === 200) {
          const adSetsWithoutThisOne = adSets!.filter((adSet: TODOFIXANY) => {
            return adSet.id !== adSetId;
          });

          setAdSets(adSetsWithoutThisOne);

          getAds().then((adsRes) => {
            setAds(adsRes.ads);
          });

          updateDisplayStatuses(adSetId, row.campaign_id);

          setModalOpen(false);
        } else {
          showPatchErrorModal();
        }
      })
      .catch(showPatchErrorModal);
  };

  const onDeleteIconClicked = (adSetId: string) => {
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
              deleteAdSetRow(adSetId);
            }}
            variant='contained'>
            Delete
          </Button>
        </>
      ),
      dialogContent: `Deleting ${row.name} will remove all Ads under this Ad Set. This action cannot be undone.`,
      handleClose: () => {
        setModalOpen(false);
      },
      title: `Delete Ad Set: ${row.name}?`,
    });
  };

  const onToggleClicked = (adSetId: string) => {
    setToggleDisabled(true);
    const adSetActive = ServerToClient.getBackendStatusIsOn(backendStatuses, adSetId);
    const toggleTo = adSetActive ? ServerAdSetStatusType.STOPPED : ServerAdSetStatusType.ENABLED;

    toggleAdSet(adSetId, toggleTo)
      .then((res: TODOFIXANY) => {
        if (res.status === 200) {
          const editedAdSetIndex = adSets!.findIndex((adSet) => adSet.id === adSetId);
          if (editedAdSetIndex >= 0) {
            const newAdSets = [...(adSets || [])];
            newAdSets[editedAdSetIndex] = {
              ...newAdSets[editedAdSetIndex],
              status: toggleTo,
            };
            setAdSets(newAdSets);
            updateDisplayStatuses(adSetId, row.campaign_id);
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
        entityType: ConvertEntityTypeEnumToString(EntityType.ENTITY_TYPE_AD_SET),
        toggleStateBefore: adSetActive.toString(),
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

  const clicksContent = ServerToClient.getEndUserClicks(row);
  const playsContent = ServerToClient.getEndUserPlays(row);
  const playRateContent = ServerToClient.getEndUserPlayRate(row);
  const CPPContent = ServerToClient.getEndUserCPP(row);
  const twoSecondViewsContent = ServerToClient.getEndUserTwoSecondViews(row);
  const fifteenSecondViewsContent = ServerToClient.getEndUserFifteenSecondViews(row);
  const CPV15Content = ServerToClient.getEndUserCPV15(row);

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

  const CTRContent = ServerToClient.getEndUserCTR(row);
  const CPCContent = ServerToClient.getEndUserCPC(row);

  const totalPlayTime7dContent = row.totalPlayTime7d;
  const totalRobuxRevenue30dContent = row.totalRobuxRevenue30d;

  const handleAdSetEditSave = async (values: TODOFIXANY, actions: TODOFIXANY) => {
    if (impersonationCookie) {
      SetErrorModalImpersonationConfig(setModalOpen, setModalConfigData);
      return;
    }

    actions.setSubmitting(true);
    updateAdSet(row.id, convertFormikDataToUpdateAdSetRequest(row, values))
      .then((res: TODOFIXANY) => {
        if (res.status === 200) {
          // update display
          const editedAdSetIndex = adSets!.findIndex((adSet) => adSet.id === row.id);
          if (editedAdSetIndex >= 0) {
            const newAdSets = [...(adSets || [])];
            newAdSets[editedAdSetIndex] = {
              ...newAdSets[editedAdSetIndex],
              bidding_strategy: {
                ...newAdSets[editedAdSetIndex].bidding_strategy,
                bid_value_micro_usd: UsdToMicroUsd(values.adSetBidValueUsd),
              },
              name: values.adSetName,
            };
            setAdSets(newAdSets);
            updateDisplayStatuses(row.id, row.campaign_id);
            setRefreshFilter(FilterRefresh.FILTER_REFRESH_AFTER_EDIT);
            setShowEditAdSetFailureMessage(false);
            // show success banner
            onEditSuccess();
          }
          setEditAdSetDrawerOpen(false);
        } else {
          res.json().then((obj: AMAErrorResponseType) => {
            if (obj?.error?.code === ErrorCodes.FORBIDDEN_ACTION) {
              SetErrorModalImpersonationConfig(setModalOpen, setModalConfigData);
            } else {
              // show error banner
              setShowEditAdSetFailureMessage(true);
            }
          });
        }
      })
      .catch((err) => {
        CaptureException(err as Error);
      });
  };

  const currentValidationSchema = editAdSetValidationSchema(
    cpmMinimumBidUsd,
    cptMinimumBidUsd,
    cpmMaximumBidUsd,
    cptMaximumBidUsd,
    tileAdsMinimumBidValueUsd,
    portalAdsMaximumBidValueUsd,
    tileAdsMaximumBidValueUsd,
    coreRegionFloorPriceUsd,
    strategicRegionFloorPriceUsd,
    opportunisticRegionFloorPriceUsd,
    mixedRegionFloorPriceUsd,
    coreRegionCodeList,
    strategicRegionCodeList,
    opportunisticRegionCodeList,
    coreCountryOverrideCodeList,
    cpcFloorPriceUsd,
    cpcCeilingPriceUsd,
    videoMinBidMappingsMicroUsd,
  );

  const errorBanner = (
    // TODO: translation
    <Alert severity='error' variant='filled'>
      <AlertTitle>Unknown errors occurred while saving your edits</AlertTitle>Please try saving
      again or come back later.
    </Alert>
  );

  const parentCampaign = campaigns?.find((campaignObj: TODOFIXANY) => {
    return campaignObj!.id === row!.campaign_id;
  });

  const editComponentDisabled = () =>
    ServerToClient.getBackendStatusDisabled(backendStatuses, row.id);

  const handleClickAway = (_: MouseEvent<Document>, reason: TODOFIXANY) => {
    if (reason === 'backdropClick') {
      setEditAdSetDrawerOpen(false);
    }
  };

  const logV1AdSetEdit = (adSetRow: TODOFIXANY) => {
    if (
      adSetRow?.targeting_criteria?.age_bucket_criteria.all_ages !== true &&
      adSetRow?.targeting_criteria?.age_bucket_criteria.age_buckets === null
    ) {
      unifiedLogger.logClickEvent({ eventName: EventName.EditV1AdSetClicked });
    }
  };

  const editButtonComponent = (
    <>
      <Button
        className={editButton}
        color='primary'
        data-testid='edit-adset-button'
        onClick={() => {
          logV1AdSetEdit(row);
          setEditAdSetDrawerOpen(true);
          onEditClick();
          unifiedLogger.logClickEvent({
            eventName: EventName.EditButtonClicked,
            parameters: {
              entityType: ConvertEntityTypeEnumToString(EntityType.ENTITY_TYPE_AD_SET),
            },
          });
        }}
        size='small'>
        <Typography noWrap variant='largeLabel1'>
          <EditOutlinedIcon className={editIcon} /> Edit
        </Typography>
      </Button>
      <Drawer
        anchor='right'
        onClose={handleClickAway}
        open={editAdSetDrawerOpen}
        PaperProps={{ style: { minWidth: 800, width: '60%' } }}>
        <Formik
          initialValues={getEditAdSetInitialValues(row)}
          validationSchema={currentValidationSchema}
          // eslint-disable-next-line
          onSubmit={handleAdSetEditSave}>
          {(formik) => {
            return (
              <div>
                {showEditAdSetFailureMessage && errorBanner}
                <EditAdSetComponent
                  disableEdit={editComponentDisabled()}
                  formikInfo={formik}
                  onCancelClick={() => setEditAdSetDrawerOpen(false)}
                  paymentType={parentCampaign!.payment_type}
                />
              </div>
            );
          }}
        </Formik>
      </Drawer>
    </>
  );

  const onRowCheckboxClicked = async (_: TODOFIXANY, newVal: boolean) => {
    let newSelectedAdSetsIds: string[] = [];

    if (newVal === true) {
      newSelectedAdSetsIds = selectedAdSets.concat(row.id);
    } else {
      newSelectedAdSetsIds = selectedAdSets.filter((adSetId: TODOFIXANY) => adSetId !== row.id);
    }

    setSelectedAdSets(newSelectedAdSetsIds);
    setSelectedAdsLoading(true);
    setSelectedAds(
      ads.filter((adObj: TODOFIXANY) => {
        return newSelectedAdSetsIds.includes(adObj.ad_set_id);
      }),
    );
    setSelectedAdsLoading(false);
  };

  const clipboardContent = `Ad Set ID: ${row.id}`;

  const query: TODOFIXANY = {
    selectedAdSet: row.id,
    tableView: HOME_PAGE_TABLE_VIEWS.ads,
  };

  const onNameClicked = async () => {
    setSelectedAdSets([row.id]);
    setSelectedAdsLoading(true);

    setSelectedAds(
      ads.filter((adObj: TODOFIXANY) => {
        return [row.id].includes(adObj.ad_set_id);
      }),
    );
    setSelectedAdsLoading(false);

    router.push({
      pathname: Routes.CLASSIC,
      query,
    });
  };

  const adSetStatus = GetBackendAdSetStatusText(backendStatuses, row.id);
  const adSetStatusTooltipKey = statusTextToTooltipKey.get(adSetStatus);
  const adSetStatusTooltipContent = adSetStatusTooltipKey
    ? translateHTML(
        adSetStatusTooltipKey,
        getStatusTooltipLinkTags(adSetStatus, parentCampaign?.universe_id),
      )
    : undefined;

  const rowCells = [
    {
      cell: (
        <TableNameCell
          align={headerAlignments[0]}
          className={nameRow}
          copyToClipboardContent={clipboardContent}
          editButton={editButtonComponent}
          name={row.name}
          onNameClicked={onNameClicked}
          onRowChange={onRowCheckboxClicked}
          rowChecked={selectedAdSets?.includes(row.id)}
          rowType={RowType.AdSet}
          tooltipTextToDisplay={clipboardContent}
        />
      ),
      id: 'name',
    },
    {
      cell: (
        <AdSetsTableToggleCell
          adSetOn={ServerToClient.getBackendStatusIsOn(backendStatuses, row.id)}
          align={headerAlignments[1]}
          className={toggleRow}
          onToggleClicked={() => {
            return onToggleClicked(row.id);
          }}
          toggleDisabled={
            (parentCampaign && !adTogglingShouldBeEnabled(parentCampaign.payment_type)) ||
            ServerToClient.getBackendStatusDisabled(backendStatuses, row.id) ||
            toggleDisabled
          }
        />
      ),
      id: 'active',
    },
    {
      cell: (
        <TableCell align={headerAlignments[2]} className={statusRow}>
          <StatusLabel status={adSetStatus} tooltipContent={adSetStatusTooltipContent} />
        </TableCell>
      ),
      id: 'statusText',
    },
    {
      cell: (
        <TableTextCell
          align={headerAlignments[3]}
          className={contentRow}
          textToDisplay={row.parentCampaignName}
        />
      ),
      id: 'parentCampaignName',
    },
    {
      cell: (
        <TableTextCell
          align={headerAlignments[3]}
          className={contentRow}
          textToDisplay={getEndUserAdSetPlacement(row, ads)}
        />
      ),
      id: 'adFormat',
    },
    {
      cell: (
        <AdSetsTableBidTypeCell adSetRow={row} align={headerAlignments[4]} className={contentRow} />
      ),
      id: 'bidType',
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
        <TableCell align='right' className={lastContentRow}>
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
  ];

  const rowCellsToRender: ReactNode[] = getDisplayedRowCells(
    rowCells,
    adFormats,
    adSetsTableAdFormatRenderMap,
    false, // do not include creative column in campaign table
  ).map((cellObject) => cellObject.cell);

  return (
    <TableRow classes={{ root: rowContainer }} key={row.name}>
      {rowCellsToRender}
      {showFinalColumns && (
        <TableCell align='right' className={contentRow}>
          <Tooltip placement='bottom' title={`Delete the "${row.name}" ad set`}>
            <IconButton
              aria-label='delete-button'
              classes={{ root: iconButton }}
              color='primary'
              data-testid='adset-delete-button'
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

const AdSetsTableSummaryRow = ({
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
  const totalTwoSecondViewsContent = ServerToClient.getEndUserTwoSecondViews(tableSummaryRowData);
  const totalFifteenSecondViewsContent =
    ServerToClient.getEndUserFifteenSecondViews(tableSummaryRowData);
  const averagePlayRateContent = ServerToClient.getEndUserPlayRateSummary(tableSummaryRowData);
  const { adCreditEndUserCPPString, usdEndUserCPPString } =
    ServerToClient.getEndUserCPPSummary(tableSummaryRowData);
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

  let firstFourCells = (
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
      <SummaryRowCell align='right' />
    </>
  );

  if (firstColumnContent) {
    firstFourCells = (
      <>
        <TableCell
          align='left'
          colSpan={3}
          style={{ ...nameRowStyles, background: contentStaticDark }}>
          {firstColumnContent}
        </TableCell>
        <SummaryRowCell align='right' />
      </>
    );
  }

  const summaryCells = [
    {
      cell: (
        <SummaryRowCell align='right'>
          <Typography variant='subtitle2'>{spendContent}</Typography>
          <br />
          <Typography variant='footer'>Total</Typography>
        </SummaryRowCell>
      ),
      id: 'spent',
    },
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
    adSetsTableAdFormatRenderMap,
    false, // do not include creative column in campaign table
  ).map((cellObject) => cellObject.cell);

  /*
   firstFourCells contains pagination related components and is not dynamic.
   It should not be moved or included in the adSetsTableAdFormatRenderMap.

   The following SummaryRowCell and TableCell exist to align the summary cells with
   their respective columns and should also not be moved or included in the adSetsTableAdFormatRenderMap.
   */
  return (
    <TableRow classes={{ root: tableStickyFooter }} key={tableSummaryRowData.name}>
      {firstFourCells}
      <SummaryRowCell align='right' />
      <TableCell align='right' />
      {summaryCellsToRender}
      {showFinalColumns && <SummaryRowCell align='right' />}
    </TableRow>
  );
};

export const AdSetsManagementTable = ({
  adFormats,
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
}: AdSetsManagementTableProps) => {
  const {
    ads = [],
    campaigns = [],
    selectedCampaigns = [],
  } = useAppStore((state: AppStoreType) => state.appData);

  let finalSummaryRowData = tableSummaryRowData;

  const backendStatuses = useDisplayStatusesStore(
    (state: DisplayStatusesStoreType) => state.adSetStatuses,
  );

  let totalAdCreditClicks = 0;
  let totalAdCreditSpend = 0;
  let totalUSDClicks = 0;
  let totalUSDSpend = 0;

  // if we have selected campaigns, we should disable pagination
  const paginationEnabled = selectedCampaigns.length === 0;

  if (rows) {
    let transformedRows = rows.map((rowObj: TODOFIXANY) => {
      const { maxBidUsd } = ServerToClient.getEndUserAdSetBidInfo(rowObj);
      const parentCampaign = campaigns?.find((campaignObj: TODOFIXANY) => {
        return campaignObj!.id === rowObj!.campaign_id;
      });

      const parentCampaignName =
        (parentCampaign && parentCampaign.name) || 'No Valid Parent Campaign';

      const childAd = ads!.find((adObj: ServerGetAdRowResponse) => {
        return adObj!.ad_set_id === rowObj!.id;
      });
      const adType = (childAd && childAd.type) || 0;

      const newRow = { ...rowObj };
      newRow.statusText = GetBackendAdSetStatusText(backendStatuses, rowObj.id);

      newRow.paymentMethod = ServerToClient.getEndUserPaymentType(rowObj);

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

      newRow.parentCampaignName = parentCampaignName;
      newRow.bidType = maxBidUsd;
      newRow.spent = ServerToClient.getEndUserSpend(rowObj);
      newRow.clicks = ServerToClient.getEndUserClicks(rowObj);
      newRow.ctr = ServerToClient.getEndUserCTR(rowObj);
      newRow.cpc = ServerToClient.getEndUserCPC(rowObj);
      newRow.plays = ServerToClient.getEndUserPlays(rowObj);
      newRow.playRate = ServerToClient.getEndUserPlayRate(rowObj);
      newRow.cpp = ServerToClient.getEndUserCPP(rowObj);
      newRow.adFormat = mapServerAdTypeToFormik(adType as ServerAdFormatType);

      newRow.impressions = ServerToClient.getEndUserImpressions(rowObj);
      newRow.cpm = ServerToClient.getEndUserCPM(rowObj);
      newRow.teleports = ServerToClient.getEndUserTeleports(rowObj);
      newRow.teleportRate = ServerToClient.getEndUserTeleportRate(rowObj);
      newRow.cpt = ServerToClient.getEndUserCPT(rowObj);
      newRow.twoSecondViews = ServerToClient.getEndUserTwoSecondViews(rowObj);
      newRow.fifteenSecondViews = ServerToClient.getEndUserFifteenSecondViews(rowObj);
      newRow.cpv15 = ServerToClient.getEndUserCPV15(rowObj);
      newRow.performance = rowObj.performance;
      newRow.adType = mapServerAdTypeToFormik(adType as ServerAdFormatType);
      newRow.totalPlayTime7d = ServerToClient.getEndUserTotalPlayTime7d(rowObj);
      newRow.totalRobuxRevenue30d = ServerToClient.getEndUserTotalRobuxRevenue30d(rowObj);

      return newRow;
    });

    if (selectedCampaigns.length) {
      totalAdCreditClicks = 0;
      totalAdCreditSpend = 0;
      totalUSDClicks = 0;
      totalUSDSpend = 0;
      transformedRows = transformedRows.filter((row: TODOFIXANY) => {
        return selectedCampaigns.includes(row.campaign_id);
      });

      const chargeable_spend_micro_usd =
        transformedRows.reduce(
          (accumulator, currentValue) => accumulator + parseInt(currentValue.spent, 10),
          0,
        ) * 1000000;

      const teleport_count = transformedRows.reduce(
        (accumulator, currentValue) => accumulator + currentValue.teleports,
        0,
      );

      const impression_count = transformedRows.reduce(
        (accumulator, currentValue) => accumulator + currentValue.impressions,
        0,
      );

      const rowsWithTeleports = transformedRows.reduce((accumulator, currentValue) => {
        if (currentValue.teleports) {
          return accumulator + 1;
        }
        return accumulator;
      }, 0);

      const rowsWithCPM = transformedRows.reduce((accumulator, currentValue) => {
        if (currentValue.cpm) {
          return accumulator + 1;
        }
        return accumulator;
      }, 0);

      const average_cost_per_mille =
        (transformedRows.reduce((accumulator, currentValue) => accumulator + currentValue.cpm, 0) /
          rowsWithCPM) *
        1000000;

      const average_cost_per_teleport =
        (transformedRows.reduce((accumulator, currentValue) => accumulator + currentValue.cpt, 0) /
          rowsWithTeleports) *
        1000000;

      const teleport_rate = (teleport_count / impression_count) * 100;
      const name = 'filtered-adsets-summary-row';

      const play_count = transformedRows.reduce((accumulator, currentValue) => {
        if (currentValue?.performance?.play_count) {
          return accumulator + currentValue.performance.play_count;
        }
        return accumulator;
      }, 0);

      const click_count = transformedRows.reduce((accumulator, currentValue) => {
        if (currentValue?.performance?.click_count) {
          return accumulator + currentValue.performance.click_count;
        }
        return accumulator;
      }, 0);

      const total_ad_credit_spend = transformedRows.reduce((accumulator, currentValue) => {
        if (getEndUserPaymentType(currentValue) === END_USER_AD_CREDIT_PAYMENT_TYPE) {
          return (
            accumulator +
            Number(microUsdToUsd(currentValue?.performance?.display_spending_micro_usd || 0))
          );
        }
        return accumulator;
      }, 0);

      const total_USD_spend = transformedRows.reduce((accumulator, currentValue) => {
        if (getEndUserPaymentType(currentValue) === END_USER_CARD_PAYMENT_TYPE) {
          return (
            accumulator +
            Number(microUsdToUsd(currentValue?.performance?.display_spending_micro_usd || 0))
          );
        }
        return accumulator;
      }, 0);

      const rowsWithUSD = transformedRows.reduce((accumulator, currentValue) => {
        if (getEndUserPaymentType(currentValue) === END_USER_CARD_PAYMENT_TYPE) {
          return accumulator + 1;
        }
        return accumulator;
      }, 0);

      const rowsWithAdCredit = transformedRows.reduce((accumulator, currentValue) => {
        if (getEndUserPaymentType(currentValue) === END_USER_AD_CREDIT_PAYMENT_TYPE) {
          return accumulator + 1;
        }
        return accumulator;
      }, 0);

      const usd_average_cost_per_mille =
        transformedRows.reduce((accumulator, currentValue) => {
          if (getEndUserPaymentType(currentValue) === END_USER_CARD_PAYMENT_TYPE) {
            return accumulator + (currentValue?.performance?.cost_per_millie_usd || 0);
          }
          return accumulator;
        }, 0) / rowsWithUSD;

      const ad_credit_average_cost_per_mille =
        transformedRows.reduce((accumulator, currentValue) => {
          if (getEndUserPaymentType(currentValue) === END_USER_AD_CREDIT_PAYMENT_TYPE) {
            return accumulator + (currentValue?.performance?.cost_per_millie_usd || 0);
          }
          return accumulator;
        }, 0) / rowsWithAdCredit;

      // Sometimes this is 0/0 => NaN
      const avgPlayRate = Number(
        ((Number(play_count) / Number(impression_count)) * 100).toFixed(2),
      );

      transformedRows.forEach((rowObj: TODOFIXANY) => {
        const paymentMethod = ServerToClient.getEndUserPaymentType(rowObj);

        if (paymentMethod === END_USER_AD_CREDIT_PAYMENT_TYPE) {
          if (rowObj?.performance?.click_count) {
            totalAdCreditClicks += rowObj.performance.click_count;
          }

          if (rowObj?.performance?.spend_micro_usd) {
            totalAdCreditSpend += rowObj.performance.spend_micro_usd / MICRO_USD_IN_USD;
          }
        } else {
          if (rowObj?.performance?.click_count) {
            totalUSDClicks += rowObj.performance.click_count;
          }

          if (rowObj?.performance?.spend_micro_usd) {
            totalUSDSpend += rowObj.performance.spend_micro_usd / MICRO_USD_IN_USD;
          }
        }
      });

      const total_play_time_hours_7d = transformedRows.reduce(
        (accumulator, currentValue) =>
          accumulator + (currentValue?.performance?.total_play_time_hours_7d || 0),
        0,
      );

      const total_robux_revenue_30d = transformedRows.reduce(
        (accumulator, currentValue) =>
          accumulator + (currentValue?.performance?.total_robux_revenue_30d || 0),
        0,
      );

      finalSummaryRowData = {
        ad_credit_average_cost_per_mille: Number(ad_credit_average_cost_per_mille.toFixed(2)),
        ad_credit_average_cost_per_play: roundFloatDownToTwoDecimals(
          Number(Number(total_ad_credit_spend) / Number(play_count)),
        ),
        ad_credit_display_spending: total_ad_credit_spend,
        average_cost_per_mille,
        average_cost_per_teleport,
        average_play_rate: Number.isNaN(avgPlayRate) ? undefined : avgPlayRate,
        chargeable_spend_micro_usd,
        click_count,
        impression_count,
        name,
        play_count,
        teleport_count,
        teleport_rate,
        total_play_time_hours_7d,
        total_robux_revenue_30d,
        usd_average_cost_per_mille: Number(usd_average_cost_per_mille.toFixed(2)),
        usd_average_cost_per_play: roundFloatDownToTwoDecimals(
          Number(Number(total_USD_spend) / Number(play_count)),
        ),
        usd_display_spending: total_USD_spend,
      };
    } else if (inFilterView) {
      const {
        filteredTableSummaryRowData,
        filteredTotalAdCreditClicks,
        filteredTotalAdCreditSpend,
        filteredTotalUSDClicks,
        filteredTotalUSDSpend,
      } = ServerToClient.getSummaryForFilteredRows(transformedRows);
      finalSummaryRowData = { ...filteredTableSummaryRowData, name: 'filtered-adsets-summary-row' };
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
        headCells={getDisplayedHeadCells(
          headCells,
          adFormats,
          adSetsTableAdFormatRenderMap,
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
        paginationEnabled={paginationEnabled}
        rows={transformedRows}
        showFinalColumns={showDelete}
        TableRowElement={AdSetsTableRow}
        tableSummaryRowData={{
          ...finalSummaryRowData,
          performance: augmentedTableSummaryRowData,
        }}
        TableSummaryRowElement={AdSetsTableSummaryRow}
        tableView={HOME_PAGE_TABLE_VIEWS.adSets}
      />
    );
  }

  return null;
};
