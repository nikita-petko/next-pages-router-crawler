import { memo } from 'react';
import {
  VALID_PAGE_SIZES,
  useCountSubscriptions,
  usePaginatedSubscriptions,
} from '../hooks/usePaginatedSubscriptions';
import { useTablePagination } from '../hooks/useTablePagination';
import SubscriptionsTableBase from './SubscriptionsTableBase';
import SubscriptionsTableControls from './SubscriptionsTableControls';
import SubscriptionsTableRow from './SubscriptionsTableRow';

type Props = {
  universeId: number;
  initialRowsPerPage?: number;
};

const ROWS_PER_PAGE_OPTIONS = VALID_PAGE_SIZES;
const INITIAL_ROWS_PER_PAGE = ROWS_PER_PAGE_OPTIONS[2]; // 50

function SubscriptionsTable({ universeId, initialRowsPerPage = INITIAL_ROWS_PER_PAGE }: Props) {
  const { data: count = 0 } = useCountSubscriptions({ universeId });

  const { page, rowsPerPage, onPageChange, onRowsPerPageChange } = useTablePagination({
    count,
    initialRowsPerPage,
  });

  const { paginatedSubscriptions } = usePaginatedSubscriptions({
    universeId,
    page,
    rowsPerPage,
    reset: () => onPageChange(null, 0),
  });

  return (
    <section>
      <SubscriptionsTableControls
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        count={count}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        className='padding-y-[8px]'
      />

      <SubscriptionsTableBase>
        {paginatedSubscriptions.map((subscription) => (
          <SubscriptionsTableRow key={subscription.id} {...subscription} />
        ))}
      </SubscriptionsTableBase>

      <SubscriptionsTableControls
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        count={count}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        className='padding-y-[8px]'
      />
    </section>
  );
}

export default memo(SubscriptionsTable);
