import { memo } from 'react';
import { ProductType } from '@rbx/client-shops-api/v1';
import { Radio, RadioGroup } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  FilterSheet,
  FilterSheetRoot,
  FilterSheetTrigger,
} from '@modules/monetization-shared/filter-sheet/FilterSheet';
import { MultiSelect } from '@modules/monetization-shared/foundation-multiselect';
import { noop } from '@modules/monetization-shared/noop';
import type { ShopItemsFilters } from '../../types';

const ALL_VALUE = 'all';

const VISIBILITY_LISTED = 'listed';
const VISIBILITY_UNLISTED = 'unlisted';

const TYPE_PASS = ProductType.GamePass;
const TYPE_DEVELOPER_PRODUCT = ProductType.DeveloperProduct;

const DEFAULT_FILTERS: ShopItemsFilters = {};

function toVisibilityFilter(value: string): boolean | undefined {
  if (value === VISIBILITY_LISTED) {
    return true;
  }
  if (value === VISIBILITY_UNLISTED) {
    return false;
  }
  return undefined;
}

function fromVisibilityFilter(isVisibleInShop: boolean | undefined): string {
  if (isVisibleInShop === true) {
    return VISIBILITY_LISTED;
  }
  if (isVisibleInShop === false) {
    return VISIBILITY_UNLISTED;
  }
  return ALL_VALUE;
}

function toTypeFilter(value: string): ProductType | undefined {
  if (value === TYPE_PASS || value === TYPE_DEVELOPER_PRODUCT) {
    return value;
  }
  return undefined;
}

function toCategoriesFilter(values: string[]): string[] | undefined {
  return values.length === 0 ? undefined : values;
}

function formatCategoriesValue(values: string[]): string {
  if (values.length === 0) {
    return '';
  }
  if (values.length === 1) {
    return values[0];
  }
  return `${values.length} selected`;
}

export type ShopItemsFilterSheetProps = {
  /** Currently-applied filters. Defaults to an empty (unfiltered) state. */
  filters?: ShopItemsFilters;
  /** Called when the user presses Apply. Defaults to a no-op for placeholder / disabled states. */
  setFilters?: (filters: ShopItemsFilters) => void;
  /** Categories shown in the multi-select. Sourced from the loaded items today; will move to a dedicated API once available. */
  categoryOptions: readonly string[];
  disabled?: boolean;
  className?: string;
};

export const ShopItemsFilterSheet = memo(
  ({
    filters = DEFAULT_FILTERS,
    setFilters = noop,
    categoryOptions,
    disabled,
    className,
  }: ShopItemsFilterSheetProps) => {
    const { translate } = useTranslation();
    const triggerLabel = translate('Action.Filter');

    return (
      <FilterSheetRoot>
        <FilterSheetTrigger
          className={className}
          disabled={disabled}
          aria-label={translate('Label.AriaLabel.OpenItemFilters')}>
          {triggerLabel}
        </FilterSheetTrigger>

        {!disabled && (
          <FilterSheet
            filters={filters}
            defaultFilters={DEFAULT_FILTERS}
            setFilters={setFilters}
            title={translate('Heading.Filter')}
            applyLabel={translate('Action.Apply')}
            resetLabel={translate('Action.ResetAll')}
            closeLabel={translate('Action.Close')}>
            {({ draftFilters, setDraftFilters }) => (
              <div className='flex flex-col gap-xxlarge'>
                <RadioGroup
                  groupLabel={translate('Label.ShopVisibility')}
                  value={fromVisibilityFilter(draftFilters.isVisibleInShop)}
                  onValueChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      isVisibleInShop: toVisibilityFilter(value),
                    }))
                  }>
                  <Radio value={ALL_VALUE} label={translate('Label.All')} />
                  <Radio value={VISIBILITY_LISTED} label={translate('Label.Listed')} />
                  <Radio value={VISIBILITY_UNLISTED} label={translate('Label.Unlisted')} />
                </RadioGroup>

                <RadioGroup
                  groupLabel={translate('Label.ProductType')}
                  value={draftFilters.type ?? ALL_VALUE}
                  onValueChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      type: toTypeFilter(value),
                    }))
                  }>
                  <Radio value={ALL_VALUE} label={translate('Label.All')} />
                  <Radio value={TYPE_PASS} label={translate('Label.Pass')} />
                  <Radio
                    value={TYPE_DEVELOPER_PRODUCT}
                    label={translate('Label.DeveloperProduct')}
                  />
                </RadioGroup>

                <MultiSelect
                  label={translate('Label.Category')}
                  size='Medium'
                  placeholder={translate('Label.SelectCategory')}
                  value={draftFilters.categories ?? []}
                  formatValue={formatCategoriesValue}
                  onValueChange={(values) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      categories: toCategoriesFilter(values),
                    }))
                  }>
                  <MultiSelect.Menu className='pointer-events-auto overflow-hidden padding-small ![box-shadow:none]'>
                    {categoryOptions.map((category) => (
                      <MultiSelect.MenuItem key={category} value={category} title={category} />
                    ))}
                  </MultiSelect.Menu>
                </MultiSelect>
              </div>
            )}
          </FilterSheet>
        )}
      </FilterSheetRoot>
    );
  },
);

ShopItemsFilterSheet.displayName = 'ShopItemsFilterSheet';
