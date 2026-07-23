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

const getSharedHeadCells = (): (SortableHeadCell | UnsortableHeadCell)[] => [
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
    label: 'Label.RobuxEarnings',
    renderTooltip: true,
    sortKey: 'total_robux_revenue_30d',
    tooltipText: 'Tooltip.RobuxEarningsDescription',
  },
];

const roasHeadCell: SortableHeadCell = {
  align: 'end',
  classNameKey: HeadCellName.SharedRoas,
  disabled: false,
  label: 'Label.ROAS',
  renderTooltip: true,
  sortKey: 'roas',
  tooltipText: 'Tooltip.ROASDescription',
};

interface CampaignTableHeadCellOptions {
  // When true, append the ROAS column. Gated by AMA's enable_campaign_roas
  // dynamic config flag surfaced through /metadata as isCampaignRoasEnabled.
  includeRoas?: boolean;
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
    ...getSharedHeadCells(),
  ];
  if (options.includeRoas) {
    cells.push(roasHeadCell);
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
