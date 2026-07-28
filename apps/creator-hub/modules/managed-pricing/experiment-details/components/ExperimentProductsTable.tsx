import { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import DebouncedTextInput from '@modules/monetization-shared/DebouncedTextInput';
import { useSortItems } from '@modules/monetization-shared/table-sort/useSortItems';
import TableControls from '@modules/monetization-shared/table-v1/TableControls';
import TableFilterEmptyState from '@modules/monetization-shared/table-v1/TableFilterEmptyState';
import { useCurrentPage } from '@modules/monetization-shared/table-v1/useCurrentPage';
import { useTablePagination } from '@modules/monetization-shared/table-v1/useTablePagination';
import { useTokenizedSearch } from '@modules/monetization-shared/useTokenizedSearch';
import type { ManagedPricingEvent, ExperimentProduct } from '../../types';
import { useExperimentProductsFilters } from '../hooks/useExperimentProductsFilters';
import type { UseExperimentProductsReturn } from '../types';
import { sortExperimentProducts } from '../utils/sortExperimentProducts';
import { ExperimentProductsFilterTrigger } from './ExperimentProductsFilterTrigger';
import ExperimentProductsTableBase from './ExperimentProductsTableBase';
import ExperimentProductsTableRow from './ExperimentProductsTableRow';

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
const INITIAL_ROWS_PER_PAGE = ROWS_PER_PAGE_OPTIONS[0]; // 10
const SEARCH_FIELDS = ['name', 'id'] as const satisfies readonly (keyof ExperimentProduct)[];

type Props = UseExperimentProductsReturn & {
  universeId: number;
  status: ManagedPricingEvent['status'];
  initialRowsPerPage?: number;
  rowsPerPageOptions?: number[];
  perFetchPageSize?: number;
};

const getExperimentProductId = (product: ExperimentProduct) => `${product.type}-${product.id}`;

function ExperimentProductsTable({
  universeId,
  status,
  products,
  developerProducts,
  gamePasses,
  isAllProductsLoaded,
  hasNextPage,
  fetchNextPage,
  initialRowsPerPage = INITIAL_ROWS_PER_PAGE,
  rowsPerPageOptions = ROWS_PER_PAGE_OPTIONS,
  perFetchPageSize,
}: Props) {
  const { translate } = useTranslation();
  const showOptimization = status === 'Completed';

  const { filters, setFilters, filteredProducts } = useExperimentProductsFilters({
    products,
    developerProducts,
    gamePasses,
  });

  const {
    searchQuery,
    setSearchQuery,
    results: searchedProducts,
  } = useTokenizedSearch(filteredProducts, SEARCH_FIELDS);

  const { sortColumn, sortOrder, onSort, sortedItems } = useSortItems(searchedProducts, {
    sort: sortExperimentProducts,
  });

  const hasActiveSearchOrFilter = searchQuery.trim().length > 0 || filters.typeFilter !== undefined;

  const showNoMatchingItemsEmptyState =
    products.length > 0 && searchedProducts.length === 0 && hasActiveSearchOrFilter;

  const { page, rowsPerPage, onPageChange, onRowsPerPageChange } = useTablePagination({
    count: sortedItems.length,
    initialRowsPerPage,
  });

  const { currentPage } = useCurrentPage(sortedItems, {
    page,
    rowsPerPage,
    hasNextPage: filters.typeFilter !== 'GamePass' && hasNextPage,
    fetchNextPage,
    fetchLimit: perFetchPageSize,
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
        <ExperimentProductsFilterTrigger
          className='min-width-max medium:grow-0'
          filters={filters}
          setFilters={setFilters}
          disabled={!isAllProductsLoaded}
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

export default ExperimentProductsTable;
