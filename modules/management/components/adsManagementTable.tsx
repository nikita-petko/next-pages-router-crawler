import {
  Alert,
  AlertTitle,
  Button,
  CloseIcon,
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
import { RobloxVideoPlayer } from '@rbx/video-player';
import { Formik } from 'formik';
import { MouseEvent, ReactNode, useCallback, useState } from 'react';
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
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { deleteAd, getUpdatedStatuses, toggleAd, updateAd } from '@modules/clients/ads/adsClient';
import { ServerAdFormatType, ServerAdStatusType } from '@modules/clients/ads/adsClientTypes';
import {
  convertFormikDataToUpdateAdRequest,
  END_USER_AD_CREDIT_PAYMENT_TYPE,
  END_USER_CARD_PAYMENT_TYPE,
  getEndUserPaymentType,
  getEndUserPaymentUnit,
  MICRO_USD_IN_USD,
  microUsdToUsd,
  roundFloatDownToTwoDecimals,
  ServerToClient,
  toAdCreditString,
  toUsdString,
} from '@modules/clients/ads/serverClientTransformationUtilities';
import { creativePreviewDefaultImagePath } from '@modules/creation/components/constants/assetConstants';
import { FilterRefresh } from '@modules/filtering/utils/filterEnums';
import useManagementTableStyles from '@modules/management/components/managementTableStyles';
import {
  editAdValidationSchema,
  getEditAdInitialValues,
} from '@modules/management/models/editAdComponentModel';
import SummaryRowCell from '@modules/miscellaneous/common/components/SummaryRowCell';
import { GetTooltipText } from '@modules/miscellaneous/utils/tooltipStrings';
import {
  DisplayStatusesStoreType,
  useDisplayStatusesStore,
} from '@modules/stores/displayStatusStoreProvider';
import useFilteringStore from '@modules/stores/filteringStoreProvider';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { useModalStore } from '@stores/modalStoreProvider';
import { ServerAdAssetCompositeReviewDecisionType } from '@type/ad';
import { ServerGetAdSetRowResponse } from '@type/adSet';
import { ServerGetCampaignRowResponse } from '@type/campaign';
import { AMAErrorResponseType } from '@type/errorResponse';
import { ToFixedNoRounding } from '@utils/currency';
import { GetBackendAdStatusText } from '@utils/displayStatus';
import { ConvertEntityTypeEnumToString } from '@utils/enumToString';
import { CaptureException } from '@utils/error';
import { SetErrorModalImpersonationConfig } from '@utils/errorModalImpersonation';
import { GetVideoPlayerEnvEnum } from '@utils/url';
import { HOME_PAGE_TABLE_VIEWS } from 'app/pages/classic';
import { TODOFIXANY } from 'app/shared/types';

import { EditAdComponent } from './editAdComponent';
import {
  allAdFormats,
  CellAlignType,
  GenericManagementTable,
  getDisplayedHeadCells,
  getDisplayedRowCells,
  RowType,
  TableImageCell,
  TableNameCell,
  TableTextCell,
} from './genericManagementTable';
import TableVideoPreviewCell from './inTableVideoPreviewCell';

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

const creativeRowOffset = 62;
const creativeRowWidth = 0;
const nameRowWidth = 174;
const toggleRowWidth = 95;
const statusRowWidth = 110;

const creativeRowStyles = {
  ...stickyRowStyles,
  minWidth: creativeRowWidth,
  paddingLeft: 8,
  paddingRight: 0,
  verticalAlign: 'middle',
  width: creativeRowWidth,
};
const centerAlignedCreativeRowStyles = {
  ...creativeRowStyles,
  paddingBottom: '11px',
};
const centerAlignedCreativeRowVideoStyles = {
  ...creativeRowStyles,
  paddingBottom: '16px',
};
const nameRowStyles = {
  ...stickyRowStyles,
  left: creativeRowOffset + creativeRowWidth,
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
  left: creativeRowOffset + creativeRowWidth + nameRowWidth - 2,
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
  left: creativeRowOffset + creativeRowWidth + nameRowWidth + toggleRowWidth - 3,
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

const offOnHeaderTooltip = 'AdsManagementTable.OffOnHeader';
const spentHeaderTooltip = 'AdsManagementTable.SpentHeader';
const impressionsHeaderTooltip = 'AdsManagementTable.ImpressionsHeader';
const cpmHeaderTooltip = 'AdsManagementTable.CpmHeader';
const twoSecondViewsHeaderTooltip = 'AdsManagementTable.2SecVideoViewsHeader';
const fifteenSecondViewsHeaderTooltip = 'AdsManagementTable.15SecVideoViewsHeader';
const cpv15HeaderTooltip = 'AdsManagementTable.Cpv15Header';
const clicksHeaderTooltip = 'AdsManagementTable.ClicksHeader';
const ctrHeaderTooltip = 'AdsManagementTable.CtrHeader';
const cpcHeaderTooltip = 'AdsManagementTable.CpcHeader';
const playsHeaderTooltip = 'AdsManagementTable.PlaysHeader';
const playRateHeaderTooltip = 'AdsManagementTable.PlayRateHeader';
const costPerPlayHeaderTooltip = 'AdsManagementTable.CostPerPlayHeader';
const totalPlayTimeHeaderTooltip = 'AdsManagementTable.TotalPlayTimeHeader';
const totalRobuxRevenueHeaderTooltip = 'AdsManagementTable.TotalRobuxRevenueHeader';

// https://uiblox.roblox.com/?path=/docs/components-table--base
// https://github.rbx.com/Roblox/uiblox-web/blob/master/stories/Table.stories.tsx
interface AdsManagementTableProps {
  adFormats: AdFormatDisplayType[];
  assetIdToUrlMap: Map<number, string>;
  assetMapLoading: boolean;
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

// TODO: Make Translated String - Toggle Ads
const AdsTableToggleCell = ({
  adOn,
  align = 'center',
  className,
  onToggleClicked,
  toggleDisabled = false,
}: {
  adOn: boolean;
  align: CellAlignType;
  className: string;
  onToggleClicked: TODOFIXANY;
  toggleDisabled: boolean;
}) => {
  return (
    <TableCell align={align} className={className}>
      <Switch
        aria-label='Toggle Ad'
        checked={adOn}
        data-testid='toggle-ad'
        disabled={toggleDisabled}
        onClick={onToggleClicked}
      />
    </TableCell>
  );
};

// TODO: Make Translated String - Labels
export const getHeadCells = () => [
  {
    align: 'left',
    customStyles: { ...creativeRowStyles, zIndex: 1000 },
    disabled: false,
    id: 'creative',
    label: 'Creative',
    sortable: false,
  },
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
    disabled: true,
    id: 'parentAdSetName',
    label: 'Ad Set',
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
    align: 'right',
    customStyles: { paddingLeft: 27, paddingRight: 27 },
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
    customStyles: { paddingLeft: 42, paddingRight: 42 },
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
    customStyles: { paddingLeft: 92, paddingRight: 8 },
    disabled: true,
    id: 'ctr',
    label: 'CTR',
    renderTooltip: true,
    sortable: true,
    tooltipText: GetTooltipText(ctrHeaderTooltip),
  },
  {
    align: 'right',
    customStyles: { paddingLeft: 92, paddingRight: 8 },
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
    customStyles: { paddingLeft: 42, paddingRight: 42 },
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
    customStyles: { ...columnSpacingStyles, minWidth: 210, paddingRight: 16 },
    disabled: true,
    id: 'totalRobuxRevenue30d',
    label: '30D Robux Earnings',
    renderTooltip: true,
    sortable: true,
    tooltipText: GetTooltipText(totalRobuxRevenueHeaderTooltip),
  },
];

export const headCellsWithData = [];

export const headCellsFinalColumns = [{ disabled: true, id: 'delete', label: '', sortable: false }];

export const adsTableAdFormatRenderMap = new Map<string, Set<AdFormatDisplayType>>([
  ['creative', allAdFormats],
  ['name', allAdFormats],
  ['active', allAdFormats],
  ['statusText', allAdFormats],
  ['parentAdSetName', allAdFormats],
  ['adFormat', allAdFormats],
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

interface AdsTableRowProps {
  adFormats: AdFormatDisplayType[];
  assetIdToUrlMap: Map<number, string>;
  assetMapLoading: boolean;
  headerAlignments: CellAlignType[];
  onEditClick: TODOFIXANY;
  onEditSuccess: TODOFIXANY;
  row: TODOFIXANY;
  showFinalColumns: boolean;
}

const AdsTableRow = ({
  adFormats,
  assetIdToUrlMap,
  assetMapLoading,
  headerAlignments,
  onEditClick,
  onEditSuccess,
  row,
  showFinalColumns,
}: AdsTableRowProps) => {
  const { translateHTML } = useNamespacedTranslation(TranslationNamespace.Report);
  const { ads, campaigns } = useAppStore((state: AppStoreType) => state.appData);
  const adTogglingShouldBeEnabled = useAppStore((state) => state.adTogglingShouldBeEnabled);

  const setAds = useAppStore((state: AppStoreType) => state.setAds);

  const {
    classes: {
      contentRow,
      creative,
      creativeRow,
      creativeRowVideo,
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
    // @ts-ignore
    contentRow: topAlignedContentRowStyles,
    creative: {
      height: '100%',
      objectFit: 'scale-down',
      width: '100%',
    },
    // @ts-ignore
    creativeRow: centerAlignedCreativeRowStyles,
    // @ts-ignore
    creativeRowVideo: centerAlignedCreativeRowVideoStyles,
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
    lastContentRow: { ...topAlignedContentRowStyles, paddingRight: 16 },
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
  // TODO: Write logic for when delete should be disabled
  const [toggleDisabled, setToggleDisabled] = useState(false);
  // TODO: When we have a call to fetch campaign using adId - use that instead
  const [editAdDrawerOpen, setEditAdDrawerOpen] = useState(false);
  const [showEditAdFailureMessage, setShowEditAdFailureMessage] = useState(false);

  const backendStatuses = useDisplayStatusesStore(
    (state: DisplayStatusesStoreType) => state.adStatuses,
  );
  const updateStatuses = useDisplayStatusesStore(
    (state: DisplayStatusesStoreType) => state.updateStatuses,
  );
  const setErrorStatuses = useDisplayStatusesStore(
    (state: DisplayStatusesStoreType) => state.setErrorStatuses,
  );

  const setRefreshFilter = useFilteringStore((state: TODOFIXANY) => state.setRefreshFilter);

  const updateDisplayStatuses = (adId: string, adSetId: string, campaignId: string) => {
    getUpdatedStatuses(campaignId)
      .then((statuses) => {
        updateStatuses(statuses);
      })
      .catch((error) => {
        CaptureException(error as Error);
        // Show error statuses if response did not come back successful
        setErrorStatuses({ adIds: [adId], adSetIds: [adSetId], campaignId });
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

  const deleteAdRow = (adId: string) => {
    deleteAd(adId)
      .then((res: TODOFIXANY) => {
        if (res.status === 200) {
          const adsWithoutThisOne = ads!.filter((adsObj: TODOFIXANY) => {
            return adsObj.id !== adId;
          });

          setAds(adsWithoutThisOne);
          updateDisplayStatuses(adId, row.ad_set_id, row.campaign_id);
          setModalOpen(false);
        } else {
          showPatchErrorModal();
        }
      })
      .catch(showPatchErrorModal);
  };

  const onDeleteIconClicked = (adId: string) => {
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
              deleteAdRow(adId);
            }}
            variant='contained'>
            Delete
          </Button>
        </>
      ),
      dialogContent: `Deleting ${row.name} will stop all this Ad from running. This action cannot be undone.`,
      handleClose: () => {
        setModalOpen(false);
      },
      title: `Delete Ad: ${row.name}?`,
    });
  };

  const onToggleClicked = (adId: string) => {
    setToggleDisabled(true);
    const adActive = ServerToClient.getBackendStatusIsOn(backendStatuses, adId);
    const toggleTo = adActive ? ServerAdStatusType.STOPPED : ServerAdStatusType.ENABLED;

    toggleAd(adId, toggleTo)
      .then((res: TODOFIXANY) => {
        if (res.status === 200) {
          const editedAdSetIndex = ads!.findIndex((ad) => ad.id === adId);
          if (editedAdSetIndex >= 0) {
            const newAds = [...(ads || [])];
            newAds[editedAdSetIndex] = {
              ...newAds[editedAdSetIndex],
              status: toggleTo,
            };
            setAds(newAds);
            updateDisplayStatuses(adId, row.ad_set_id, row.campaign_id);
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
        entityType: ConvertEntityTypeEnumToString(EntityType.ENTITY_TYPE_AD),
        toggleStateBefore: adActive.toString(),
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
  const twoSecondViewsContent = ServerToClient.getEndUserTwoSecondViews(row);
  const fifteenSecondViewsContent = ServerToClient.getEndUserFifteenSecondViews(row);
  const CPV15Content = ServerToClient.getEndUserCPV15(row);

  const CTRContent = ServerToClient.getEndUserCTR(row);
  const CPCContent = ServerToClient.getEndUserCPC(row);

  const totalPlayTime7dContent = row.totalPlayTime7d;
  const totalRobuxRevenue30dContent = row.totalRobuxRevenue30d;

  const handleAdEditSave = async (values: TODOFIXANY, actions: TODOFIXANY) => {
    const impersonationCookie = document.cookie.includes('ad-account-imp-info');
    if (impersonationCookie) {
      SetErrorModalImpersonationConfig(setModalOpen, setModalConfigData);
      return;
    }

    actions.setSubmitting(true);
    updateAd(row.id, convertFormikDataToUpdateAdRequest(row, values))
      .then((res: TODOFIXANY) => {
        if (res.status === 200) {
          // update display
          const editedAdIndex = ads!.findIndex((ad) => ad.id === row.id);
          if (editedAdIndex >= 0) {
            const newAds = [...(ads || [])];
            newAds[editedAdIndex] = {
              ...newAds[editedAdIndex],
              name: values.adName,
            };
            setAds(newAds);
            updateDisplayStatuses(row.id, row.ad_set_id, row.campaign_id);
            setRefreshFilter(FilterRefresh.FILTER_REFRESH_AFTER_EDIT);
          }
          setEditAdDrawerOpen(false);
          setShowEditAdFailureMessage(false);
          // show success banner
          onEditSuccess();
        } else {
          res.json().then((obj: AMAErrorResponseType) => {
            if (obj?.error?.code === ErrorCodes.FORBIDDEN_ACTION) {
              SetErrorModalImpersonationConfig(setModalOpen, setModalConfigData);
            } else {
              // show error banner
              setShowEditAdFailureMessage(true);
            }
          });
        }
      })
      .catch((err) => {
        CaptureException(err as Error);
      });
  };

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
      setEditAdDrawerOpen(false);
    }
  };

  const editButtonComponent = (
    <>
      <Button
        className={editButton}
        color='primary'
        data-testid='edit-ad-button'
        onClick={() => {
          setEditAdDrawerOpen(true);
          onEditClick();
          unifiedLogger.logClickEvent({
            eventName: EventName.EditButtonClicked,
            parameters: { entityType: ConvertEntityTypeEnumToString(EntityType.ENTITY_TYPE_AD) },
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
        open={editAdDrawerOpen}
        PaperProps={{ style: { minWidth: 800, width: '60%' } }}>
        <Formik
          initialValues={getEditAdInitialValues(row)}
          validationSchema={editAdValidationSchema}
          // eslint-disable-next-line
          onSubmit={handleAdEditSave}>
          {(formik) => {
            return (
              <div>
                {showEditAdFailureMessage && errorBanner}
                <EditAdComponent
                  disableEdit={editComponentDisabled()}
                  formikInfo={formik}
                  onCancelClick={() => setEditAdDrawerOpen(false)}
                />
              </div>
            );
          }}
        </Formik>
      </Drawer>
    </>
  );

  const clipboardContent = `Ad ID: ${row.id}`;

  let adCreativeUrl = '';
  let targetId = 0;
  switch (row.type) {
    case ServerAdFormatType.DISPLAY:
      targetId = row.display_ad_metadata?.asset_metadata?.asset_id;
      break;
    case ServerAdFormatType.PORTAL:
      targetId = row.portal_ad_metadata?.banner_asset_metadata?.asset_id;
      break;
    case ServerAdFormatType.VIDEO:
      targetId = row.video_ad_metadata?.asset_metadata?.asset_id;
      break;
    case ServerAdFormatType.TILE:
      targetId = row.sponsored_universe_ad_metadata?.target_universe_id;
      break;
    case ServerAdFormatType.SEARCH:
      targetId = row.search_ad_metadata?.target_universe_id;
      break;
    default:
      targetId = 0;
  }
  adCreativeUrl = assetIdToUrlMap.get(targetId) || '';

  const [useThumbnailForVideo, setUseThumbnailForVideo] = useState(false);
  const env = GetVideoPlayerEnvEnum();
  const handleLoadError = useCallback(() => {
    setUseThumbnailForVideo(true);
  }, []);

  let onClickPreviewComponent = (
    <img
      alt='Could Not Fetch Image'
      src={adCreativeUrl || creativePreviewDefaultImagePath}
      style={{
        borderRadius: 4,
        maxHeight: '32vw',
        maxWidth: '32vw',
        // @ts-ignore
        zIndex: '21',
      }}
    />
  );

  if (
    row.type === ServerAdFormatType.VIDEO &&
    adCreativeUrl !== '' &&
    row.composite_review_decision === ServerAdAssetCompositeReviewDecisionType.APPROVED &&
    !useThumbnailForVideo
  ) {
    onClickPreviewComponent = (
      <RobloxVideoPlayer
        autoPlay
        disableControls
        environment={env}
        loop
        muted
        onLoadError={handleLoadError}
        style={{
          borderRadius: 4,
          maxHeight: '32vw',
          maxWidth: '32vw',
          zIndex: '21',
        }}
        videoAssetId={targetId.toString()}
      />
    );
  }

  const openInTableCreativePreview = () => {
    setModalConfigData({
      completelyCustomModalContents: (
        <div
          style={{
            left: '50%',
            position: 'fixed',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}>
          <div style={{ width: '100%' }}>
            <CloseIcon
              onClick={() => {
                setModalOpen(false);
              }}
              style={{ color: 'white', position: 'absolute', right: 0, top: '-30px' }}
            />
          </div>
          <div>{onClickPreviewComponent}</div>
        </div>
      ),
      handleClose: (__: TODOFIXANY) => {
        setModalOpen(false);
      },
    });
    setModalOpen(true);
  };

  let previewCell = (
    <TableImageCell
      assetUrl={adCreativeUrl}
      cellClassName={creativeRow}
      imageClassName={creative}
      isLoading={assetMapLoading}
      onClick={openInTableCreativePreview}
    />
  );
  if (
    row.type === ServerAdFormatType.VIDEO &&
    row.composite_review_decision === ServerAdAssetCompositeReviewDecisionType.APPROVED &&
    !useThumbnailForVideo
  ) {
    previewCell = (
      <TableVideoPreviewCell
        cellClassName={creativeRowVideo}
        isLoading={assetMapLoading}
        onClick={openInTableCreativePreview}
        overrideThumbVideoPlayer={
          <RobloxVideoPlayer
            disableControls
            environment={env}
            muted
            onClick={openInTableCreativePreview}
            onLoadError={handleLoadError}
            style={{ height: '100%', width: '100%' }}
            videoAssetId={targetId.toString()}
          />
        }
        uploadedVideoObjectUrl={adCreativeUrl}
      />
    );
  }

  const adStatus = GetBackendAdStatusText(backendStatuses, row.id);
  const adStatusTooltipKey = statusTextToTooltipKey.get(adStatus);
  const parentCampaignUniverseId = campaigns?.find(
    (c: TODOFIXANY) => c.id === row.campaign_id,
  )?.universe_id;
  const adStatusTooltipContent = adStatusTooltipKey
    ? translateHTML(
        adStatusTooltipKey,
        getStatusTooltipLinkTags(adStatus, parentCampaignUniverseId),
      )
    : undefined;

  const rowCells = [
    {
      cell: previewCell,
      id: 'creative',
    },
    {
      cell: (
        <TableNameCell
          align={headerAlignments[0]}
          className={nameRow}
          copyToClipboardContent={clipboardContent}
          editButton={editButtonComponent}
          name={row.name}
          rowType={RowType.Ad}
          tooltipTextToDisplay={clipboardContent}
        />
      ),
      id: 'name',
    },
    {
      cell: (
        <AdsTableToggleCell
          adOn={ServerToClient.getBackendStatusIsOn(backendStatuses, row.id)}
          align={headerAlignments[1]}
          className={toggleRow}
          onToggleClicked={() => {
            return onToggleClicked(row.id);
          }}
          toggleDisabled={
            !adTogglingShouldBeEnabled(row.payment_type).togglingEnabled ||
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
          <StatusLabel status={adStatus} tooltipContent={adStatusTooltipContent} />
        </TableCell>
      ),
      id: 'statusText',
    },
    {
      cell: (
        <TableTextCell
          align={headerAlignments[3]}
          className={contentRow}
          textToDisplay={row.parentAdSetName}
        />
      ),
      id: 'parentAdSetName',
    },
    {
      cell: (
        <TableTextCell
          align={headerAlignments[3]}
          className={contentRow}
          textToDisplay={ServerToClient.getEndUserAdStatusFormat(row)}
        />
      ),
      id: 'adFormat',
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
    adsTableAdFormatRenderMap,
    true, // show creative column
  ).map((cellObject) => cellObject.cell);

  return (
    <TableRow classes={{ root: rowContainer }} key={row.name}>
      {rowCellsToRender}
      {showFinalColumns && (
        <TableCell align='right' className={contentRow}>
          <Tooltip placement='bottom' title={`Delete the "${row.name}" ad`}>
            <IconButton
              aria-label='delete-button'
              classes={{ root: iconButton }}
              color='primary'
              data-testid='ad-delete-button'
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

const AdsTableSummaryRow = ({
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
      <SummaryRowCell
        align='left'
        style={{ ...creativeRowStyles, background: contentStaticDark }}
      />
      {/*
          // @ts-ignore */}
      <SummaryRowCell align='right' style={{ ...nameRowStyles, background: contentStaticDark }} />
    </>
  );

  if (firstColumnContent) {
    firstFourCells = (
      <>
        <TableCell
          align='right'
          colSpan={4}
          style={{ ...nameRowStyles, background: contentStaticDark }}>
          {firstColumnContent}
        </TableCell>
        <SummaryRowCell align='right' />
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
    adsTableAdFormatRenderMap,
    true, // show creative column
  ).map((cellObject) => cellObject.cell);
  /*
   firstFourCells contains pagination related components and is not dynamic.
   It should not be moved or included in the adsTableAdFormatRenderMap.
   */
  return (
    <TableRow classes={{ root: tableStickyFooter }} key={tableSummaryRowData.name}>
      {firstFourCells}
      {summaryCellsToRender}
      {showFinalColumns && <SummaryRowCell align='right' />}
    </TableRow>
  );
};

export const AdsManagementTable = ({
  adFormats,
  assetIdToUrlMap,
  assetMapLoading,
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
}: AdsManagementTableProps) => {
  const { adSets, campaigns, selectedAds, selectedAdSets, selectedCampaigns } = useAppStore(
    (state: AppStoreType) => state.appData,
  );

  const backendStatuses = useDisplayStatusesStore(
    (state: DisplayStatusesStoreType) => state.adStatuses,
  );

  let totalAdCreditClicks = 0;
  let totalAdCreditSpend = 0;
  let totalUSDClicks = 0;
  let totalUSDSpend = 0;

  // if we have selected campaigns or ad sets, we should disable pagination
  const paginationEnabled = selectedCampaigns.length === 0 && selectedAdSets.length === 0;

  const transformServerAdResponseToRow = (rowObj: TODOFIXANY) => {
    const parentAdSet = adSets!.find((adSetObj: ServerGetAdSetRowResponse) => {
      return adSetObj!.id === rowObj!.ad_set_id;
    });
    const parentCampaign = campaigns!.find((campaignObj: ServerGetCampaignRowResponse) => {
      return campaignObj!.id === rowObj!.campaign_id;
    });

    const parentAdSetName = (parentAdSet && parentAdSet.name) || 'No Valid Parent AdSet';

    const newRow = { ...rowObj };
    newRow.statusText = GetBackendAdStatusText(backendStatuses, rowObj.id);

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

    newRow.campaignObjective = parentCampaign
      ? ServerToClient.getFromServerCampaignObjective(parentCampaign)
      : '';
    newRow.parentAdSetName = parentAdSetName;
    newRow.spent = ServerToClient.getEndUserSpend(rowObj);
    newRow.clicks = ServerToClient.getEndUserClicks(rowObj);
    newRow.ctr = ServerToClient.getEndUserCTR(rowObj);
    newRow.cpc = ServerToClient.getEndUserCPC(rowObj);
    newRow.plays = ServerToClient.getEndUserPlays(rowObj);
    newRow.playRate = ServerToClient.getEndUserPlayRate(rowObj);
    newRow.cpp = ServerToClient.getEndUserCPP(rowObj);
    newRow.adFormat = ServerToClient.getEndUserAdStatusFormat(rowObj);
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

    return newRow;
  };

  let finalSummaryRowData = tableSummaryRowData;

  if (rows) {
    let transformedRows = [];

    totalAdCreditClicks = 0;
    totalAdCreditSpend = 0;
    totalUSDClicks = 0;
    totalUSDSpend = 0;

    if (selectedAdSets.length || selectedCampaigns.length) {
      if (!selectedAdSets.length && selectedCampaigns.length) {
        transformedRows = rows
          .filter((row: TODOFIXANY) => {
            return selectedCampaigns.includes(row.campaign_id);
          })
          .map(transformServerAdResponseToRow);
      } else {
        transformedRows = selectedAds.map(transformServerAdResponseToRow);
      }

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
      const name = 'filtered-ad-summary-row';

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
    } else {
      // No selected entities
      transformedRows = rows.map(transformServerAdResponseToRow);
      if (inFilterView) {
        const {
          filteredTableSummaryRowData,
          filteredTotalAdCreditClicks,
          filteredTotalAdCreditSpend,
          filteredTotalUSDClicks,
          filteredTotalUSDSpend,
        } = ServerToClient.getSummaryForFilteredRows(transformedRows);
        finalSummaryRowData = { ...filteredTableSummaryRowData, name: 'filtered-ads-summary-row' };
        totalUSDSpend = filteredTotalUSDSpend;
        totalAdCreditSpend = filteredTotalAdCreditSpend;
        totalUSDClicks = filteredTotalUSDClicks;
        totalAdCreditClicks = filteredTotalAdCreditClicks;
      }
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
        assetIdToUrlMap={assetIdToUrlMap}
        assetMapLoading={assetMapLoading}
        headCells={getDisplayedHeadCells(
          getHeadCells(),
          adFormats,
          adsTableAdFormatRenderMap,
          true, // show creative column
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
        TableRowElement={AdsTableRow}
        tableSummaryRowData={{
          ...finalSummaryRowData,
          performance: augmentedTableSummaryRowData,
        }}
        TableSummaryRowElement={AdsTableSummaryRow}
        tableView={HOME_PAGE_TABLE_VIEWS.ads}
      />
    );
  }
  return null;
};
