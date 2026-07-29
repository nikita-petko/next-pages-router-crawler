import { makeStyles } from '@rbx/ui';

const useSummaryCardStyles = makeStyles()((theme) => ({
  cardContainer: {
    flex: '1 0 0',
  },

  cardContainerWithMultiple: {
    flex: '1 0 160px',
  },

  /* eslint-disable perfectionist/sort-objects */
  cardRow: {
    display: 'grid',
    gap: '12px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    maxWidth: '1680px',
    width: '100%',
    [theme.breakpoints.up('Small')]: {
      gap: '16px',
    },
    [theme.breakpoints.up('Medium')]: {
      gap: '20px',
    },
    [theme.breakpoints.up('Large')]: {
      gap: '24px',
    },
  },

  metricDivider: {
    borderColor: theme.palette.content.muted,
  },

  // Foundation's vertical Divider sets an inline `height: 100%`, so the fixed
  // height that controls the divider length must live on the wrapping element.
  metricDividerContainer: {
    height: '24px',
  },

  multipleStatsContainer: {
    alignItems: 'center',
    columnGap: '24px',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },

  noWrapText: {
    whiteSpace: 'nowrap',
  },

  statContainer: {
    alignItems: 'baseline',
    columnGap: '8px',
    display: 'flex',
    flexWrap: 'nowrap',
  },

  skeletonValueContainer: {
    flex: 1,
  },
}));

export default useSummaryCardStyles;
