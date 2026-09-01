import { memo } from 'react';
import { Button, clsx } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import DebouncedTextInput from '@modules/monetization-shared/DebouncedTextInput';
import {
  useBulkToggleAction,
  type BulkToggleAction,
} from '@modules/monetization-shared/table-selection/hooks';
import type { ManagedProduct } from '../../types';
import type { ManagedProductsFilters } from '../types';
import { ManagedProductsFilterTrigger } from './ManagedProductsFilterTrigger';

type SearchQueryProps =
  | { searchQuery: string; onSearchChange: (query: string) => void; disableSearch?: boolean }
  | { disableSearch: true; searchQuery?: never; onSearchChange?: never };

type FilterProps =
  | {
      filters?: ManagedProductsFilters;
      setFilters?: (filters: ManagedProductsFilters) => void;
      disableFilter?: boolean;
    }
  | {
      disableFilter: true;
      filters?: never;
      setFilters?: never;
    };

type BulkActionProps =
  | {
      onBulkAction: (action: Exclude<BulkToggleAction, 'none'>) => void;
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
    onBulkAction,
  }: Omit<BulkActionProps, 'hideBulkAction'>) => {
    const { translate } = useTranslation();

    const action = useBulkToggleAction(
      (product: ManagedProduct) => product.isManagedPricingEnabled,
    );

    return (
      <Button
        className={clsx(
          'min-width-full medium:min-width-fit',
          action === 'none' && 'medium:invisible',
        )}
        variant={action === 'enabling' ? 'Emphasis' : 'Standard'}
        size='Medium'
        isDisabled={!!isBulkActionDisabled || action === 'none'}
        isLoading={isBulkActionPending}
        onClick={() => action !== 'none' && onBulkAction?.(action)}>
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
  onSearchChange,
  disableSearch,
  filters,
  setFilters,
  disableFilter,
  onBulkAction,
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
      <div className='flex items-center gap-medium medium:flex-row medium:width-[70%]'>
        <DebouncedTextInput
          className='medium:min-width-[180px] medium:grow-1 medium:max-width-[280px]'
          value={searchQuery}
          type='search'
          onDebouncedChange={onSearchChange}
          placeholder={translate('Label.Search' /* TranslationNamespace.Creations */)}
          leadingIconName='icon-regular-magnifying-glass'
          isDisabled={disableSearch}
          aria-label={translate('Label.SearchItems' /* TranslationNamespace.Creations */)}
          size='Medium'
        />
        <ManagedProductsFilterTrigger
          className='min-width-max medium:grow-0'
          filters={filters}
          setFilters={setFilters}
          disabled={disableFilter}
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
