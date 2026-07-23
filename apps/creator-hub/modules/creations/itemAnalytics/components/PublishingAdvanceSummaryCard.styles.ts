import { makeStyles } from '@rbx/ui';

const usePublishingAdvanceSummaryCardStyles = makeStyles()((theme) => ({
  card: {
    maxWidth: '400px',
    minWidth: '300px',
    background: theme.palette.surface[200],
  },

  cardActionArea: {
    padding: '16px',
  },

  cardContent: {
    padding: '0',
  },

  cardContentFullHeightContainer: {
    height: '100%',
  },

  percentRecovered: {
    marginTop: 8,
    marginBottom: 8,
  },

  progressBar: {
    height: 8,
    borderRadius: 4,
    '& .MuiLinearProgress-bar': {
      borderRadius: 4,
    },
  },
}));

export default usePublishingAdvanceSummaryCardStyles;
