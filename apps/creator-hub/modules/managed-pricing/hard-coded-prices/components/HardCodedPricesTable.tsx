/* istanbul ignore file */
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import TableControls from '@modules/monetization-shared/table-v1/TableControls';
import { useCurrentPage } from '@modules/monetization-shared/table-v1/useCurrentPage';
import { useTablePagination } from '@modules/monetization-shared/table-v1/useTablePagination';
import { useSortItems } from '@modules/monetization-shared/table-sort/useSortItems';
import useStudioEditPlaceLauncher from '@modules/miscellaneous/hooks/useStudioEditPlaceLauncher';
import EmptyState from '@modules/miscellaneous/common/components/EmptyState/EmptyState';
import type { HardCodedPriceInstance } from '../types';
import { sortHardCodedInstances } from '../utils/sortHardCodedInstances';
import HardCodedPricesTableBase from './HardCodedPricesTableBase';
import HardCodedPricesTableRow from './HardCodedPricesTableRow';

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50];
const INITIAL_ROWS_PER_PAGE = ROWS_PER_PAGE_OPTIONS[0]; // 10

type Props = {
  universeId: number;
  rootPlaceId: number;
  instances: HardCodedPriceInstance[];
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
  const { translate } = useTranslation();
  const [localInstances, setLocalInstances] = useState<HardCodedPriceInstance[]>(instances);

  const { sortedItems, sortColumn, sortOrder, onSort } = useSortItems(localInstances, {
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

  // TODO: product requirement here TBD - may update via API. Consider fading on delay
  const handleDismissInstance = useCallback((id: number) => {
    setLocalInstances((prev) => prev.filter((instance) => instance.id !== id));
  }, []);

  const rows = useMemo(
    () =>
      currentPage.map((instance) => (
        <HardCodedPricesTableRow
          key={instance.id}
          {...instance}
          onOpenInStudio={handleLaunchStudio}
          onDismiss={handleDismissInstance}
        />
      )),
    [currentPage, handleDismissInstance, handleLaunchStudio],
  );

  // TODO: will likely lift this into container, todo with API integration
  if (localInstances.length === 0) {
    return (
      <EmptyState
        title={translate('Heading.HardCodedPrices')}
        description={translate('Description.HardCodedPricesEmptyState')}
        size='small'
        illustration='chart'
      />
    );
  }

  return (
    <section className='margin-bottom-large'>
      <HardCodedPricesTableBase direction={sortOrder} sortColumn={sortColumn} onSort={onSort}>
        {rows}
      </HardCodedPricesTableBase>

      <TableControls
        rowsPerPageOptions={rowsPerPageOptions}
        count={localInstances.length}
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
