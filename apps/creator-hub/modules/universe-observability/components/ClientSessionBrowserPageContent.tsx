import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import useSessionBrowserFilters from '../hooks/useSessionBrowserFilters';
import type { DateRangeSelection } from '../types/Filters';
import { toPlaySessionQueryOptions } from '../utils/sessionBrowserFilters';
import ClientSessionBrowserTable from './ClientSessionBrowserTable';
import ClientSessionsMetadataClientProvider from './ClientSessionsMetadataClientProvider';
import DateRangeControl from './DateRangeControl';

const ClientSessionBrowserPageContent: FC<{ universeId: number }> = ({ universeId }) => {
  const { filters, updateFilters, isUrlReady } = useSessionBrowserFilters();
  const queryOptions = useMemo(() => toPlaySessionQueryOptions(filters), [filters]);
  const handleDateRangeChange = useCallback(
    (dateRange: DateRangeSelection) => {
      updateFilters({ ...filters, dateRange });
    },
    [filters, updateFilters],
  );

  return (
    <ClientSessionsMetadataClientProvider>
      {isUrlReady && (
        <div className='flex flex-col gap-medium padding-top-small'>
          <div className='flex flex-col gap-medium width-full large:flex-row'>
            <DateRangeControl value={filters.dateRange} onChange={handleDateRangeChange} />
          </div>
          <ClientSessionBrowserTable universeId={universeId} queryOptions={queryOptions} />
        </div>
      )}
    </ClientSessionsMetadataClientProvider>
  );
};

export default ClientSessionBrowserPageContent;
