import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import type {
  DevelopmentItemsAssetTypeSelection,
  DevelopmentItemsInventoryItem,
  DevelopmentItemsSourceSelection,
  DevelopmentItemsView,
} from './developmentItemsInventoryUtils';

const CREATOR_INVENTORY_SURFACE = 'development_items';

type AnalyticsParameter = boolean | number | string | undefined;
type AnalyticsParameters = Record<string, AnalyticsParameter>;

export type DevelopmentItemsCreatorType = 'group' | 'user';
export type DevelopmentItemsMenuSource = 'context_menu' | 'overflow';
export type DevelopmentItemsMenuAction =
  | 'archive_asset'
  | 'configure_asset'
  | 'copy_asset_id'
  | 'copy_mesh_id'
  | 'copy_texture_id'
  | 'open_asset_details'
  | 'restore_asset';

const stringifyParameters = (parameters: AnalyticsParameters): Record<string, string> =>
  Object.entries(parameters).reduce<Record<string, string>>((result, [key, value]) => {
    if (value !== undefined) {
      result[key] = String(value);
    }
    return result;
  }, {});

const logClickEvent = (eventName: CreatorDashboardEventType, parameters: AnalyticsParameters) => {
  unifiedLoggerClient.logClickEvent({
    eventName,
    parameters: stringifyParameters({
      ...parameters,
      surface: CREATOR_INVENTORY_SURFACE,
    }),
  });
};

const logImpressionEvent = (
  eventName: CreatorDashboardEventType,
  parameters: AnalyticsParameters,
) => {
  unifiedLoggerClient.logImpressionEvent({
    eventName,
    parameters: stringifyParameters({
      ...parameters,
      surface: CREATOR_INVENTORY_SURFACE,
    }),
  });
};

const getItemParameters = (item: DevelopmentItemsInventoryItem): AnalyticsParameters => ({
  asset_id: item.assetId,
  asset_type: item.assetType ?? 'unknown',
  item_state: item.state ?? 'unknown',
  item_sources: item.sources.join(','),
});

export const logDevelopmentItemsPageView = (parameters: {
  assetType: DevelopmentItemsAssetTypeSelection;
  creatorType: DevelopmentItemsCreatorType;
  queryLength: number;
  showArchived: boolean;
  source: DevelopmentItemsSourceSelection;
  view: DevelopmentItemsView;
}) => {
  logImpressionEvent(CreatorDashboardEventType.CreatorInventoryPageView, {
    asset_type: parameters.assetType,
    creator_type: parameters.creatorType,
    query_length: parameters.queryLength,
    show_archived: parameters.showArchived,
    source_filter: parameters.source,
    view_mode: parameters.view,
  });
};

type DevelopmentItemDisplayEventParameters = {
  item: DevelopmentItemsInventoryItem;
  pageNumber: number;
  pageSize: number;
  position: number;
  view: DevelopmentItemsView;
};

export const logDevelopmentItemImpression = ({
  item,
  pageNumber,
  pageSize,
  position,
  view,
}: DevelopmentItemDisplayEventParameters) => {
  logImpressionEvent(CreatorDashboardEventType.CreatorInventoryItemImpression, {
    ...getItemParameters(item),
    page_number: pageNumber,
    page_size: pageSize,
    position,
    view_mode: view,
  });
};

export const logDevelopmentItemClick = ({
  item,
  pageNumber,
  pageSize,
  position,
  view,
}: DevelopmentItemDisplayEventParameters) => {
  logClickEvent(CreatorDashboardEventType.CreatorInventoryItemClick, {
    ...getItemParameters(item),
    page_number: pageNumber,
    page_size: pageSize,
    position,
    view_mode: view,
  });
};

export const logDevelopmentItemsSearch = (parameters: {
  action: 'clear' | 'scope_select' | 'submit';
  assetType: DevelopmentItemsAssetTypeSelection;
  queryLength: number;
  selectedAssetType?: DevelopmentItemsAssetTypeSelection;
}) => {
  logClickEvent(CreatorDashboardEventType.CreatorInventorySearch, {
    action: parameters.action,
    asset_type: parameters.assetType,
    query_length: parameters.queryLength,
    selected_asset_type: parameters.selectedAssetType,
  });
};

export const logDevelopmentItemsFilter = (parameters: {
  action: 'apply' | 'clear_archived' | 'clear_source' | 'open' | 'reset';
  showArchived: boolean;
  source: DevelopmentItemsSourceSelection;
}) => {
  logClickEvent(CreatorDashboardEventType.CreatorInventoryFilter, {
    action: parameters.action,
    show_archived: parameters.showArchived,
    source_filter: parameters.source,
  });
};

export const logDevelopmentItemsAssetTypeChange = (parameters: {
  from: DevelopmentItemsAssetTypeSelection;
  to: DevelopmentItemsAssetTypeSelection;
}) => {
  logClickEvent(CreatorDashboardEventType.CreatorInventoryAssetTypeChange, {
    from_asset_type: parameters.from,
    to_asset_type: parameters.to,
  });
};

export const logDevelopmentItemsViewChange = (parameters: {
  from: DevelopmentItemsView;
  to: DevelopmentItemsView;
}) => {
  logClickEvent(CreatorDashboardEventType.CreatorInventoryViewChange, {
    from_view_mode: parameters.from,
    to_view_mode: parameters.to,
  });
};

export const logDevelopmentItemsPagination = (parameters: {
  action: 'page_change' | 'page_size_change';
  from: number;
  to: number;
}) => {
  logClickEvent(CreatorDashboardEventType.CreatorInventoryPagination, {
    action: parameters.action,
    from: parameters.from,
    to: parameters.to,
  });
};

export const logDevelopmentItemsMenuOpen = (
  item: DevelopmentItemsInventoryItem,
  source: DevelopmentItemsMenuSource,
) => {
  logClickEvent(CreatorDashboardEventType.CreatorInventoryMenuOpen, {
    ...getItemParameters(item),
    menu_source: source,
  });
};

export const logDevelopmentItemsMenuAction = (
  item: DevelopmentItemsInventoryItem,
  action: DevelopmentItemsMenuAction,
  source: DevelopmentItemsMenuSource | 'table_cell',
) => {
  logClickEvent(CreatorDashboardEventType.CreatorInventoryMenuAction, {
    ...getItemParameters(item),
    action,
    menu_source: source,
  });
};

export const logDevelopmentItemsRetry = (parameters: {
  assetType: DevelopmentItemsAssetTypeSelection;
  showArchived: boolean;
}) => {
  logClickEvent(CreatorDashboardEventType.CreatorInventoryRetry, {
    asset_type: parameters.assetType,
    show_archived: parameters.showArchived,
  });
};
