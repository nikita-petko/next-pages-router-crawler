import { makeStyles } from '@rbx/ui';

const useReorderBadgesContainerStyles = makeStyles()((theme) => ({
  list: {
    paddingTop: '12px',
  },
  infoMessage: {
    paddingTop: '16px',
  },
  divider: {
    marginTop: 48,
    marginBottom: 32,
  },
  button: {
    marginRight: 12,
    [theme.breakpoints.down('Large')]: {
      marginRight: 0,
      marginBottom: 12,
    },
  },
  error: {
    paddingTop: '12px',
  },
  section: {
    [theme.breakpoints.down('Large')]: {
      paddingLeft: 12,
      paddingRight: 12,
    },
  },
  // Row sitting directly above the badges list: the reorder-status block on the left and
  // the "Hide disabled badges" toggle on the right. Wraps on narrow screens so the toggle
  // drops below the status block instead of crowding it.
  statusRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: '16px',
    paddingBottom: '4px',
  },
  // Left-aligned status block: the per-save maximum helper text sitting to the left of the
  // grey "X/Y badges moved" pill.
  reorderStatus: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  // Roomier interior padding than the Label default (6px horizontal, no vertical) so the
  // "X/Y badges moved" text isn't crowded against the pill edges. Fully rounded ends via the
  // Foundation radius/circle token (--radius-circle).
  pill: {
    padding: '4px 12px',
    borderRadius: 'var(--radius-circle)',
  },
  // Keep the toggle from shrinking its label when the row gets tight before wrapping.
  hideDisabledToggle: {
    flexShrink: 0,
    marginRight: 0,
  },
}));

export default useReorderBadgesContainerStyles;
