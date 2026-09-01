import { TranslationNamespace } from '@constants/localization';
import { SortableHeadCell, UnsortableHeadCell } from '@type/genericManagementTable';

export const enum HeadCellName {
  AdCreative = 'adCreativeHeadCell',
  AdStatus = 'adStatusHeadCell',
  AdToggle = 'adToggleHeadCell',
  CampaignActionMenu = 'campaignActionMenuHeadCell',
  CampaignCreator = 'campaignCreatorHeadCell',
  CampaignDateModified = 'campaignDateModifiedHeadCell',
  CampaignName = 'campaignNameHeadCell',
  CampaignStatus = 'campaignStatusHeadCell',
  CampaignToggle = 'campaignToggleHeadCell',
  CampaignType = 'campaignTypeHeadCell',
  SharedGenericStat = 'sharedGenericStatHeadCell',
  SharedPlaytime = 'sharedPlaytimeHeadCell',
  SharedRoas = 'sharedRoasHeadCell',
  SharedRobuxRevenue = 'sharedRobuxRevenueHeadCell',
  SharedWithPaymentUnits = 'sharedWithPaymentUnitsHeadCell',
}

export const enum AdTableColumnId {
  ACTION_MENU = 'action_menu',
  ACTIVE = 'active',
  CREATIVE = 'creative',
  PLATFORM = 'platform',
  STATUS_TEXT = 'status_text',
}

// The earnings column doubles as "Robux Earnings" (Robux-only, the historical
// default for every caller) and as "Earnings" for callers whose cell also
// renders a USD subtext beneath the Robux value. The label + tooltip swap is
// gated on the same rollout signal (isCampaignRoasEnabled) as the USD fetch
// itself so non-cohort users keep the old "Robux Earnings" header.
const getSharedHeadCells = ({
  showCombinedEarningsLabel = false,
}: { showCombinedEarningsLabel?: boolean } = {}): (SortableHeadCell | UnsortableHeadCell)[] => [
  {
    align: 'end',
    classNameKey: HeadCellName.SharedWithPaymentUnits,
    disabled: false,
    label: 'Label.Spent',
    renderTooltip: true,
    sortKey: 'display_spending_usd',
    tooltipText: 'Tooltip.SpentDescription',
  },
  {
    align: 'end',
    classNameKey: HeadCellName.SharedGenericStat,
    disabled: false,
    label: 'Label.Impressions',
    renderTooltip: true,
    sortKey: 'impression',
    tooltipText: 'Tooltip.ImpressionsDescription',
  },
  {
    align: 'end',
    classNameKey: HeadCellName.SharedGenericStat,
    disabled: false,
    label: 'Label.CTR',
    renderTooltip: true,
    sortKey: 'click_through_rate',
    tooltipText: 'Tooltip.CTRDescription',
  },
  {
    align: 'end',
    classNameKey: HeadCellName.SharedGenericStat,
    disabled: false,
    label: 'Label.Clicks',
    renderTooltip: true,
    sortKey: 'click_count',
    tooltipText: 'Tooltip.ClicksDescription',
  },
  {
    align: 'end',
    classNameKey: HeadCellName.SharedGenericStat,
    disabled: false,
    label: 'Label.Plays',
    labelNamespace: TranslationNamespace.Campaign,
    renderTooltip: true,
    sortKey: 'play_count',
    tooltipText: 'Tooltip.PlaysDescription',
  },
  {
    align: 'end',
    classNameKey: HeadCellName.SharedWithPaymentUnits,
    disabled: false,
    label: 'Label.CPP',
    renderTooltip: true,
    sortKey: 'cost_per_play_usd',
    tooltipText: 'Tooltip.CPPDescription',
  },
  {
    align: 'end',
    classNameKey: HeadCellName.SharedPlaytime,
    disabled: false,
    label: 'Label.Playtime',
    renderTooltip: true,
    sortKey: 'total_play_time_hours_7d',
    tooltipText: 'Tooltip.PlaytimeDescription',
  },
  {
    align: 'end',
    classNameKey: HeadCellName.SharedRobuxRevenue,
    disabled: false,
    label: showCombinedEarningsLabel ? 'Label.Earnings' : 'Label.RobuxEarnings',
    renderTooltip: true,
    sortKey: 'total_robux_revenue_30d',
    tooltipText: showCombinedEarningsLabel
      ? 'Tooltip.EarningsDescription'
      : 'Tooltip.RobuxEarningsDescription',
  },
];

const roasHeadCellBase = {
  align: 'end',
  classNameKey: HeadCellName.SharedRoas,
  disabled: false,
  label: 'Label.ROAS',
  renderTooltip: true,
  tooltipText: 'Tooltip.ROASDescription',
} as const;

const sortableRoasHeadCell: SortableHeadCell = { ...roasHeadCellBase, sortKey: 'roas' };
// AMA loads other perf metrics eagerly for the whole dataset but ROAS is
// viewport-only via visibleCampaignRoasState, so we drop sortability there
// rather than expose an unstable page-local sort.
const unsortableRoasHeadCell: UnsortableHeadCell = { ...roasHeadCellBase, id: 'roas' };

interface CampaignTableHeadCellOptions {
  // When true, append the ROAS column. Gated by AMA's enable_campaign_roas
  // dynamic config flag surfaced through /metadata as isCampaignRoasEnabled.
  includeRoas?: boolean;
  // When false, the ROAS column renders but its header is not sortable.
  // Defaults to true.
  roasSortable?: boolean;
  // When true, the shared earnings column header switches from "Robux Earnings"
  // to "Earnings" (matches the USD subtext rendered in the cell for the same
  // cohort). Kept independent of includeRoas so the two rollouts could be
  // decoupled if the earnings surface ever ships to a different cohort.
  showCombinedEarningsLabel?: boolean;
  showCreatorColumn?: boolean;
}

export const getCampaignTableHeadCells = (
  options: CampaignTableHeadCellOptions = {},
): (SortableHeadCell | UnsortableHeadCell)[] => {
  const cells: (SortableHeadCell | UnsortableHeadCell)[] = [
    {
      align: 'start',
      classNameKey: HeadCellName.CampaignName,
      disabled: false,
      label: 'Label.Campaign',
      sortKey: 'name',
    },
    {
      align: 'start',
      classNameKey: HeadCellName.CampaignActionMenu,
      disabled: false,
      id: 'action_menu',
      label: '',
    },
    {
      align: 'start',
      classNameKey: HeadCellName.CampaignToggle,
      disabled: false,
      id: 'active',
      label: 'Label.OffOn',
      renderTooltip: true,
      tooltipText: 'Tooltip.OffOnToggle',
    },
    {
      align: 'start',
      classNameKey: HeadCellName.CampaignStatus,
      disabled: false,
      label: 'Label.Status',
      sortKey: 'status_text',
    },
    {
      align: 'start',
      classNameKey: HeadCellName.CampaignType,
      disabled: false,
      label: 'Label.CampaignType',
      sortKey: 'objective',
    },
    ...getSharedHeadCells({
      showCombinedEarningsLabel: options.showCombinedEarningsLabel,
    }),
  ];
  if (options.includeRoas) {
    cells.push(options.roasSortable === false ? unsortableRoasHeadCell : sortableRoasHeadCell);
  }
  if (options.showCreatorColumn) {
    cells.push(
      {
        align: 'start',
        classNameKey: HeadCellName.CampaignCreator,
        disabled: false,
        label: 'Label.CreatedBy',
        sortKey: 'creator_username',
      },
      {
        align: 'start',
        classNameKey: HeadCellName.CampaignDateModified,
        disabled: false,
        label: 'Label.DateModified',
        sortKey: 'updated_timestamp_ms',
      },
    );
  }
  return cells;
};

// Deprecated: Use getCampaignTableHeadCells instead
export const campaignTableHeadCells: (SortableHeadCell | UnsortableHeadCell)[] =
  getCampaignTableHeadCells();

export const getAdTableHeadCells = (
  includesPlatformColumn: boolean,
  hideToggleColumn: boolean = false,
): (SortableHeadCell | UnsortableHeadCell)[] => {
  const baseHeaders: (SortableHeadCell | UnsortableHeadCell)[] = [
    {
      align: 'start',
      classNameKey: HeadCellName.AdCreative,
      disabled: false,
      id: AdTableColumnId.CREATIVE,
      label: 'Label.Creative',
      renderTooltip: true,
      tooltipText: 'Tooltip.AdCreativeHeader',
    } as UnsortableHeadCell,
  ];

  if (!hideToggleColumn) {
    baseHeaders.push({
      align: 'start',
      classNameKey: HeadCellName.AdToggle,
      disabled: false,
      id: AdTableColumnId.ACTIVE,
      label: 'Label.OffOn',
      renderTooltip: true,
      tooltipText: 'Tooltip.OffOnToggle',
    } as UnsortableHeadCell);
  }

  baseHeaders.push({
    align: 'start',
    classNameKey: HeadCellName.AdStatus,
    disabled: false,
    label: 'Label.Status',
    sortKey: AdTableColumnId.STATUS_TEXT,
  } as SortableHeadCell);

  if (includesPlatformColumn) {
    baseHeaders.push({
      align: 'start',
      classNameKey: HeadCellName.SharedGenericStat,
      disabled: false,
      id: AdTableColumnId.PLATFORM,
      label: 'Label.Platform',
    } as UnsortableHeadCell);
  }

  return [...baseHeaders, ...getSharedHeadCells()];
};

// Deprecated: Use getAdTableHeadCells instead
export const adTableHeadCells: (SortableHeadCell | UnsortableHeadCell)[] = getAdTableHeadCells(
  false,
  false,
);
