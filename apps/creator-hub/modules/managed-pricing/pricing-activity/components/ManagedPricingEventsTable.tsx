import { memo, useMemo } from 'react';
import TableControls from '@modules/monetization-shared/table-v1/TableControls';
import { useCurrentPage } from '@modules/monetization-shared/table-v1/useCurrentPage';
import { useTablePagination } from '@modules/monetization-shared/table-v1/useTablePagination';
import type { ManagedPricingEvent } from '../../types';
import ManagedPricingEventsTableBase from './ManagedPricingEventsTableBase';
import ManagedPricingEventsTableRow from './ManagedPricingEventsTableRow';

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50];
const INITIAL_ROWS_PER_PAGE = ROWS_PER_PAGE_OPTIONS[0]; // 10

type Props = {
  universeId: number;
  events: ManagedPricingEvent[];
  initialRowsPerPage?: number;
  rowsPerPageOptions?: number[];
};

function ManagedPricingEventsTable({
  universeId,
  events,
  initialRowsPerPage = INITIAL_ROWS_PER_PAGE,
  rowsPerPageOptions = ROWS_PER_PAGE_OPTIONS,
}: Props) {
  const { page, rowsPerPage, onPageChange, onRowsPerPageChange } = useTablePagination({
    count: events.length,
    initialRowsPerPage,
  });

  const { currentPage } = useCurrentPage(events, { page, rowsPerPage });

  const rows = useMemo(
    () =>
      currentPage.map((event) => (
        <ManagedPricingEventsTableRow key={event.id} universeId={universeId} event={event} />
      )),
    [currentPage, universeId],
  );

  return (
    <section className='margin-bottom-large'>
      <ManagedPricingEventsTableBase>{rows}</ManagedPricingEventsTableBase>

      <TableControls
        rowsPerPageOptions={rowsPerPageOptions}
        count={events.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        className='padding-y-small'
      />
    </section>
  );
}

export default memo(ManagedPricingEventsTable);
