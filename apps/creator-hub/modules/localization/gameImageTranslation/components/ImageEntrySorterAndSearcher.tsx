import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { ReportProblemOutlinedIcon, Tooltip } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type EntryFilterOptions from '../../gameStringTranslation/enums/EntryFilterOptions';
import EntrySortingOptions from '../../gameStringTranslation/enums/EntrySortingOptions';
import SharedEntrySorterAndSearcher from '../../translation/components/shared/EntrySorterAndSearcher';
import SharedFilter from '../../translation/components/shared/Filter';
import useImageEntryInformation from '../hooks/useImageEntryInformation';
import useImageEntrySorterAndSearcherStyles from './ImageEntrySorterAndSearcher.styles';
import ImageSorterAndFilter from './ImageSorterAndFilter';

export interface ImageEntrySorterAndSearcherProps {
  sortingOption: EntrySortingOptions;
  filterOptions: EntryFilterOptions[];
  stringToSearch: string;
  onSort: (option: EntrySortingOptions) => void;
  onFilter: (options: EntryFilterOptions[]) => void;
  onSearch: (value: string) => void;
}

// Composes the shared, generic EntrySorterAndSearcher shell with the image-specific filter
// button and sort/filter menu.
const ImageEntrySorterAndSearcher: FunctionComponent<
  React.PropsWithChildren<ImageEntrySorterAndSearcherProps>
> = ({ sortingOption, filterOptions, stringToSearch, onSort, onFilter, onSearch }) => {
  const { translateWithNamespace } = useTranslation();
  const {
    classes: { statusIcon },
  } = useImageEntrySorterAndSearcherStyles();
  const { fetchFullEntryTableError, isFetchingFullEntryTable } = useImageEntryInformation();

  // Non-blocking error indicator shown next to the heading once the fetch has stopped retrying,
  // mirroring the strings sorter/searcher. Any pages loaded before the failure remain listed.
  const statusContent =
    fetchFullEntryTableError && !isFetchingFullEntryTable ? (
      <Tooltip
        className={statusIcon}
        title={translateWithNamespace(
          TranslationNamespace.GameStringTranslation,
          'Message.ErrorLoadingTable',
        )}
        arrow
        placement='bottom'>
        <ReportProblemOutlinedIcon fontSize='small' />
      </Tooltip>
    ) : null;

  return (
    <SharedEntrySorterAndSearcher
      heading={translateWithNamespace(TranslationNamespace.GameImageTranslation, 'Label.Images')}
      stringToSearch={stringToSearch}
      onSearch={onSearch}
      statusContent={statusContent}
      renderFilter={({ onFilterClicked, anchorElement }) => (
        <SharedFilter
          onFilterClicked={onFilterClicked}
          anchorElement={anchorElement}
          sortingOption={sortingOption}
          defaultSortingOption={EntrySortingOptions.Default}
          filterOptions={filterOptions}
        />
      )}
      renderMenuContent={({ onMenuToggled }) => (
        <ImageSorterAndFilter
          sortingOption={sortingOption}
          setSortingOption={onSort}
          filterOptions={filterOptions}
          setFilterOptions={onFilter}
          onMenuToggled={onMenuToggled}
        />
      )}
    />
  );
};

export default ImageEntrySorterAndSearcher;
