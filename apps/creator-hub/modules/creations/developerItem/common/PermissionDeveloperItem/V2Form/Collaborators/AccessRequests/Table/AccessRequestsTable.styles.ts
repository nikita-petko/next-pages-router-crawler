import { makeStyles } from '@rbx/ui';

// ─── Column widths ────────────────────────────────────────────────────────────
// Adjust the percentages here to tune column proportions.
// The three values must sum to 100%.
// table-layout: fixed (set on the Table element) enforces these widths strictly —
// content that overflows is truncated with ellipsis rather than expanding the column.
//   requesterCell  – username / display name (can be long, truncates with ellipsis)
//   dateCell       – date requested         (fixed-format, short)
//   actionsCell    – Accept / Decline       (two buttons, never truncated)
const COLUMN_WIDTHS = {
  requesterCell: { width: '50%' },
  dateCell: { width: '20%' },
  actionsCell: { width: '30%' },
} as const;
// ─────────────────────────────────────────────────────────────────────────────

const useAccessRequestsTableStyles = makeStyles()((theme) => ({
  tableContainer: {
    borderColor: theme.palette.components.divider,
    borderRadius: 10,
    borderStyle: 'solid',
    borderWidth: 1,
    padding: 0,
    width: '100%',
  },
  paginationCell: {
    borderBottom: 0,
  },

  // Column widths
  requesterCell: {
    ...COLUMN_WIDTHS.requesterCell,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  dateCell: {
    ...COLUMN_WIDTHS.dateCell,
  },
  actionsCell: {
    ...COLUMN_WIDTHS.actionsCell,
  },
}));

export default useAccessRequestsTableStyles;
