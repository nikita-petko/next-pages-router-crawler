import { memo } from 'react';
import { Button, clsx } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Divider } from '@rbx/ui';
import DebouncedTextInput from '@modules/monetization-shared/DebouncedTextInput';
import { noop } from '@modules/monetization-shared/noop';
import {
  useBulkToggleAction,
  useHasMatchingViewableSelection,
  useHasViewableSelection,
  type BulkActionHandler,
} from '@modules/monetization-shared/table-selection/hooks';
import { Tooltip } from '@modules/monetization-shared/tooltip';
import { isVisibilityEditable, type ShopItem, type ShopItemsFilters } from '../../types';
import { ShopItemsFilterSheet } from './ShopItemsFilterSheet';

// Stable fallback so the memo on `ShopItemsFilterSheet` survives renders where
// `categoryOptions` hasn't loaded yet.
const EMPTY_CATEGORY_OPTIONS: readonly string[] = [];

const isNotVisibilityEditable = (item: ShopItem): boolean => !isVisibilityEditable(item);

type SearchProps =
  | { searchQuery: string; onSearchChange: (query: string) => void; disableSearch?: boolean }
  | { disableSearch: true; searchQuery?: never; onSearchChange?: never };

type FilterProps =
  | {
      filters?: ShopItemsFilters;
      setFilters?: (filters: ShopItemsFilters) => void;
      categoryOptions: readonly string[];
      disableFilter?: boolean;
    }
  | {
      disableFilter: true;
      filters?: never;
      setFilters?: never;
      categoryOptions?: never;
    };

type BulkActionProps =
  | {
      onBulkVisibilityAction?: BulkActionHandler;
      onBulkEditCategory?: () => void;
      areCategoriesLoading?: boolean;
      hasPendingEdits?: boolean;
      onPublish?: () => void;
      isPublishing?: boolean;
      hideBulkAction?: boolean;
    }
  | {
      hideBulkAction: true;
      onBulkVisibilityAction?: never;
      onBulkEditCategory?: never;
      areCategoriesLoading?: never;
      hasPendingEdits?: never;
      onPublish?: never;
      isPublishing?: never;
    };

type Props = SearchProps &
  FilterProps &
  BulkActionProps & {
    className?: string;
  };

const BulkVisibilityButton = memo(
  ({
    onBulkVisibilityAction,
    disabled,
  }: {
    onBulkVisibilityAction?: BulkActionHandler;
    disabled?: boolean;
  }) => {
    const { translate } = useTranslation();

    const action = useBulkToggleAction<string, ShopItem>((item) =>
      isVisibilityEditable(item) ? item.isVisibleInShop : null,
    );
    const hasNonEditableSelected = useHasMatchingViewableSelection<string, ShopItem>(
      isNotVisibilityEditable,
    );

    return (
      <Tooltip
        title={translate('Message.ListItemsTooltip')}
        disabled={!hasNonEditableSelected}
        addTriggerSlot>
        <Button
          className='shrink-0'
          variant='Standard'
          size='Medium'
          isDisabled={action === 'none' || disabled}
          onClick={() => action !== 'none' && onBulkVisibilityAction?.(action)}>
          {action === 'disabling' ? translate('Action.UnlistItems') : translate('Action.ListItems')}
        </Button>
      </Tooltip>
    );
  },
);
BulkVisibilityButton.displayName = 'BulkVisibilityButton';

const BulkEditCategoryButton = memo(
  ({ onBulkEditCategory, disabled }: { onBulkEditCategory?: () => void; disabled?: boolean }) => {
    const { translate } = useTranslation();
    const hasSelection = useHasViewableSelection<string, ShopItem>();

    return (
      <Button
        className='shrink-0'
        variant='Standard'
        size='Medium'
        isDisabled={!hasSelection || disabled}
        onClick={onBulkEditCategory}>
        {translate('Action.EditCategory')}
      </Button>
    );
  },
);
BulkEditCategoryButton.displayName = 'BulkEditCategoryButton';

function ShopItemsActionBar({
  searchQuery,
  onSearchChange,
  disableSearch,
  filters,
  setFilters,
  categoryOptions,
  disableFilter,
  onBulkVisibilityAction,
  onBulkEditCategory,
  areCategoriesLoading,
  hasPendingEdits,
  onPublish,
  isPublishing,
  hideBulkAction,
  className,
}: Props) {
  const { translate } = useTranslation();

  return (
    <div
      className={clsx(
        'flex flex-col gap-medium medium:flex-row medium:wrap medium:justify-between medium:items-center',
        className,
      )}>
      <div className='flex items-center gap-medium medium:flex-row medium:width-[60%]'>
        <DebouncedTextInput
          className='medium:min-width-[180px] medium:grow-1 medium:max-width-[350px]'
          value={searchQuery ?? ''}
          type='search'
          onDebouncedChange={onSearchChange ?? noop}
          isDisabled={disableSearch}
          placeholder={translate('Label.Search')}
          leadingIconName='icon-regular-magnifying-glass'
          aria-label={translate('Label.AriaLabel.SearchItems')}
          size='Medium'
        />
        <ShopItemsFilterSheet
          className='min-width-max medium:grow-0'
          filters={filters}
          setFilters={setFilters}
          categoryOptions={categoryOptions ?? EMPTY_CATEGORY_OPTIONS}
          disabled={disableFilter}
        />
      </div>

      {!hideBulkAction && (
        <div className='flex items-center large:flex-row gap-medium [overflow-x:auto]'>
          <div className='flex medium:justify-end gap-medium medium:flex-row min-width-fit shrink-0'>
            <BulkVisibilityButton
              onBulkVisibilityAction={onBulkVisibilityAction}
              disabled={isPublishing}
            />
            <BulkEditCategoryButton
              onBulkEditCategory={onBulkEditCategory}
              disabled={(isPublishing ?? false) || (areCategoriesLoading ?? false)}
            />
          </div>
          <Divider
            orientation='vertical'
            flexItem
            className='margin-x-[1px] height-1000 shrink-0'
          />
          <Button
            className='shrink-0'
            variant='Emphasis'
            size='Medium'
            icon='icon-filled-arrow-up-from-landscape-rectangle'
            isDisabled={!hasPendingEdits || isPublishing}
            isLoading={isPublishing}
            onClick={onPublish}>
            {translate('Action.Publish')}
          </Button>
        </div>
      )}
    </div>
  );
}

export default memo(ShopItemsActionBar);
