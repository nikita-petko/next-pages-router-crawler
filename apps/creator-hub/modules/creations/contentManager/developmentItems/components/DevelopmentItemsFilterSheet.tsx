import type { FunctionComponent } from 'react';
import { Button, Radio, RadioGroup, SheetTrigger } from '@rbx/foundation-ui';
import {
  FilterSheet,
  FilterSheetRoot,
} from '@modules/monetization-shared/filter-sheet/FilterSheet';
import {
  isDevelopmentItemsSourceSelection,
  type DevelopmentItemsSourceSelection,
} from '../developmentItemsInventoryUtils';
import type { InventoryFilterOption } from './InventoryFilterDropdown';

export type DevelopmentItemsSheetFilters = {
  source: DevelopmentItemsSourceSelection;
};

export type DevelopmentItemsFilterSheetProps = {
  applyLabel: string;
  closeLabel: string;
  defaultFilters: DevelopmentItemsSheetFilters;
  filters: DevelopmentItemsSheetFilters;
  onFiltersChange: (filters: DevelopmentItemsSheetFilters) => void;
  resetLabel: string;
  sourceLabel: string;
  sourceOptions: readonly InventoryFilterOption[];
  title: string;
  triggerLabel: string;
};

const DevelopmentItemsFilterSheet: FunctionComponent<DevelopmentItemsFilterSheetProps> = ({
  applyLabel,
  closeLabel,
  defaultFilters,
  filters,
  onFiltersChange,
  resetLabel,
  sourceLabel,
  sourceOptions,
  title,
  triggerLabel,
}) => (
  <FilterSheetRoot>
    <SheetTrigger>
      <Button
        as='button'
        aria-label={triggerLabel}
        icon='icon-regular-three-sliders-horizontal'
        size='Medium'
        variant='Standard'>
        {triggerLabel}
      </Button>
    </SheetTrigger>
    <FilterSheet
      applyLabel={applyLabel}
      closeLabel={closeLabel}
      defaultFilters={defaultFilters}
      filters={filters}
      resetLabel={resetLabel}
      setFilters={onFiltersChange}
      title={title}>
      {({ draftFilters, setDraftFilters }) => (
        <div className='flex flex-col gap-xxlarge'>
          <RadioGroup
            groupLabel={sourceLabel}
            onValueChange={(value) => {
              if (!isDevelopmentItemsSourceSelection(value)) {
                return;
              }
              setDraftFilters((previousFilters) => ({
                ...previousFilters,
                source: value,
              }));
            }}
            size='Small'
            value={draftFilters.source}>
            {sourceOptions.map((option) => (
              <Radio key={option.value} label={option.label} value={option.value} />
            ))}
          </RadioGroup>
        </div>
      )}
    </FilterSheet>
  </FilterSheetRoot>
);

export default DevelopmentItemsFilterSheet;
