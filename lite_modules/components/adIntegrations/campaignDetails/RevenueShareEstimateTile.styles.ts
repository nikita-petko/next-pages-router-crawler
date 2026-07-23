import { makeStyles } from '@rbx/ui';

const useRevenueShareEstimateTileStyles = makeStyles()((theme) => ({
  card: {
    // Foundation ColorShift100, no outline (per design review).
    backgroundColor: 'var(--color-shift-100)',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
    padding: theme.spacing(2),
  },
  cardDescription: {
    color: theme.palette.content.muted,
    // Foundation Body Small (12px) per design review.
    font: 'var(--typography-body-small-font)',
  },
  cardLabel: {
    fontWeight: 500,
  },
  cardLabelRow: {
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing(0.5),
  },
  cardValue: {
    fontWeight: 600,
  },
  container: {
    // Foundation BGSurface100, no outline (per design review).
    backgroundColor: 'var(--color-surface-100)',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    // 12px spacing between cards in the revenue share section.
    gap: '12px',
    padding: theme.spacing(2.5),
  },
  description: {
    color: theme.palette.content.muted,
  },
  errorText: {
    color: theme.palette.content.muted,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
  heading: {
    fontWeight: 600,
  },
  metric: {
    // Foundation ColorShift100, no outline (per design review).
    backgroundColor: 'var(--color-shift-100)',
    borderRadius: '8px',
    display: 'flex',
    flex: '1 1 140px',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
    padding: theme.spacing(2),
  },
  metricsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    // 12px spacing between cards in the revenue share section.
    gap: '12px',
  },
}));

export default useRevenueShareEstimateTileStyles;
