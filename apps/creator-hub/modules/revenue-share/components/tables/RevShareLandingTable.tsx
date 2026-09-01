// Renders revenue-share agreement rows with stable ordering, party counts, and target identity cells.
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type FunctionComponent,
  type KeyboardEvent,
} from 'react';
import {
  Icon,
  ProgressCircle,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TablePagination,
  TableRow,
} from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  REV_SHARE_ROWS_PER_PAGE_OPTIONS,
  sliceRevShareTablePage,
} from '../../hooks/useRevShareClientTablePagination';
import {
  RevShareConfirmationStatus,
  RevShareTargetType,
  type ManagerAgreement,
  type RecipientAgreement,
  type RevShareTarget,
} from '../../interface/RevShareViewModel';
import { asNumberTypedId, formatBasisPoints } from '../../utils/revShareUtils';
import RevShareStatusBadge from '../RevShareStatusBadge';
import RevShareThumbnailWithNames from '../RevShareThumbnailWithNames';
import styles from './RevShareLandingTable.module.css';

/** Mutable copy for Foundation `TablePagination` (`number[]`); keep module-stable. */
const REV_SHARE_ROWS_PER_PAGE_OPTIONS_LIST: number[] = [...REV_SHARE_ROWS_PER_PAGE_OPTIONS];

export type RevShareLandingTablePagination = {
  page: number;
  rowsPerPage: number;
  totalRows: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  /** True while more inventory pages are still loading in the background. */
  isInventoryLoading?: boolean;
};

type RevShareLandingTableCommonProps = {
  showHeader?: boolean;
  emptyMessage?: string;
  focusTarget?: RevShareTarget | null;
  /** When set, rows are ordered then sliced; footer uses Foundation TablePagination. */
  pagination?: RevShareLandingTablePagination;
};

export type RevShareLandingTableProps = RevShareLandingTableCommonProps &
  (
    | {
        mode: 'manager';
        rows: ManagerAgreement[];
        onRowClick?: (row: ManagerAgreement) => void;
      }
    | {
        mode: 'recipient';
        rows: RecipientAgreement[];
        onRowClick?: (row: RecipientAgreement) => void;
      }
  );

type RevShareLandingTableRowProps =
  | {
      mode: 'manager';
      agreement: ManagerAgreement;
      onRowClick?: (row: ManagerAgreement) => void;
      restoreFocus?: boolean;
    }
  | {
      mode: 'recipient';
      agreement: RecipientAgreement;
      onRowClick?: (row: RecipientAgreement) => void;
      restoreFocus?: boolean;
    };

const CHEVRON_COLUMN_CLASS = 'width-800 min-width-800';
const MANAGER_CONTENT_COLUMN_WIDTH = '[width:calc((100%_-_var(--size-800))/4)]';
const RECIPIENT_CONTENT_COLUMN_WIDTH = '[width:calc((100%_-_var(--size-800))/3)]';
const RESOURCE_COLUMN_MIN_CLASS = 'min-width-2400';
const ALIGNED_COLUMN_MIN_CLASS = 'min-width-2500';
const STATUS_COLUMN_MIN_CLASS = '[min-width:190px]';

const alignContentClass = (align?: 'center' | 'right') => {
  if (align === 'center') {
    return 'justify-center';
  }
  if (align === 'right') {
    return 'justify-end';
  }
  return '';
};

const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, onActivate: () => void) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onActivate();
  }
};

const partitionPendingFirst = <T,>(rows: readonly T[], isPending: (row: T) => boolean) => {
  const pendingRows: T[] = [];
  const nonPendingRows: T[] = [];

  rows.forEach((row) => {
    (isPending(row) ? pendingRows : nonPendingRows).push(row);
  });

  return [...pendingRows, ...nonPendingRows];
};

const RevShareLandingTableRow: FunctionComponent<RevShareLandingTableRowProps> = (props) => {
  const rowRef = useRef<HTMLTableRowElement>(null);
  const target = useMemo(
    () => ({ id: asNumberTypedId(props.agreement.target.id) }),
    [props.agreement.target.id],
  );

  // `onRowClick`/`agreement` are only type-correlated while `props` is still narrowed by
  // `mode`, so each branch must read them into its own locals here (not destructured or
  // hoisted above the narrowing check) to stay type-safe without an `as`/`any` cast.
  const onActivate = useMemo(() => {
    if (props.mode === 'manager') {
      const managerOnRowClick = props.onRowClick;
      const managerAgreement = props.agreement;
      return managerOnRowClick ? () => managerOnRowClick(managerAgreement) : undefined;
    }
    const recipientOnRowClick = props.onRowClick;
    const recipientAgreement = props.agreement;
    return recipientOnRowClick ? () => recipientOnRowClick(recipientAgreement) : undefined;
  }, [props.mode, props.onRowClick, props.agreement]);

  const onRowKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTableRowElement>) => {
      if (onActivate) {
        handleRowKeyDown(event, onActivate);
      }
    },
    [onActivate],
  );

  useEffect(() => {
    if (props.restoreFocus) {
      rowRef.current?.focus();
    }
  }, [props.restoreFocus]);

  const isInteractive = onActivate != null;

  return (
    <TableRow
      ref={rowRef}
      isInteractive={isInteractive}
      isHoverable={isInteractive}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      className={isInteractive ? 'cursor-pointer' : ''}
      onClick={onActivate}
      onKeyDown={isInteractive ? onRowKeyDown : undefined}>
      <TableCell className={`padding-x-large padding-y-medium ${RESOURCE_COLUMN_MIN_CLASS}`}>
        <RevShareThumbnailWithNames
          target={target}
          targetType={
            props.agreement.target.type === RevShareTargetType.Experience ? 'Experience' : 'Ugc'
          }
          displayNameOverride={props.agreement.targetName}
          variant='compact'
          disableLink
        />
      </TableCell>
      {props.mode === 'manager' && (
        <TableCell
          align='center'
          className={`padding-x-large padding-y-medium ${ALIGNED_COLUMN_MIN_CLASS}`}>
          <div className={`flex items-center width-full ${alignContentClass('center')}`}>
            <span className='text-body-medium content-default'>
              {props.agreement.active.recipients.length > 0
                ? String(props.agreement.active.recipients.length)
                : '-'}
            </span>
          </div>
        </TableCell>
      )}
      <TableCell
        align='center'
        className={`padding-x-large padding-y-medium ${ALIGNED_COLUMN_MIN_CLASS}`}>
        <div className={`flex items-center width-full ${alignContentClass('center')}`}>
          <span className='text-body-medium content-emphasis [font-weight:600]'>
            {`${formatBasisPoints(
              props.mode === 'manager'
                ? props.agreement.active.managingGroupBasisPoints
                : props.agreement.active.recipientBasisPoints,
            )}%`}
          </span>
        </div>
      </TableCell>
      <TableCell
        align='center'
        className={`padding-x-large padding-y-medium ${STATUS_COLUMN_MIN_CLASS}`}>
        <div className={`flex items-center width-full ${alignContentClass('center')}`}>
          <RevShareStatusBadge
            status={
              props.mode === 'manager'
                ? props.agreement.proposed
                  ? RevShareConfirmationStatus.Pending
                  : undefined
                : props.agreement.proposed?.confirmation
            }
          />
        </div>
      </TableCell>
      <TableCell
        align='center'
        className={`padding-x-large padding-y-medium ${CHEVRON_COLUMN_CLASS}`}>
        {onActivate ? (
          <div className={`flex items-center width-full ${alignContentClass('center')}`}>
            <Icon name='icon-regular-chevron-small-right' size='Medium' aria-hidden />
          </div>
        ) : null}
      </TableCell>
    </TableRow>
  );
};

const getPagedRows = <T,>(
  rows: readonly T[],
  pagination: RevShareLandingTablePagination | undefined,
): T[] => {
  if (!pagination) {
    return [...rows];
  }
  return sliceRevShareTablePage(rows, pagination.page, pagination.rowsPerPage);
};

const RevShareLandingTable: FunctionComponent<RevShareLandingTableProps> = (props) => {
  const { showHeader = true, pagination } = props;
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const emptyMessage =
    props.emptyMessage ??
    tPendingTranslation(
      'No revenue share agreements',
      'Fallback message shown when the revenue share landing table has no rows.',
      translationKey('Message.NoAgreements', TranslationNamespace.RevenueShareAgreements),
    );
  const isManagerMode = props.mode === 'manager';
  const columnCount = isManagerMode ? 5 : 4;

  const managerContentColumnClass = MANAGER_CONTENT_COLUMN_WIDTH;
  const recipientContentColumnClass = RECIPIENT_CONTENT_COLUMN_WIDTH;

  const managerPageRows = useMemo(() => {
    if (props.mode !== 'manager') {
      return null;
    }
    return getPagedRows(
      partitionPendingFirst(props.rows, (agreement) => agreement.proposed !== null),
      pagination,
    );
  }, [pagination, props.mode, props.rows]);

  const recipientPageRows = useMemo(() => {
    if (props.mode !== 'recipient') {
      return null;
    }
    return getPagedRows(
      partitionPendingFirst(
        props.rows,
        (agreement) => agreement.proposed?.confirmation === RevShareConfirmationStatus.Pending,
      ),
      pagination,
    );
  }, [pagination, props.mode, props.rows]);

  const pageRows = managerPageRows ?? recipientPageRows ?? [];

  const rowsPerPageLabel = translate(
    translationKey('Label.RowsPerPage', TranslationNamespace.Table),
  );
  const isInventoryLoading = pagination?.isInventoryLoading === true;
  const inventoryLoadingLabel = tPendingTranslation(
    'Loading more results',
    'Accessible label for the progress circle while revenue share inventory continues loading.',
    translationKey('Label.LoadingMoreTargets', TranslationNamespace.RevenueShareAgreements),
  );
  const rangeLabel = useCallback(
    (start: number, end: number, total: number) =>
      translate(translationKey('Label.PageRange', TranslationNamespace.Table), {
        pageRange: `${start}-${end}`,
        totalPageCount: isInventoryLoading ? `${total}+` : String(total),
      }),
    [isInventoryLoading, translate],
  );

  const bodyRows = (() => {
    if (props.mode === 'manager') {
      return (managerPageRows ?? []).map((agreement) => (
        <RevShareLandingTableRow
          key={`${agreement.target.type}:${agreement.target.id}`}
          mode='manager'
          agreement={agreement}
          onRowClick={props.onRowClick}
          restoreFocus={
            props.focusTarget?.type === agreement.target.type &&
            props.focusTarget.id === agreement.target.id
          }
        />
      ));
    }
    return (recipientPageRows ?? []).map((agreement) => (
      <RevShareLandingTableRow
        key={`${agreement.target.type}:${agreement.target.id}`}
        mode='recipient'
        agreement={agreement}
        onRowClick={props.onRowClick}
        restoreFocus={
          props.focusTarget?.type === agreement.target.type &&
          props.focusTarget.id === agreement.target.id
        }
      />
    ));
  })();

  return (
    <div className='flex flex-col gap-small width-full'>
      {/* Foundation always paints bg-surface-100 on an inner wrapper; clear it like Virtual Transactions. */}
      <div className={`${styles.tableSurface} width-full`}>
        <Table size='Medium' variant='Divided' className='width-full'>
          <colgroup>
            <col
              className={`${isManagerMode ? managerContentColumnClass : recipientContentColumnClass} ${RESOURCE_COLUMN_MIN_CLASS}`}
            />
            {isManagerMode && (
              <col className={`${managerContentColumnClass} ${ALIGNED_COLUMN_MIN_CLASS}`} />
            )}
            <col
              className={`${isManagerMode ? managerContentColumnClass : recipientContentColumnClass} ${ALIGNED_COLUMN_MIN_CLASS}`}
            />
            <col
              className={`${isManagerMode ? managerContentColumnClass : recipientContentColumnClass} ${STATUS_COLUMN_MIN_CLASS}`}
            />
            <col className={CHEVRON_COLUMN_CLASS} />
          </colgroup>
          {showHeader && (
            <TableHeader>
              <TableRow>
                <TableHeaderCell
                  className={`text-label-small content-muted padding-x-large padding-y-medium ${RESOURCE_COLUMN_MIN_CLASS}`}>
                  {tPendingTranslation(
                    'Resource',
                    'Column header for the resource/target name column in the revenue share landing table.',
                    translationKey('Label.Resource', TranslationNamespace.RevenueShareAgreements),
                  )}
                </TableHeaderCell>
                {isManagerMode && (
                  <TableHeaderCell
                    align='center'
                    className={`text-label-small content-muted padding-x-large padding-y-medium ${ALIGNED_COLUMN_MIN_CLASS}`}>
                    {tPendingTranslation(
                      'Parties',
                      'Column header for the party count column in the revenue share landing table (manager mode).',
                      translationKey('Label.Parties', TranslationNamespace.RevenueShareAgreements),
                    )}
                  </TableHeaderCell>
                )}
                <TableHeaderCell
                  align='center'
                  className={`text-label-small content-muted padding-x-large padding-y-medium ${ALIGNED_COLUMN_MIN_CLASS}`}>
                  {tPendingTranslation(
                    'Your cut',
                    'Column header for the revenue share percentage column in the revenue share landing table.',
                    translationKey('Label.YourCut', TranslationNamespace.RevenueShareAgreements),
                  )}
                </TableHeaderCell>
                <TableHeaderCell
                  align='center'
                  className={`text-label-small content-muted padding-x-large padding-y-medium ${STATUS_COLUMN_MIN_CLASS}`}>
                  {tPendingTranslation(
                    'Status',
                    'Column header for the agreement status column in the revenue share landing table.',
                    translationKey('Label.Status', TranslationNamespace.RevenueShareAgreements),
                  )}
                </TableHeaderCell>
                <TableHeaderCell
                  className={`padding-x-large padding-y-medium ${CHEVRON_COLUMN_CLASS}`}>
                  {null}
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
          )}

          <TableBody>
            {pageRows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  align='center'
                  className='padding-x-large padding-y-xlarge'>
                  <span className='text-body-medium content-muted'>{emptyMessage}</span>
                </TableCell>
              </TableRow>
            )}
            {bodyRows}
          </TableBody>
        </Table>
      </div>
      {isInventoryLoading ? (
        <div className='flex items-center justify-center gap-small width-full' aria-live='polite'>
          <ProgressCircle size='Small' variant='Indeterminate' ariaLabel={inventoryLoadingLabel} />
          <span className='text-body-small content-muted'>{inventoryLoadingLabel}</span>
        </div>
      ) : null}
      {pagination && pagination.totalRows > 0 ? (
        <TablePagination
          size='Medium'
          page={pagination.page}
          rowsPerPage={pagination.rowsPerPage}
          totalRows={pagination.totalRows}
          rowsPerPageOptions={REV_SHARE_ROWS_PER_PAGE_OPTIONS_LIST}
          onPageChange={pagination.onPageChange}
          onRowsPerPageChange={pagination.onRowsPerPageChange}
          rowsPerPageLabel={rowsPerPageLabel}
          rangeLabel={rangeLabel}
        />
      ) : null}
    </div>
  );
};

export default withTranslation(RevShareLandingTable, [
  TranslationNamespace.Table,
  TranslationNamespace.RevenueShareAgreements,
]);
