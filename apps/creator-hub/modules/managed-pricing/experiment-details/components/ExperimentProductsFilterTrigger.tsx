import { memo } from 'react';
import { Radio, RadioGroup } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  FilterSheet,
  FilterSheetRoot,
  FilterSheetTrigger,
} from '@modules/monetization-shared/filter-sheet/FilterSheet';
import { noop } from '@modules/monetization-shared/noop';
import type { ManagedProductType } from '../../types';
import type { ExperimentProductsFilters } from '../types';

const ALL_VALUE = 'all';
const TYPE_DEVELOPER_PRODUCT: ManagedProductType = 'DeveloperProduct';
const TYPE_GAME_PASS: ManagedProductType = 'GamePass';

const DEFAULT_FILTERS = {};

function toTypeFilter(value: string): ManagedProductType | undefined {
  if (value === TYPE_DEVELOPER_PRODUCT || value === TYPE_GAME_PASS) {
    return value;
  }

  return undefined;
}

export type ExperimentProductsFilterTriggerProps = {
  /** Currently-applied filters. Defaults to an empty (unfiltered) state. */
  filters?: ExperimentProductsFilters;
  /** Called when the user presses Apply. Defaults to a no-op for placeholder / disabled states. */
  setFilters?: (filters: ExperimentProductsFilters) => void;
  disabled?: boolean;
  className?: string;
};

export const ExperimentProductsFilterTrigger = memo(
  ({
    filters = DEFAULT_FILTERS,
    setFilters = noop,
    disabled,
    className,
  }: ExperimentProductsFilterTriggerProps) => {
    const { translate } = useTranslation();

    return (
      <FilterSheetRoot>
        <FilterSheetTrigger
          className={className}
          disabled={disabled}
          aria-label={translate('Label.OpenItemFilters' /* TranslationNamespace.Creations */)}>
          {translate('Label.FilterBy' /* TranslationNamespace.Creations */)}
        </FilterSheetTrigger>

        {!disabled && (
          <FilterSheet
            filters={filters}
            defaultFilters={DEFAULT_FILTERS}
            setFilters={setFilters}
            title={translate('Label.FilterBy' /* TranslationNamespace.Creations */)}
            applyLabel={translate('Action.Apply' /* TranslationNamespace.Creations */)}
            resetLabel={translate('Action.ResetAll' /* TranslationNamespace.Creations */)}
            closeLabel={translate('Action.Close' /* TranslationNamespace.Creations */)}>
            {({ draftFilters, setDraftFilters }) => (
              <div className='flex flex-col gap-xxlarge'>
                <RadioGroup
                  groupLabel={translate('Label.ProductType' /* TranslationNamespace.Creations */)}
                  value={draftFilters.typeFilter ?? ALL_VALUE}
                  onValueChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      typeFilter: toTypeFilter(value),
                    }))
                  }>
                  <Radio
                    value={ALL_VALUE}
                    label={translate('Label.All' /* TranslationNamespace.Creations */)}
                  />
                  <Radio
                    value={TYPE_DEVELOPER_PRODUCT}
                    label={translate(
                      'Label.DeveloperProduct' /* TranslationNamespace.ManagedPricing */,
                    )}
                  />
                  <Radio
                    value={TYPE_GAME_PASS}
                    label={translate('Label.GamePass' /* TranslationNamespace.ManagedPricing */)}
                  />
                </RadioGroup>
              </div>
            )}
          </FilterSheet>
        )}
      </FilterSheetRoot>
    );
  },
);

ExperimentProductsFilterTrigger.displayName = 'ExperimentProductsFilterTrigger';
