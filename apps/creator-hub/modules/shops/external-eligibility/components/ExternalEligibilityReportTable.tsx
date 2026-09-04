import { memo, useMemo } from 'react';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { MAX_DISPLAYED_COUNT } from '@modules/monetization-shared/display-count';
import { useSortItems } from '@modules/monetization-shared/table-sort/useSortItems';
import TableControls from '@modules/monetization-shared/table-v1/TableControls';
import TableFilterEmptyState from '@modules/monetization-shared/table-v1/TableFilterEmptyState';
import { useCurrentPage } from '@modules/monetization-shared/table-v1/useCurrentPage';
import { useTablePagination } from '@modules/monetization-shared/table-v1/useTablePagination';
import { useTokenizedSearch } from '@modules/monetization-shared/useTokenizedSearch';
import { getShopItemKey, type ShopItem } from '../../types';
import { sortExternalEligibilityReportItems } from '../utils/sortExternalEligibilityReportItems';
import ExternalEligibilityReportActionBar from './ExternalEligibilityReportActionBar';
import ExternalEligibilityReportTableBase from './ExternalEligibilityReportTableBase';
import ExternalEligibilityReportTableRow from './ExternalEligibilityReportTableRow';

type Props = {
  items: ShopItem[];
};

const SEARCH_FIELDS = ['name', 'id'] as const satisfies readonly (keyof ShopItem)[];
const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

function ExternalEligibilityReportTable({ items }: Props) {
  const {
    searchQuery,
    setSearchQuery,
    results: searchedItems,
  } = useTokenizedSearch(items, SEARCH_FIELDS);
  const { sortColumn, sortOrder, onSort, sortedItems } = useSortItems(searchedItems, {
    sort: sortExternalEligibilityReportItems,
  });
  const { page, rowsPerPage, onPageChange, onRowsPerPageChange } = useTablePagination({
    count: sortedItems.length,
    initialRowsPerPage: ROWS_PER_PAGE_OPTIONS[0],
    resetKey: searchQuery,
  });
  const { currentPage: visibleItems } = useCurrentPage(sortedItems, { page, rowsPerPage });
  const showNoMatchingItemsEmptyState =
    items.length > 0 && searchedItems.length === 0 && searchQuery.trim().length > 0;

  const rows = useMemo(
    () =>
      visibleItems.map((item) => (
        <ExternalEligibilityReportTableRow key={getShopItemKey(item)} item={item} />
      )),
    [visibleItems],
  );

  return (
    <section className='width-full'>
      <ExternalEligibilityReportActionBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <ExternalEligibilityReportTableBase
        sortColumn={sortColumn}
        sortOrder={sortOrder}
        onSort={onSort}>
        {showNoMatchingItemsEmptyState ? <TableFilterEmptyState /> : rows}
      </ExternalEligibilityReportTableBase>
      <TableControls
        count={searchedItems.length}
        maxDisplayedCount={MAX_DISPLAYED_COUNT}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        className='padding-y-small'
      />
    </section>
  );
}

export default withTranslation(memo(ExternalEligibilityReportTable), [
  TranslationNamespace.PersonalizedShop,
  TranslationNamespace.Table,
  TranslationNamespace.DeveloperProducts,
  TranslationNamespace.Creations,
]);
