import { useCallback, type ChangeEvent, type FunctionComponent, type ReactNode } from 'react';
import { Button, clsx, Dropdown, Menu, MenuItem, SearchInput } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  PLAYER_SUPPORT_CATEGORY_FILTER_OPTIONS,
  PLAYER_SUPPORT_VIEW_FILTER_OPTIONS,
  PlayerSupportCategoryFilter,
  PlayerSupportDateFilter,
  PlayerSupportViewFilter,
} from '../constants/ticketFilters';
import { TICKET_CATEGORY_TRANSLATION_KEY } from '../constants/ticketLabels';
import PlayerSupportDateRangeFilter from './PlayerSupportDateRangeFilter';

interface PlayerSupportToolbarProps {
  search: string;
  dateFilter: PlayerSupportDateFilter;
  customStartDate?: Date;
  customEndDate?: Date;
  view: PlayerSupportViewFilter;
  category: PlayerSupportCategoryFilter;
  /** While a selection is active the filters give way to `bulkActions`. */
  isSelectionMode: boolean;
  onSearchChange: (value: string) => void;
  onDateFilterChange: (value: PlayerSupportDateFilter, startDate?: Date, endDate?: Date) => void;
  onViewChange: (value: PlayerSupportViewFilter) => void;
  onCategoryChange: (value: PlayerSupportCategoryFilter) => void;
  onClearFilters: () => void;
  /** Replaces the filters while rows are selected. */
  bulkActions?: ReactNode;
  /** Rendered at the trailing edge of the filter row, in both states. */
  trailingActions?: ReactNode;
}

const SEARCH_INPUT_CONTAINER_CLASS_NAME = '!outline-none !stroke-none ![box-shadow:none]';
// Pinned to the taller state's composition — a dropdown's label over its trigger — so
// the row, and the table below it, stay put when the bulk actions replace the filters.
const TOOLBAR_ROW_CLASS_NAME =
  'items-start justify-between padding-top-small gap-medium flex flex-col medium:items-end medium:height-[calc(var(--padding-small)+var(--size-600)+var(--gap-small)+var(--size-1000))] medium:flex-row';
// The label is a bare span, so its height would otherwise come from the font's line box.
const FILTER_CONTROL_CLASS_NAME =
  'flex flex-col width-[263px] medium:width-[208px] [&>span]:items-center [&>span]:height-600 [&>span]:flex [&>button]:!stroke-default [&>.foundation-web-input]:!outline-none [&>.foundation-web-input]:!stroke-default [&>.foundation-web-input]:![box-shadow:none]';
const PlayerSupportToolbar: FunctionComponent<PlayerSupportToolbarProps> = ({
  search,
  dateFilter,
  customStartDate,
  customEndDate,
  view,
  category,
  isSelectionMode,
  onSearchChange,
  onDateFilterChange,
  onViewChange,
  onCategoryChange,
  onClearFilters,
  bulkActions,
  trailingActions,
}) => {
  const { translate } = useTranslation();

  const searchLabel = translate('Label.PlayerSupport.Search');
  const allLabel = translate('Label.PlayerSupport.Filter.All');
  const clearLabel = translate('Action.PlayerSupport.ClearSearch');
  const clearFiltersLabel = translate('Action.PlayerSupport.ClearFilters');
  const viewLabel = translate('Label.PlayerSupport.Filter.View');
  const categoryLabel = translate('Label.PlayerSupport.Filter.Category');
  const readLabel = translate('Label.PlayerSupport.Filter.Read');
  const unreadLabel = translate('Label.PlayerSupport.Filter.Unread');
  const viewLabels: Record<PlayerSupportViewFilter, string> = {
    [PlayerSupportViewFilter.All]: allLabel,
    [PlayerSupportViewFilter.Read]: readLabel,
    [PlayerSupportViewFilter.Unread]: unreadLabel,
  };
  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onSearchChange(event.target.value);
    },
    [onSearchChange],
  );

  const handleViewChange = useCallback(
    (value: string) => {
      const option = PLAYER_SUPPORT_VIEW_FILTER_OPTIONS.find((candidate) => candidate === value);
      if (option) {
        onViewChange(option);
      }
    },
    [onViewChange],
  );

  const handleCategoryChange = useCallback(
    (value: string) => {
      const option = PLAYER_SUPPORT_CATEGORY_FILTER_OPTIONS.find(
        (candidate) => candidate === value,
      );
      if (option) {
        onCategoryChange(option);
      }
    },
    [onCategoryChange],
  );

  const handleClearSearch = useCallback(() => {
    onSearchChange('');
  }, [onSearchChange]);
  const hasActiveFilters =
    search.trim().length > 0 ||
    dateFilter !== PlayerSupportDateFilter.AllTime ||
    view !== PlayerSupportViewFilter.All ||
    category !== PlayerSupportCategoryFilter.All;
  const hasBulkActions = Boolean(bulkActions);
  const shouldShowToolbar = !isSelectionMode || hasBulkActions || Boolean(trailingActions);
  const toolbarCollapseClassName = clsx(
    'clip motion-reduce:[transition:none]',
    shouldShowToolbar
      ? 'visible max-height-[320px] opacity-[1] [transition:max-height_300ms_ease,opacity_300ms_ease,visibility_0s_linear_0s]'
      : 'invisible max-height-0 opacity-[0] [transition:max-height_300ms_ease,opacity_300ms_ease,visibility_0s_linear_300ms]',
  );

  return (
    <div className={toolbarCollapseClassName} aria-hidden={!shouldShowToolbar}>
      <div className='padding-top-medium gap-medium flex flex-col'>
        <SearchInput
          aria-label={searchLabel}
          id='search-player-support-requests'
          inputContainerClassName={SEARCH_INPUT_CONTAINER_CLASS_NAME}
          onChange={handleSearchChange}
          placeholder={searchLabel}
          shape='Pill'
          size='Large'
          trailingIconNode={
            search.length > 0 ? (
              <Button
                className='!content-action-link !text-label-medium shrink-0'
                variant='Link'
                size='XSmall'
                onClick={handleClearSearch}>
                {clearLabel}
              </Button>
            ) : undefined
          }
          variant='Contrast'
          value={search}
        />
        <div className={TOOLBAR_ROW_CLASS_NAME}>
          {!isSelectionMode || !hasBulkActions ? (
            <div className='gap-medium flex flex-col medium:flex-row'>
              <PlayerSupportDateRangeFilter
                className={FILTER_CONTROL_CLASS_NAME}
                dateFilter={dateFilter}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                onChange={onDateFilterChange}
              />
              <Dropdown
                className={FILTER_CONTROL_CLASS_NAME}
                label={viewLabel}
                onValueChange={handleViewChange}
                placeholder={allLabel}
                size='Medium'
                value={view}>
                <Menu>
                  {PLAYER_SUPPORT_VIEW_FILTER_OPTIONS.map((option) => (
                    <MenuItem key={option} title={viewLabels[option]} value={option} />
                  ))}
                </Menu>
              </Dropdown>
              <Dropdown
                className={FILTER_CONTROL_CLASS_NAME}
                label={categoryLabel}
                onValueChange={handleCategoryChange}
                placeholder={allLabel}
                size='Medium'
                value={category}>
                <Menu>
                  {PLAYER_SUPPORT_CATEGORY_FILTER_OPTIONS.map((option) => (
                    <MenuItem
                      key={option}
                      title={
                        option === PlayerSupportCategoryFilter.All
                          ? allLabel
                          : translate(TICKET_CATEGORY_TRANSLATION_KEY[option])
                      }
                      value={option}
                    />
                  ))}
                </Menu>
              </Dropdown>
              {hasActiveFilters && (
                <Button
                  className='self-start medium:self-end !bg-none !content-emphasis [&>div[role=presentation]]:!bg-none [&>div[role=presentation]]:!transition-none'
                  variant='Link'
                  size='Medium'
                  onClick={onClearFilters}>
                  {clearFiltersLabel}
                </Button>
              )}
            </div>
          ) : (
            bulkActions
          )}
          {trailingActions}
        </div>
      </div>
    </div>
  );
};

export default PlayerSupportToolbar;
