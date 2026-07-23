/* istanbul ignore file */
import { memo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Button, clsx } from '@rbx/foundation-ui';
import DebouncedTextInput from '@modules/monetization-shared/DebouncedTextInput';
import { useSelectionStore } from '@modules/monetization-shared/table-selection/hooks';
import { ManagedProductsFilterDropdown } from './ManagedProductsFilterDropdown';
import type {
  BulkAction,
  ManagedProduct,
  ManagedProductType,
  ManagedPricingStatusFilter,
} from '../types';

type SearchQueryProps =
  | { searchQuery: string; onSearchChange: (query: string) => void; disableSearch?: boolean }
  | { disableSearch: true; searchQuery?: never; onSearchChange?: never };

type FilterProps =
  | {
      typeFilter: ManagedProductType | null;
      statusFilter: ManagedPricingStatusFilter | null;
      onTypeFilterChange: (type: ManagedProductType | null) => void;
      onStatusFilterChange: (status: ManagedPricingStatusFilter | null) => void;
      disableFilter?: boolean;
    }
  | {
      disableFilter: true;
      typeFilter?: never;
      statusFilter?: never;
      onTypeFilterChange?: never;
      onStatusFilterChange?: never;
    };

type BulkActionProps =
  | {
      onBulkAction: (action: BulkAction) => void;
      isBulkActionPending?: boolean;
      isBulkActionDisabled?: boolean;
      hideBulkAction?: boolean;
    }
  | {
      hideBulkAction: true;
      onBulkAction?: never;
      isBulkActionPending?: never;
      isBulkActionDisabled?: never;
    };

type Props = SearchQueryProps &
  FilterProps &
  BulkActionProps & {
    className?: string;
  };

const ToggleManagedPricingButton = memo(
  ({
    isBulkActionPending,
    isBulkActionDisabled,
    onBulkAction = () => {},
  }: Omit<BulkActionProps, 'hideBulkAction'>) => {
    const { translate } = useTranslation();

    const action = useSelectionStore<string, ManagedProduct, BulkAction>(
      ({ selectedMap, viewableSelectedCount, viewableIds }) => {
        if (viewableSelectedCount === 0 || viewableIds.size === 0) {
          return 'none';
        }
        // eslint-disable-next-line no-restricted-syntax -- for-of is better
        for (const [id, product] of selectedMap) {
          if (viewableIds.has(id) && !product.isManagedPricingEnabled) {
            return 'enabling';
          }
        }
        return 'disabling';
      },
    );

    return (
      <Button
        className={clsx(
          'min-width-full medium:min-width-fit',
          action === 'none' && 'medium:invisible',
        )}
        variant={action === 'enabling' ? 'Emphasis' : 'Standard'}
        size='Medium'
        isDisabled={isBulkActionDisabled || action === 'none'}
        isLoading={isBulkActionPending}
        onClick={() => onBulkAction(action)}>
        {action === 'disabling'
          ? translate('Action.DisableManagedPricing')
          : translate('Action.EnableManagedPricing')}
      </Button>
    );
  },
);
ToggleManagedPricingButton.displayName = 'ToggleManagedPricingButton';

function ManagedProductsActionBar({
  searchQuery,
  onSearchChange = () => {},
  disableSearch,
  typeFilter,
  statusFilter,
  onTypeFilterChange = () => {},
  onStatusFilterChange = () => {},
  disableFilter,
  onBulkAction = () => {},
  isBulkActionPending,
  isBulkActionDisabled,
  hideBulkAction,
  className,
}: Props) {
  const { translate } = useTranslation();

  return (
    <div
      className={clsx(
        'flex flex-col gap-medium medium:flex-row medium:justify-between medium:items-center',
        className,
      )}>
      <div className='flex items-center gap-medium medium:flex-row medium:width-[60%]'>
        <DebouncedTextInput
          className='medium:min-width-[180px] medium:grow-1 medium:max-width-[250px]'
          value={searchQuery}
          type='search'
          onDebouncedChange={onSearchChange}
          placeholder={translate('Label.Search' /* TranslationNamespace.Creations */)}
          leadingIconName='icon-regular-magnifying-glass'
          isDisabled={disableSearch}
          aria-label={translate('Label.SearchItems' /* TranslationNamespace.Creations */)}
          size='Medium'
        />
        <ManagedProductsFilterDropdown
          className='width-max medium:grow-0'
          typeFilter={typeFilter ?? null}
          statusFilter={statusFilter ?? null}
          onTypeFilterChange={onTypeFilterChange}
          onStatusFilterChange={onStatusFilterChange}
          isDisabled={disableFilter}
        />
      </div>

      {!hideBulkAction && (
        <ToggleManagedPricingButton
          isBulkActionPending={isBulkActionPending}
          isBulkActionDisabled={isBulkActionDisabled}
          onBulkAction={onBulkAction}
        />
      )}
    </div>
  );
}

export default memo(ManagedProductsActionBar);
