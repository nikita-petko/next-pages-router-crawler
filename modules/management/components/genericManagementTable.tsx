import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  Checkbox,
  IconButton,
  makeStyles,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from '@rbx/ui';
import { noop } from 'lodash';
import {
  ChangeEvent,
  CSSProperties,
  type JSX,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { EventName, unifiedLogger } from '@clients/unifiedLogger';
import CenteredCircularProgress from '@components/common/CenteredCircularProgress';
import { AdFormatDisplayType } from '@constants/ad';
import { creativePreviewDefaultImagePath } from '@modules/creation/components/constants/assetConstants';
import { GetTableDisplayOrderByStatus } from '@utils/displayStatus';
import { CaptureException } from '@utils/error';
import { GetLocalStorage, SetLocalStorage } from '@utils/localStorage';
import { TODOFIXANY } from 'app/shared/types';

import { InfoTooltip } from './infoTooltip';

interface TooltipProps {
  renderTooltip: boolean;
  tooltipText: string;
}

const defaultAlign = 'center';

export type CellAlignType = 'left' | 'right' | 'inherit' | 'center' | 'justify' | undefined;

interface HeadCell {
  align: string;
  customStyles: CSSProperties;
  disabled: boolean;
  id: string;
  label: string;
  renderTooltip?: boolean;
  sortable: boolean;
  tooltipText?: string;
}

interface RowCell {
  cell: JSX.Element;
  id: string;
}

export const TableTextCell = ({
  align = defaultAlign,
  className,
  textToDisplay,
}: {
  align: CellAlignType;
  className?: string;
  textToDisplay: string;
}) => {
  const {
    classes: { textEllipsisTypography },
  } = makeStyles()(() => ({
    sortIcon: {
      opacity: 1,
    },

    textEllipsisTypography: {
      display: 'inline-block',
      maxWidth: 280,
      width: '100%',
    },
  }))();
  // TODO: Come up with better solution for showing campaign names that are longer than width of container.
  // Currently the length of a string that is all `a` with no spaces
  const textTooLongToRenderWithoutEllipsis = textToDisplay.length > 28;

  const textToRender = textTooLongToRenderWithoutEllipsis ? (
    <Tooltip placement='bottom' title={textToDisplay}>
      <Typography classes={{ root: textEllipsisTypography }} noWrap>
        {textToDisplay}
      </Typography>
    </Tooltip>
  ) : (
    <Typography classes={{ root: textEllipsisTypography }} noWrap>
      {textToDisplay}
    </Typography>
  );

  return (
    <TableCell align={align} className={className || ''}>
      {textToRender}
    </TableCell>
  );
};

export const TableImageCell = ({
  assetUrl = '',
  cellClassName,
  imageClassName,
  isLoading,
  onClick,
}: {
  assetUrl: string;
  cellClassName?: string;
  imageClassName?: string;
  isLoading?: boolean;
  onClick?: () => void;
}) => {
  if (isLoading) {
    return (
      <TableCell align={defaultAlign} className={cellClassName || ''}>
        <CenteredCircularProgress />
      </TableCell>
    );
  }

  return (
    <TableCell align={defaultAlign} className={cellClassName || ''}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <img
        alt='Could Not Fetch Image'
        className={imageClassName}
        onClick={onClick}
        onKeyPress={onClick}
        src={assetUrl || creativePreviewDefaultImagePath}
      />
    </TableCell>
  );
};

export enum RowType {
  Ad = 'AD',
  AdSet = 'ADSET',
  Campaign = 'CAMPAIGN',
}

function alphabeticalComparison(a: string, b: string) {
  const valueA = a.toLocaleLowerCase();
  const valueB = b.toLocaleLowerCase();

  if (valueA === undefined || valueA === null) {
    return 1; // Put undefined values at the end for descending order
  }
  if (valueB === undefined || valueB === null) {
    return -1; // Put undefined values at the end for descending order
  }
  if (valueB < valueA) {
    return -1;
  }
  if (valueB > valueA) {
    return 1;
  }
  return 0;
}

// Decending comparator to use to sort all column. It will treat columns as string if part
// of a specific column
export function DescendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  let valueA = String(a[orderBy]);
  let valueB = String(b[orderBy]);

  // Special order handling for status
  if (orderBy === 'statusText') {
    valueA = GetTableDisplayOrderByStatus(valueA);
    valueB = GetTableDisplayOrderByStatus(valueB);
    return alphabeticalComparison(valueA, valueB);
  }
  if (
    orderBy === 'paymentMethod' ||
    orderBy === 'name' ||
    orderBy === 'adFormat' ||
    orderBy === 'parentCampaignName' ||
    orderBy === 'parentAdSetName' ||
    orderBy === 'objective'
  ) {
    return alphabeticalComparison(valueA, valueB);
  }

  if (valueA === undefined || valueA === null) {
    return 1; // Put undefined values at the end for descending order
  }
  if (valueB === undefined || valueB === null) {
    return -1; // Put undefined values at the end for descending order
  }

  let numericValueA = parseFloat(valueA.replace(/,/g, ''));
  let numericValueB = parseFloat(valueB.replace(/,/g, ''));

  if (Number.isNaN(numericValueA)) {
    numericValueA = 0;
  }
  if (Number.isNaN(numericValueB)) {
    numericValueB = 0;
  }

  if (numericValueB < numericValueA) {
    return -1;
  }
  if (numericValueB > numericValueA) {
    return 1;
  }
  return 0;
}

// Return the ids of the header/row/summary cells that should be rendered based
// on the ad formats the user uses and the tab the user is on
const getDisplayedCellIds = (
  unfilteredIds: string[],
  adFormats: AdFormatDisplayType[],
  renderMap: Map<string, Set<AdFormatDisplayType>>,
  isAdsTab: boolean,
) => {
  let filteredIds = unfilteredIds;

  // Only include creative column if the user is on the ads tab
  filteredIds = filteredIds.filter((id) => id !== 'creative' || isAdsTab);

  // Filter by ad formats
  if (adFormats && adFormats.length) {
    const finalColumnSet = new Set();
    renderMap.forEach((formatSet, id) => {
      // eslint-disable-next-line no-restricted-syntax
      for (const adFormatDisplayType of adFormats) {
        if (formatSet.has(adFormatDisplayType)) {
          finalColumnSet.add(id);
          break;
        }
      }
    });
    filteredIds = filteredIds.filter((id) => finalColumnSet.has(id));
  }

  return new Set(filteredIds);
};

// Returns the head cells that should be rendered based on the flag and ad format filtering
export const getDisplayedHeadCells = (
  headCells: HeadCell[],
  adFormats: AdFormatDisplayType[],
  renderMap: Map<string, Set<AdFormatDisplayType>>,
  isAdsTab: boolean,
) => {
  const idsToShow = getDisplayedCellIds(
    headCells.map((cell) => cell.id),
    adFormats,
    renderMap,
    isAdsTab,
  );
  return headCells.filter((headCell) => idsToShow.has(headCell.id));
};

// Returns the row/summary cells that should be rendered based on the flag and ad format filtering
export const getDisplayedRowCells = (
  rowCells: RowCell[],
  adFormats: AdFormatDisplayType[],
  renderMap: Map<string, Set<AdFormatDisplayType>>,
  isAdsTab: boolean,
) => {
  const idsToShow = getDisplayedCellIds(
    rowCells.map((cell) => cell.id),
    adFormats,
    renderMap,
    isAdsTab,
  );
  return rowCells.filter((rowCell) => idsToShow.has(rowCell.id));
};

// Get header cells based on which ad formats the user uses
export const allAdFormats = new Set<AdFormatDisplayType>([
  AdFormatDisplayType.AD_FORMAT_DISPLAY,
  AdFormatDisplayType.AD_FORMAT_PORTAL,
  AdFormatDisplayType.AD_FORMAT_SPONSORED_UNIVERSE,
  AdFormatDisplayType.AD_FORMAT_VIDEO,
  AdFormatDisplayType.AD_FORMAT_SEARCH,
]);

export const TableNameCell = ({
  align = defaultAlign,
  cancelButton,
  className,
  copyToClipboardContent,
  duplicateButton,
  editButton,
  name,
  onNameClicked,
  onRowChange = noop,
  rowChecked = false,
  rowType,
  tooltipTextToDisplay = '',
}: {
  align: CellAlignType;
  cancelButton?: TODOFIXANY;
  className?: string;
  copyToClipboardContent: string;
  duplicateButton?: ReactNode;
  editButton?: TODOFIXANY;
  name: string;
  onNameClicked?: TODOFIXANY;
  onRowChange?: TODOFIXANY;
  rowChecked?: boolean;
  rowType: RowType;
  tooltipTextToDisplay?: string;
}) => {
  const {
    classes: { checkboxRoot, rowCheckbox, textEllipsisTypography, tooltipContent, tooltipText },
  } = makeStyles()(() => ({
    checkboxRoot: {
      color: 'rgb(255,255,255) !important',
    },

    rowCheckbox: {
      marginTop: '-15px',
    },

    textEllipsisTypography: {
      cursor: onNameClicked ? 'pointer' : 'default',
      display: 'inline-block',
      maxWidth: 280,
      width: '100%',
    },

    tooltipContent: {
      alignSelf: 'center',
      display: 'flex',
      justifyContent: 'center',
    },

    tooltipText: {
      marginBottom: 'auto',
      marginTop: 'auto',
    },
  }))();

  const textToRender = (
    <Tooltip
      arrow
      placement='right'
      title={
        <div className={tooltipContent}>
          <span className={tooltipText}>{tooltipTextToDisplay || name}</span>
          <CopyToClipboard text={copyToClipboardContent}>
            <IconButton aria-label='Copy name to clipboard'>
              <ContentCopyIcon fontSize='small' />
            </IconButton>
          </CopyToClipboard>
        </div>
      }>
      <Typography classes={{ root: textEllipsisTypography }} noWrap onClick={onNameClicked || noop}>
        {name}
      </Typography>
    </Tooltip>
  );

  const checkbox =
    rowType === RowType.Campaign || rowType === RowType.AdSet ? (
      <Checkbox
        checked={rowChecked}
        classes={{ root: checkboxRoot }}
        className={rowCheckbox}
        onChange={onRowChange}
      />
    ) : null;

  return (
    <TableCell align={align} className={className || ''}>
      <div>
        {checkbox}
        {textToRender}
      </div>
      <div>
        {editButton}
        {cancelButton}
        {duplicateButton}
      </div>
    </TableCell>
  );
};

const GenericTableTooltip = ({ renderTooltip, tooltipText }: TooltipProps) => {
  const {
    classes: { tooltip },
  } = makeStyles()(() => ({
    tooltip: {
      height: 16,
      marginLeft: 4,
      width: 16,
    },
  }))();

  if (renderTooltip) {
    return <InfoTooltip classesToAdd={{ root: tooltip }} text={tooltipText} />;
  }
  return null;
};

interface GenericManagementTableProps {
  adFormats?: AdFormatDisplayType[];
  assetIdToUrlMap?: Map<number, string>;
  assetMapLoading?: boolean;
  hasNoPaymentMethod?: boolean;
  headCells: HeadCell[];
  headCellsFinalColumns: TODOFIXANY;
  headCellsWithData: TODOFIXANY;
  loadMore?: TODOFIXANY;
  nextCursor?: string;
  onCancelFailure: TODOFIXANY;
  onCancelSuccess: TODOFIXANY;
  onEditClick: TODOFIXANY;
  onEditSuccess: TODOFIXANY;
  paginationEnabled?: boolean;
  rows: TODOFIXANY;
  showFinalColumns: boolean;
  showHeader?: boolean;
  TableRowElement: TODOFIXANY;
  tableSummaryRowData?: TODOFIXANY;
  TableSummaryRowElement?: TODOFIXANY;
  tableView: string;
}

// TODO: Figure out how to get types from @rbx-ui
// TODO: Define a better type for rows (partial of some more generic type)
export const GenericManagementTable = ({
  adFormats,
  assetIdToUrlMap,
  assetMapLoading,
  hasNoPaymentMethod,
  headCells,
  headCellsFinalColumns,
  headCellsWithData,
  loadMore = noop,
  nextCursor = '',
  onCancelFailure,
  onCancelSuccess,
  onEditClick,
  onEditSuccess,
  paginationEnabled = false,
  rows,
  showFinalColumns,
  showHeader = true,
  TableRowElement,
  tableSummaryRowData,
  TableSummaryRowElement,
  tableView,
}: GenericManagementTableProps) => {
  const {
    classes: { centeredFlex },
  } = makeStyles()(() => ({
    centeredFlex: {
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'center',
    },
  }))();
  type Order = 'asc' | 'desc';

  function getComparator<Key extends keyof Record<string, string>>(
    order: Order,
    orderBy: Key,
  ): (a: { [key in Key]: number | string }, b: { [key in Key]: number | string }) => number {
    return order === 'desc'
      ? (a, b) => DescendingComparator(a, b, orderBy)
      : (a, b) => -DescendingComparator(a, b, orderBy);
  }

  function stableSort<T>(array: T[], comparator: (a: T, b: T) => number) {
    const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  }

  function useLocalStorageState<T extends string>(
    key: string,
    initialValue: T,
  ): [T, (val: T) => void] {
    const qualifiedKey = `${tableView}_${key}`;
    const existingValue = GetLocalStorage(qualifiedKey);
    const [value, setValue] = useState<T>(existingValue ? (existingValue as T) : initialValue);

    const setStoredValue = (val: T) => {
      setValue(val);
      SetLocalStorage(qualifiedKey, val);
    };

    return [value, setStoredValue];
  }

  const [order, setOrder] = useLocalStorageState<Order>('order', 'asc');
  const [orderBy, setOrderBy] = useLocalStorageState<string>('orderBy', 'statusText');

  const [page, setPage] = useState(0);

  const [rowsPerPage, setRowsPerPage] = useLocalStorageState<string>(
    `rowsPerPage_${RowType}`,
    '10',
  );
  const rowsPerPageValue = parseInt(rowsPerPage, 10);

  const [maxCount, setMaxCount] = useState(nextCursor ? -1 : rows.length);
  useMemo(() => setMaxCount(nextCursor ? -1 : rows.length), [rows]);

  useEffect(() => {
    if (headCells.length === 0) {
      CaptureException('List of column headers is empty. Nothing can be shown in table.');
    }
  }, []);

  const handleChangePage = async (_: unknown, newPage: number) => {
    // if we don't have enough rows to fill and cursor is not null, load more
    if (newPage === Math.floor(rows.length / rowsPerPageValue) && nextCursor) {
      const result = await loadMore(rows, rowsPerPageValue, nextCursor);
      if (!result.next_cursor) {
        setMaxCount(rows.length + result.length);
      }
    }
    if (newPage > page) {
      unifiedLogger.logClickEvent({
        eventName: EventName.NextPageClicked,
      });
    }
    setPage(newPage);
  };

  const handleChangeRowsPerPage = async (event: ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage.toString());
    setPage(0);
    // if less item than the new rows per page, load more
    if (rows.length < newRowsPerPage && nextCursor) {
      const result = await loadMore(rows, newRowsPerPage, nextCursor);
      setMaxCount(!result.next_cursor ? rows.length + result.length : -1);
    }
  };

  const handleRequestSort = (property: string) => {
    const isDesc = orderBy === property && order === 'desc';
    setOrder(isDesc ? 'asc' : 'desc');
    setOrderBy(property);
    unifiedLogger.logClickEvent({
      eventName: EventName.ChangeSortColumn,
      parameters: { sortKey: property, tableView },
    });
  };

  const {
    classes: { container, tableHeaderRootClass },
  } = makeStyles()((theme) => ({
    container: {
      '&::-webkit-scrollbar': {
        scrollMarginTop: '100px',
        width: '0.4em',
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: 'rgba(125,124,125,1)',
        borderRadius: '8px',
        outline: '1px solid slategrey',
      },
      '&::-webkit-scrollbar-track': {
        '-webkit-box-shadow': 'inset 0 0 6px rgba(0,0,0,0.00)',
      },
      '& tr:last-child td': {
        borderTop: '1px solid rgba(255, 255, 255, 0.12)',
      },
      backgroundColor: theme.palette.content.static.dark,
      maxHeight: '100%',
      position: 'relative',
    },

    tableHeaderRootClass: {
      '& th': {
        // TODO: ADS-3283
        // boxShadow: '60px -13px 33px 13px rgba(0, 0, 0, 0.50)', TODO:
        backgroundColor: `${theme.palette.content.static.dark} !important`,
      },
      backgroundColor: theme.palette.content.static.dark,
    },
  }))();

  const headerCellsFinalColumns = showFinalColumns ? headCellsFinalColumns : null;

  const tableHeader = showHeader ? (
    <TableHead classes={{ root: tableHeaderRootClass }}>
      <TableRow>
        {headCells.map((row: TODOFIXANY) => {
          return (
            <TableCell align={row.align || defaultAlign} key={row.id} style={row.customStyles}>
              {row.sortable ? (
                <TableSortLabel
                  active={orderBy === row.id}
                  direction={orderBy === row.id ? order : 'desc'}
                  onClick={() => handleRequestSort(row.id)}>
                  <GenericTableTooltip
                    renderTooltip={row.renderTooltip}
                    tooltipText={row.tooltipText}
                  />
                  {row.label}
                </TableSortLabel>
              ) : (
                <div style={{ alignItems: 'center', display: 'flex' }}>
                  {row.label}
                  <GenericTableTooltip
                    renderTooltip={row.renderTooltip}
                    tooltipText={row.tooltipText}
                  />
                </div>
              )}
            </TableCell>
          );
        })}
        {headCellsWithData.map((row: TODOFIXANY) => {
          let rowLabelHeader;
          let rowLabelHeaderContents;

          if (row.disabled) {
            rowLabelHeaderContents = (
              <Typography classes={{ root: centeredFlex }} color='disabled' variant='captionHeader'>
                {row.label}{' '}
                <GenericTableTooltip
                  renderTooltip={row.renderTooltip}
                  tooltipText={row.tooltipText}
                />
              </Typography>
            );
          } else {
            rowLabelHeaderContents = (
              <Typography classes={{ root: centeredFlex }} variant='captionHeader'>
                {row.label}{' '}
                <GenericTableTooltip
                  renderTooltip={row.renderTooltip}
                  tooltipText={row.tooltipText}
                />
              </Typography>
            );
          }

          if (row.sortable) {
            rowLabelHeader = (
              <TableSortLabel
                active={row.sortable && orderBy === row.id}
                direction={row.sortable && orderBy === row.id ? order : 'desc'}
                onClick={() => {
                  if (row.sortable) {
                    handleRequestSort(row.id);
                  }
                }}>
                {rowLabelHeaderContents}
              </TableSortLabel>
            );
          } else {
            rowLabelHeader = rowLabelHeaderContents;
          }

          return (
            <TableCell align={row.align || defaultAlign} key={row.id} style={row.customStyles}>
              {rowLabelHeader}
            </TableCell>
          );
        })}
        {headerCellsFinalColumns?.map((row: TODOFIXANY) => (
          <TableCell align={row.align || defaultAlign} key={row.id} style={row.customStyles} />
        ))}
      </TableRow>
    </TableHead>
  ) : null;

  const paginationStartIndex = paginationEnabled ? page * rowsPerPageValue : 0;
  const paginationEndIndex = paginationEnabled
    ? page * rowsPerPageValue + rowsPerPageValue
    : undefined;

  const tablePaginationElement =
    (paginationEnabled && (
      <TablePagination
        component='div'
        count={maxCount}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        page={page}
        rowsPerPage={rowsPerPageValue}
        rowsPerPageOptions={[10, 25, 50, 100, 150, 200]}
        style={{
          bottom: 0,
          float: 'left',
          marginLeft: '-24px',
          position: 'sticky',
          transform: 'translateZ(0)',
          zIndex: 1001,
        }}
      />
    )) ||
    null;

  const tableSummaryRow =
    tableSummaryRowData && TableSummaryRowElement ? (
      <TableSummaryRowElement
        adFormats={adFormats}
        firstColumnContent={tablePaginationElement}
        showFinalColumns={showFinalColumns}
        tableSummaryRowData={tableSummaryRowData}
      />
    ) : null;
  return (
    <div>
      <TableContainer className={container}>
        <Table stickyHeader>
          {tableHeader}
          <TableBody>
            {stableSort(rows, getComparator(order, orderBy))
              .slice(paginationStartIndex, paginationEndIndex)
              .map((row) => (
                <TableRowElement
                  adFormats={adFormats}
                  assetIdToUrlMap={assetIdToUrlMap}
                  assetMapLoading={assetMapLoading}
                  hasNoPaymentMethod={hasNoPaymentMethod}
                  headerAlignments={headCells
                    .concat(headCellsWithData, headerCellsFinalColumns)
                    .map((cellObj: TODOFIXANY) => cellObj?.align)}
                  key={row.id}
                  onCancelFailure={onCancelFailure}
                  onCancelSuccess={onCancelSuccess}
                  onEditClick={onEditClick}
                  onEditSuccess={onEditSuccess}
                  row={row}
                  showFinalColumns={showFinalColumns}
                />
              ))}
          </TableBody>
          {tableSummaryRow}
        </Table>
      </TableContainer>
    </div>
  );
};
