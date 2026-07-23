import { useMemo } from 'react';
import { clsx, Icon, type TIconProps } from '@rbx/foundation-ui';
import { TableCell, TableSortLabel, type TTableCellProps } from '@rbx/ui';
import { Tooltip } from '../tooltip';
import type { SortOrder } from './types';

export type SortableTableHeaderCellProps<TColumn extends string> = {
  /** The label text displayed in the header */
  label: React.ReactNode;
  /** The sort column this cell represents */
  column: NoInfer<TColumn>;
  /** The currently active sort column */
  activeColumn?: NoInfer<TColumn>;
  /** The current sort order */
  sortOrder?: SortOrder;
  /** Callback when the column sort is toggled. TColumn is inferred from this prop. */
  onSort?: (column: TColumn) => void;
  /** The aria-label for the sort label button */
  sortAriaLabel?: string;
  /** Whether sorting is disabled for this header */
  disabled?: boolean;
  /** Optional tooltip title */
  tooltipTitle?: string;
  /** Optional tooltip description */
  tooltipDescription?: string;
  /** Optional tooltip icon override, defaults to 'icon-regular-circle-i' */
  tooltipIcon?: TIconProps['name'];
} & Omit<TTableCellProps, 'ref' | 'children'>; // Skip ref handling as utilities are handled OOTB

/**
 * Opinionated table header cell (<th>) with an integrated sort control (`TableSortLabel`).
 *
 * - **Sort state**: Active when `activeColumn` matches `column` and `sortOrder` is `'asc'` or `'desc'`.
 *   Omitted or `'default'` sort order keeps the control inactive even if `activeColumn` matches.
 * - **Layout**: The sort label always uses `text-label-medium`. If `tooltipTitle` or
 *   `tooltipDescription` is set, a Foundation `Tooltip` wrapping the default info icon is shown
 *   beside the label and the label row uses `flex items-center gap-xsmall`.
 * - **Tooltip**: Pass user-facing copy via `tooltipTitle` / `tooltipDescription`; optional
 *   `tooltipIcon` overrides the default `icon-regular-circle-i` trigger.
 *
 * @example
 * ```tsx
 * <SortableTableHeader
 *   column='name'
 *   label={translate('Label.Name')}
 *   activeColumn={sortColumn}
 *   sortOrder={sortOrder}
 *   onSort={onSort}
 *   sortAriaLabel={translate('Label.SortByProductName')}
 *   width='35%'
 *   sx={{ minWidth: '250px' }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * <SortableTableHeader
 *   column='regionalPricing'
 *   label={translate('Label.RegionalPricing')}
 *   tooltipDescription={translate('Tooltip.RegionalPricingForProducts')}
 *   activeColumn={sortColumn}
 *   sortOrder={sortOrder}
 *   onSort={onSort}
 * />
 * ```
 */
function SortableTableHeader<TColumn extends string>({
  column,
  label,
  activeColumn,
  sortOrder = 'default',
  onSort,
  sortAriaLabel,
  disabled,
  tooltipTitle,
  tooltipDescription,
  tooltipIcon = 'icon-regular-circle-i',
  align,
  ...props
}: SortableTableHeaderCellProps<TColumn>) {
  const isActive = column === activeColumn && sortOrder !== undefined && sortOrder !== 'default';
  const direction = isActive ? sortOrder : undefined;

  const tooltip = useMemo(
    () =>
      tooltipTitle || tooltipDescription ? (
        <Tooltip
          title={tooltipTitle ?? ''}
          description={tooltipDescription}
          // Override default text alignment to left, as TableCell align sets text-align
          // Also override text wrap as we set no-wrap on the label
          contentClassName='text-align-x-left text-wrap'>
          <Icon name={tooltipIcon} size='Small' />
        </Tooltip>
      ) : null,
    [tooltipTitle, tooltipDescription, tooltipIcon],
  );

  return (
    <TableCell sortDirection={direction} align={align} {...props}>
      <TableSortLabel
        active={isActive}
        direction={direction}
        onClick={() => onSort?.(column)}
        disabled={disabled}
        aria-label={sortAriaLabel}
        className={clsx(
          'text-label-medium text-no-wrap',
          tooltip && 'flex items-center gap-xsmall',
          align === 'right' && 'flex-row-reverse',
        )}>
        {align === 'right' && tooltip}
        {label}
        {align !== 'right' && tooltip}
      </TableSortLabel>
    </TableCell>
  );
}

export default SortableTableHeader;
