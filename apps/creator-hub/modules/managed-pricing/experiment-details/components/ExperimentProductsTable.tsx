/* istanbul ignore file */
import { memo, useMemo } from 'react';
import TableControls from '@modules/monetization-shared/table-v1/TableControls';
import { useTablePagination } from '@modules/monetization-shared/table-v1/useTablePagination';
import { useCurrentPage } from '@modules/monetization-shared/table-v1/useCurrentPage';
import TableFilterEmptyState from '@modules/monetization-shared/table-v1/TableFilterEmptyState';
import { useSortItems } from '@modules/monetization-shared/table-sort/useSortItems';
import { useTokenizedSearch } from '@modules/monetization-shared/useTokenizedSearch';
import DebouncedTextInput from '@modules/monetization-shared/DebouncedTextInput';
import { useTranslation } from '@rbx/intl';
import { useExperimentProductDetails } from '../hooks/useMockExperimentProductDetails';
import { useExperimentProductsFilters } from '../hooks/useExperimentProductsFilters';
import { sortExperimentProducts } from '../utils/sortExperimentProducts';
import { ExperimentProductsFilterDropdown } from './ExperimentProductsFilterDropdown';
import ExperimentProductsTableBase from './ExperimentProductsTableBase';
import ExperimentProductsTableRow from './ExperimentProductsTableRow';
import type { ExperimentProduct } from '../types';

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
const INITIAL_ROWS_PER_PAGE = ROWS_PER_PAGE_OPTIONS[0]; // 10

type Props = {
  universeId: number;
  status: 'upcoming' | 'completed';
  initialRowsPerPage?: number;
  rowsPerPageOptions?: number[];
  perPageFetchLimit?: number;
};

const getExperimentProductId = (product: ExperimentProduct) => `${product.type}-${product.id}`;

function ExperimentProductsTable({
  universeId,
  status,
  initialRowsPerPage = INITIAL_ROWS_PER_PAGE,
  rowsPerPageOptions = ROWS_PER_PAGE_OPTIONS,
  perPageFetchLimit,
}: Props) {
  const { translate } = useTranslation();
  // NOTE(jeminpark): For now, baking this in but gonna revisit and rethink component API once we adjust
  // the hook to consolidate product results cc @wchen
  const showOptimization = status === 'completed';

  const {
    products,
    developerProducts,
    gamePasses,
    isAllProductsLoaded,
    hasNextDevProductsPage,
    fetchNextDevProductsPage,
  } = useExperimentProductDetails({ universeId, status, limit: perPageFetchLimit });

  const { typeFilter, setTypeFilter, filteredProducts } = useExperimentProductsFilters({
    products,
    developerProducts,
    gamePasses,
  });

  const {
    searchQuery,
    setSearchQuery,
    results: searchedProducts,
  } = useTokenizedSearch(filteredProducts, 'name');

  const { sortColumn, sortOrder, onSort, sortedItems } = useSortItems(searchedProducts, {
    sort: sortExperimentProducts,
  });

  const hasActiveSearchOrFilter = searchQuery.trim().length > 0 || typeFilter !== null;

  const showNoMatchingItemsEmptyState =
    products.length > 0 && searchedProducts.length === 0 && hasActiveSearchOrFilter;

  const { page, rowsPerPage, onPageChange, onRowsPerPageChange } = useTablePagination({
    count: sortedItems.length,
    initialRowsPerPage,
  });

  const { currentPage } = useCurrentPage(sortedItems, {
    page,
    rowsPerPage,
    hasNextPage: typeFilter !== 'GamePass' && hasNextDevProductsPage,
    fetchNextPage: fetchNextDevProductsPage,
    fetchLimit: perPageFetchLimit,
  });

  const rows = useMemo(() => {
    if (showNoMatchingItemsEmptyState) {
      return <TableFilterEmptyState />;
    }

    return currentPage.map((product) => (
      <ExperimentProductsTableRow
        key={getExperimentProductId(product)}
        product={product}
        universeId={universeId}
        showOptimization={showOptimization}
      />
    ));
  }, [currentPage, showNoMatchingItemsEmptyState, universeId, showOptimization]);

  return (
    <section>
      <div className='flex items-center gap-medium margin-bottom-medium'>
        <DebouncedTextInput
          className='medium:min-width-[180px] medium:grow-1 medium:max-width-[250px]'
          value={searchQuery}
          type='search'
          onDebouncedChange={setSearchQuery}
          placeholder={translate('Label.Search' /* TranslationNamespace.Creations */)}
          leadingIconName='icon-regular-magnifying-glass'
          isDisabled={!isAllProductsLoaded}
          aria-label={translate('Label.SearchItems' /* TranslationNamespace.Creations */)}
          size='Medium'
        />
        <ExperimentProductsFilterDropdown
          className='width-max medium:grow-0'
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          isDisabled={!isAllProductsLoaded}
        />
      </div>

      <ExperimentProductsTableBase
        sortColumn={sortColumn}
        sortOrder={sortOrder}
        disableSort={!isAllProductsLoaded}
        onSort={onSort}
        showOptimization={showOptimization}>
        {rows}
      </ExperimentProductsTableBase>

      <TableControls
        rowsPerPageOptions={rowsPerPageOptions}
        count={searchedProducts.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        className='padding-y-small'
      />
    </section>
  );
}

export default memo(ExperimentProductsTable);
