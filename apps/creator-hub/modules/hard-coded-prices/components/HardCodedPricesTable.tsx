import { memo, useCallback, useMemo } from 'react';
import useStudioEditPlaceLauncher from '@modules/miscellaneous/hooks/useStudioEditPlaceLauncher';
import { useSortItems } from '@modules/monetization-shared/table-sort/useSortItems';
import TableControls from '@modules/monetization-shared/table-v1/TableControls';
import { useCurrentPage } from '@modules/monetization-shared/table-v1/useCurrentPage';
import { useTablePagination } from '@modules/monetization-shared/table-v1/useTablePagination';
import type { HardCodedPriceReference } from '../types';
import { sortHardCodedInstances } from '../utils/sortHardCodedInstances';
import HardCodedPricesTableBase from './HardCodedPricesTableBase';
import HardCodedPricesTableRow from './HardCodedPricesTableRow';

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50];
const INITIAL_ROWS_PER_PAGE = ROWS_PER_PAGE_OPTIONS[0]; // 10

/** Max count displayed on table */
const MAX_DISPLAYED_COUNT = 99;

/**
 * Generates a unique key for a hard-coded price reference. Needed as sometimes
 * paths + lines + entities CAN be duplicated in annotations.
 */
function getReferenceKey(instance: HardCodedPriceReference, absoluteIndex: number) {
  return `${instance.path}-${instance.lineStart}-${instance.lineEnd}-${absoluteIndex}`;
}

type Props = {
  universeId: number;
  rootPlaceId: number;
  instances: HardCodedPriceReference[];
  initialRowsPerPage?: number;
  rowsPerPageOptions?: number[];
};

function HardCodedPricesTable({
  universeId,
  rootPlaceId,
  instances,
  initialRowsPerPage = INITIAL_ROWS_PER_PAGE,
  rowsPerPageOptions = ROWS_PER_PAGE_OPTIONS,
}: Props) {
  const { sortedItems, sortColumn, sortOrder, onSort } = useSortItems(instances, {
    initialColumn: 'filename',
    initialOrder: 'default',
    sort: sortHardCodedInstances,
  });

  const { page, rowsPerPage, onPageChange, onRowsPerPageChange } = useTablePagination({
    count: sortedItems.length,
    initialRowsPerPage,
  });

  const { currentPage } = useCurrentPage(sortedItems, { page, rowsPerPage });

  const { launch: launchStudio, dialog: studioDialog } = useStudioEditPlaceLauncher();

  // TODO: deeplinking to studio file
  const handleLaunchStudio = useCallback(
    () => launchStudio(universeId, rootPlaceId),
    [launchStudio, universeId, rootPlaceId],
  );

  const rows = useMemo(
    () =>
      currentPage.map((instance, index) => (
        <HardCodedPricesTableRow
          key={getReferenceKey(instance, page * rowsPerPage + index)}
          rootPlaceId={rootPlaceId}
          {...instance}
          onOpenInStudio={handleLaunchStudio}
        />
      )),
    [rootPlaceId, currentPage, page, rowsPerPage, handleLaunchStudio],
  );

  return (
    <section className='margin-bottom-large'>
      <HardCodedPricesTableBase sortOrder={sortOrder} sortColumn={sortColumn} onSort={onSort}>
        {rows}
      </HardCodedPricesTableBase>

      <TableControls
        rowsPerPageOptions={rowsPerPageOptions}
        count={instances.length}
        maxDisplayedCount={MAX_DISPLAYED_COUNT}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        className='padding-y-small'
      />

      {studioDialog}
    </section>
  );
}

export default memo(HardCodedPricesTable);
