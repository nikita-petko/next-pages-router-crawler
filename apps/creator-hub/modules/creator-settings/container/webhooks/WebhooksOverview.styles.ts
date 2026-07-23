import { makeStyles } from '@rbx/ui';

const useWebhooksOverviewStyles = makeStyles()((theme) => ({
  grid: {
    maxWidth: 1200,
    gap: 48,
    width: 'fit-content',
    [theme.breakpoints.down('XLarge')]: {
      maxWidth: 900,
    },
  },

  descriptionGrid: {
    rowGap: 16,
  },

  buttonGrid: {
    rowGap: 4,
  },
}));

export default useWebhooksOverviewStyles;
