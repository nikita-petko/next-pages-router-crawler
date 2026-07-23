import { type FC, useCallback } from 'react';
import { Dropdown, IconButton, Menu, MenuItem } from '@rbx/foundation-ui';
import { MANAGE_PAGE_SIZE_OPTIONS } from '../hooks/useManagePageState';
import { useManagePageTranslations } from '../useManagePageTranslations';
import { formatRangeReadout } from '../utils/customDashboardFormatting';

/**
 * Pagination strip below the dashboards table. Disabled during Loading; the
 * vertical slot is reserved so Loading → List has no layout shift.
 */
type DashboardsTablePaginationProps = {
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly rangeStart: number;
  readonly rangeEnd: number;
  readonly totalCount?: number;
  readonly disabled?: boolean;
  readonly onPageChange: (next: number) => void;
  readonly onPageSizeChange: (next: number) => void;
};

const DashboardsTablePagination: FC<DashboardsTablePaginationProps> = ({
  page,
  pageSize,
  totalPages,
  rangeStart,
  rangeEnd,
  totalCount,
  disabled = false,
  onPageChange,
  onPageSizeChange,
}) => {
  const t = useManagePageTranslations();

  const isAtFirst = page <= 1;
  const isAtLast = page >= totalPages;

  const goToFirst = useCallback(() => onPageChange(1), [onPageChange]);
  const goToPrev = useCallback(() => onPageChange(Math.max(1, page - 1)), [onPageChange, page]);
  const goToNext = useCallback(
    () => onPageChange(Math.min(totalPages, page + 1)),
    [onPageChange, page, totalPages],
  );
  const goToLast = useCallback(() => onPageChange(totalPages), [onPageChange, totalPages]);

  const handlePageSizeChange = useCallback(
    (next: string) => {
      onPageSizeChange(Number.parseInt(next, 10));
    },
    [onPageSizeChange],
  );

  let rangeReadout = t.paginationRangeReadoutLoading;
  if (!disabled) {
    const formattedRange = formatRangeReadout(rangeStart, rangeEnd, totalCount ?? rangeEnd);
    rangeReadout =
      totalCount === undefined
        ? t.paginationRangeReadoutWithoutTotal({ range: formattedRange.range })
        : t.paginationRangeReadout(formattedRange);
  }

  return (
    <nav
      aria-label={t.paginationRegionLabel}
      className='flex flex-col small:flex-row small:items-center small:justify-end gap-small small:gap-medium padding-y-small'>
      <div className='inline-flex items-center gap-xsmall text-caption-medium content-muted'>
        <span>{t.paginationRowsPerPage}</span>
        <Dropdown
          size='Small'
          variant='Standard'
          placeholder={t.paginationRowsPerPage}
          value={String(pageSize)}
          isDisabled={disabled}
          onValueChange={handlePageSizeChange}>
          <Menu>
            {MANAGE_PAGE_SIZE_OPTIONS.map((value) => (
              <MenuItem key={value} value={String(value)} title={String(value)} />
            ))}
          </Menu>
        </Dropdown>
      </div>

      <span
        className='text-caption-medium content-muted [font-variant-numeric:tabular-nums]'
        aria-live='polite'>
        {rangeReadout}
      </span>

      <div className='flex items-center gap-xxsmall'>
        <IconButton
          variant='Standard'
          size='Small'
          ariaLabel={t.paginationFirstPageLabel}
          isDisabled={disabled || isAtFirst}
          onClick={goToFirst}
          icon='icon-regular-chevron-large-left'
        />
        <IconButton
          variant='Standard'
          size='Small'
          ariaLabel={t.paginationPrevPageLabel}
          isDisabled={disabled || isAtFirst}
          onClick={goToPrev}
          icon='icon-regular-chevron-small-left'
        />
        <IconButton
          variant='Standard'
          size='Small'
          ariaLabel={t.paginationNextPageLabel}
          isDisabled={disabled || isAtLast}
          onClick={goToNext}
          icon='icon-regular-chevron-small-right'
        />
        <IconButton
          variant='Standard'
          size='Small'
          ariaLabel={t.paginationLastPageLabel}
          isDisabled={disabled || isAtLast}
          onClick={goToLast}
          icon='icon-regular-chevron-large-right'
        />
      </div>
    </nav>
  );
};

export default DashboardsTablePagination;
