import { makeStyles } from '@rbx/ui';

const useSummaryCardStyles = makeStyles()((theme) => ({
  cardContainer: {
    flex: '1 0 0',
  },

  cardContainerWithMultiple: {
    flex: '1 0 160px',
  },

  /* eslint-disable perfectionist/sort-objects */
  cardContentContainer: {
    display: 'flex',
    padding: '12px',
    [theme.breakpoints.up('Small')]: {
      padding: '16px',
    },
    [theme.breakpoints.up('Medium')]: {
      padding: '20px',
    },
    [theme.breakpoints.up('Large')]: {
      padding: '24px',
    },
  },

  /* eslint-disable perfectionist/sort-objects */
  cardRow: {
    display: 'grid',
    gap: '12px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
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

  formHelperText: {
    paddingTop: '12px',
  },

  metricCard: {
    backgroundColor: theme.palette.surface[200],
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
    flexWrap: 'nowrap',
  },

  noWrapText: {
    whiteSpace: 'nowrap',
  },

  statContainer: {
    alignItems: 'baseline',
    columnGap: '8px',
    flexWrap: 'nowrap',
  },

  skeletonValueContainer: {
    flex: 1,
  },
}));

export default useSummaryCardStyles;
