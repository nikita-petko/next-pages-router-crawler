import { ChangeEvent, useMemo } from 'react';
import {
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@rbx/ui';
import { ProductIdentifier } from '@rbx/clients/priceExperimentationApi/v1';
import { useTranslation } from '@rbx/intl';
import { Tooltip } from '@modules/monetization-shared/tooltip';
import TableControls from '@modules/monetization-shared/table-v1/TableControls';
import { useTablePagination } from '@modules/monetization-shared/table-v1/useTablePagination';
import { useCurrentPage } from '@modules/monetization-shared/table-v1/useCurrentPage';
import { useSortItems } from '@modules/monetization-shared/table-sort/useSortItems';
import SortableTableHeader from '@modules/monetization-shared/table-sort/SortableTableHeader';
import ProductTableRow from './ProductTableRow';
import type { Product } from '../../types/product';
import { sortPriceOptimizationProducts } from '../../helpers/sortPriceOptimizationProducts';
import useRoundedTableStyles from '../common/roundedTable.styles';

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_ROWS_PER_PAGE = ROWS_PER_PAGE_OPTIONS[2];

export interface ProductTableBaseProps {
  universeId: number;
  products: Product[];
  noSelect?: boolean;
  showOptimizedPrice?: boolean;
  disabled?: boolean;
  productIdentifierToKey: (product: ProductIdentifier) => string;
  checkedProducts?: Set<string>;
  onChangeAll?: (event: ChangeEvent<HTMLInputElement>, allChecked: boolean) => void;
  onChange?: (
    event: ChangeEvent<HTMLInputElement>,
    product: ProductIdentifier,
    checked: boolean,
  ) => void;
  rowsPerPageOptions?: number[];
  defaultRowsPerPage?: number;
  numSelected: number;
  numTotal: number;
}

const ProductTableBase = ({
  universeId,
  products,
  noSelect,
  showOptimizedPrice,
  disabled,
  productIdentifierToKey,
  checkedProducts,
  onChange,
  onChangeAll,
  rowsPerPageOptions = ROWS_PER_PAGE_OPTIONS,
  defaultRowsPerPage = DEFAULT_ROWS_PER_PAGE,
  numSelected,
  numTotal,
}: ProductTableBaseProps) => {
  const { translate } = useTranslation();
  const {
    classes: { table: roundedTableClass },
  } = useRoundedTableStyles({ hasTableHead: true });

  const { sortedItems, sortColumn, sortOrder, onSort } = useSortItems(products, {
    sort: sortPriceOptimizationProducts,
  });

  const { page, rowsPerPage, onPageChange, onRowsPerPageChange } = useTablePagination({
    count: sortedItems.length,
    initialRowsPerPage: defaultRowsPerPage,
  });

  const { currentPage: displayProducts } = useCurrentPage(sortedItems, { page, rowsPerPage });

  const allProductsChecked = useMemo(() => {
    if (checkedProducts === undefined) {
      // Return undefined here for uncontrolled components
      return undefined;
    }

    if (products.length === 0) {
      return false;
    }

    // Check if all passed in products are checked
    for (let i = 0; i < products.length; i += 1) {
      // Do comparison by key
      if (!checkedProducts.has(productIdentifierToKey(products[i]))) {
        return false;
      }
    }

    // All products are contained in checkedProducts
    return true;
  }, [checkedProducts, products, productIdentifierToKey]);

  // Indeterminate if 1 or more children is checked, but not all
  // Return undefined if checkedProducts is undefined for uncontrolled component
  const isMoreThanOneProductChecked = checkedProducts !== undefined && checkedProducts.size > 0;
  const selectAllCheckboxIndeterminate =
    checkedProducts !== undefined ? isMoreThanOneProductChecked && !allProductsChecked : undefined;

  const rows = displayProducts.map((product) => {
    const key = productIdentifierToKey(product);
    return (
      <ProductTableRow
        key={key}
        universeId={universeId}
        product={product}
        noSelect={noSelect}
        showOptimizedPrice={showOptimizedPrice}
        disabled={disabled}
        checked={checkedProducts && checkedProducts.has(key)}
        onChange={(event: ChangeEvent<HTMLInputElement>, checked: boolean) =>
          onChange && onChange(event, product, checked)
        }
      />
    );
  });

  const selectAllCheckbox = noSelect ? null : (
    <TableCell padding='checkbox'>
      <Tooltip title={translate('Description.IncludeInTest')} delayDurationMs={0}>
        <Checkbox
          disabled={disabled}
          checked={allProductsChecked}
          indeterminate={selectAllCheckboxIndeterminate}
          onChange={onChangeAll}
          color='secondary'
          inputProps={{ 'aria-label': translate('Description.IncludeInTest') }}
        />
      </Tooltip>
    </TableCell>
  );

  const tableControls = (
    <TableControls
      numSelected={numSelected}
      maxSelectable={numTotal}
      rowsPerPageOptions={rowsPerPageOptions}
      count={sortedItems.length}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  );

  return (
    <TableContainer>
      {tableControls}
      <Table className={roundedTableClass}>
        <TableHead>
          <TableRow>
            {selectAllCheckbox}
            <SortableTableHeader
              column='name'
              label={translate('Heading.Table.ProductName')}
              activeColumn={sortColumn}
              sortOrder={sortOrder}
              onSort={onSort}
              sortAriaLabel={translate('Label.SortByProductName')}
            />

            <SortableTableHeader
              column='productType'
              label={translate('Heading.Table.ProductType')}
              activeColumn={sortColumn}
              sortOrder={sortOrder}
              onSort={onSort}
              sortAriaLabel={translate('Label.SortByProductType')}
            />

            <SortableTableHeader
              column='regionalPricing'
              label={translate('Heading.RegionalPricing')}
              tooltipDescription={translate('Message.RegionalPricing')}
              activeColumn={sortColumn}
              sortOrder={sortOrder}
              onSort={onSort}
              sortAriaLabel={translate('Label.SortByRegionalPricing')}
              sx={{ minWidth: '185px' }}
            />

            {showOptimizedPrice && (
              <SortableTableHeader
                column='optimization'
                label={translate('Heading.Table.Optimization')}
                activeColumn={sortColumn}
                sortOrder={sortOrder}
                onSort={onSort}
                sortAriaLabel={translate('Label.SortByOptimization')}
                align='right'
              />
            )}

            <SortableTableHeader
              column='defaultPrice'
              label={translate('Heading.Table.OriginalPrice')}
              activeColumn={sortColumn}
              sortOrder={sortOrder}
              onSort={onSort}
              sortAriaLabel={translate('Label.SortByOriginalPrice')}
              align='right'
            />

            <SortableTableHeader
              column='recommendedPrice'
              label={translate('Heading.Table.OptimizedPrice')}
              tooltipDescription={translate('Message.Table.OptimizedPrice')}
              activeColumn={sortColumn}
              sortOrder={sortOrder}
              onSort={onSort}
              sortAriaLabel={translate('Label.SortByOptimizedPrice')}
              align='right'
              className='bg-shift-200'
            />
          </TableRow>
        </TableHead>
        <TableBody>{rows}</TableBody>
      </Table>
      {tableControls}
    </TableContainer>
  );
};

export default ProductTableBase;
