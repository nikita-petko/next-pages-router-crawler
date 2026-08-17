import type { FunctionComponent } from 'react';
import { useCallback, useRef } from 'react';
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
  showArchived: boolean;
  source: DevelopmentItemsSourceSelection;
};

export type DevelopmentItemsFilterSheetProps = {
  applyLabel: string;
  archiveFilter?: {
    activeLabel: string;
    archivedLabel: string;
    sectionLabel: string;
  };
  closeLabel: string;
  defaultFilters: DevelopmentItemsSheetFilters;
  filters: DevelopmentItemsSheetFilters;
  onFiltersChange: (filters: DevelopmentItemsSheetFilters) => void;
  onOpen?: () => void;
  resetLabel: string;
  showSourceFilter?: boolean;
  sourceLabel: string;
  sourceOptions: readonly InventoryFilterOption[];
  title: string;
  triggerLabel: string;
};

const DevelopmentItemsFilterSheet: FunctionComponent<DevelopmentItemsFilterSheetProps> = ({
  applyLabel,
  archiveFilter,
  closeLabel,
  defaultFilters,
  filters,
  onFiltersChange,
  onOpen,
  resetLabel,
  showSourceFilter = true,
  sourceLabel,
  sourceOptions,
  title,
  triggerLabel,
}) => {
  const isOpenRef = useRef(false);
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open && !isOpenRef.current) {
        onOpen?.();
      }
      isOpenRef.current = open;
    },
    [onOpen],
  );

  return (
    <FilterSheetRoot onOpenChange={handleOpenChange}>
      <SheetTrigger>
        <Button
          as='button'
          aria-label={triggerLabel}
          icon='icon-regular-three-bars-horizontal-narrowing'
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
            {showSourceFilter && !draftFilters.showArchived && (
              <fieldset className='flex flex-col gap-medium margin-none padding-none stroke-none'>
                <legend className='content-emphasis padding-none text-label-large'>
                  {sourceLabel}
                </legend>
                <div className='padding-top-medium'>
                  <RadioGroup
                    aria-label={sourceLabel}
                    onValueChange={(value) => {
                      if (!isDevelopmentItemsSourceSelection(value)) {
                        return;
                      }
                      setDraftFilters((previousFilters) => ({
                        ...previousFilters,
                        source: value,
                      }));
                    }}
                    size='Medium'
                    value={draftFilters.source}>
                    {sourceOptions.map((option) => (
                      <Radio key={option.value} label={option.label} value={option.value} />
                    ))}
                  </RadioGroup>
                </div>
              </fieldset>
            )}
            {archiveFilter != null && (
              <fieldset className='flex flex-col gap-medium margin-none padding-none stroke-none'>
                <legend className='content-emphasis padding-none text-label-large'>
                  {archiveFilter.sectionLabel}
                </legend>
                <div className='padding-top-medium'>
                  <RadioGroup
                    aria-label={archiveFilter.sectionLabel}
                    onValueChange={(value) => {
                      setDraftFilters((previousFilters) => ({
                        ...previousFilters,
                        showArchived: value === 'Archived',
                      }));
                    }}
                    size='Medium'
                    value={draftFilters.showArchived ? 'Archived' : 'Active'}>
                    <Radio label={archiveFilter.activeLabel} value='Active' />
                    <Radio label={archiveFilter.archivedLabel} value='Archived' />
                  </RadioGroup>
                </div>
              </fieldset>
            )}
          </div>
        )}
      </FilterSheet>
    </FilterSheetRoot>
  );
};

export default DevelopmentItemsFilterSheet;
