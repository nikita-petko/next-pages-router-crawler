import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import type EntryFilterOptions from '../../gameStringTranslation/enums/EntryFilterOptions';
import type EntrySortingOptions from '../../gameStringTranslation/enums/EntrySortingOptions';
import SharedSorterAndFilter from '../../translation/components/shared/SorterAndFilter';

export interface ImageSorterAndFilterProps {
  sortingOption: EntrySortingOptions;
  setSortingOption: (option: EntrySortingOptions) => void;
  filterOptions: EntryFilterOptions[];
  setFilterOptions: (options: EntryFilterOptions[]) => void;
  onMenuToggled: (open: boolean) => void;
}

// Adapts the image-specific enum-typed props to the shared, generic SorterAndFilter's string-typed
// API. The narrowing handlers are memoized so the shared component receives stable references.
const ImageSorterAndFilter: FunctionComponent<ImageSorterAndFilterProps> = ({
  sortingOption,
  setSortingOption,
  filterOptions,
  setFilterOptions,
  onMenuToggled,
}) => {
  const handleSetSortingOption = useCallback(
    (option: string) => {
      // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
      setSortingOption(option as EntrySortingOptions);
    },
    [setSortingOption],
  );
  const handleSetFilterOptions = useCallback(
    (options: string[]) => {
      // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
      setFilterOptions(options as EntryFilterOptions[]);
    },
    [setFilterOptions],
  );

  return (
    <SharedSorterAndFilter
      sortingOption={sortingOption}
      setSortingOption={handleSetSortingOption}
      filterOptions={filterOptions}
      setFilterOptions={handleSetFilterOptions}
      onMenuToggled={onMenuToggled}
    />
  );
};

export default ImageSorterAndFilter;
