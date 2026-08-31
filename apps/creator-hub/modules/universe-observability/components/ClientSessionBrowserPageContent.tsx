import { useCallback, useMemo, type FC } from 'react';
import useSessionBrowserFilters from '../hooks/useSessionBrowserFilters';
import type { DateRangeSelection } from '../types/Filters';
import type { SessionBrowserDrawerFilters } from '../types/SessionBrowserFilters';
import { toPlaySessionQueryOptions } from '../utils/sessionBrowserFilters';
import ClientSessionBrowserFilterChips from './ClientSessionBrowserFilterChips';
import ClientSessionBrowserFilterDrawer from './ClientSessionBrowserFilterDrawer';
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
  const handleDrawerApply = useCallback(
    (drawerFilters: SessionBrowserDrawerFilters) => {
      updateFilters({ dateRange: filters.dateRange, ...drawerFilters });
    },
    [filters.dateRange, updateFilters],
  );

  return (
    <ClientSessionsMetadataClientProvider>
      {isUrlReady && (
        <div className='flex flex-col gap-medium padding-top-small'>
          <div className='flex flex-col gap-medium width-full large:flex-row large:items-end'>
            <DateRangeControl value={filters.dateRange} onChange={handleDateRangeChange} />
            <ClientSessionBrowserFilterDrawer
              filters={filters}
              universeId={universeId}
              onApply={handleDrawerApply}
            />
          </div>
          <ClientSessionBrowserFilterChips
            universeId={universeId}
            filters={filters}
            onChange={updateFilters}
          />
          <ClientSessionBrowserTable universeId={universeId} queryOptions={queryOptions} />
        </div>
      )}
    </ClientSessionsMetadataClientProvider>
  );
};

export default ClientSessionBrowserPageContent;
