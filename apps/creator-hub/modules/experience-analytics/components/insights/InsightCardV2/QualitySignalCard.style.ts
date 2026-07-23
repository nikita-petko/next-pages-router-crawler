import { makeStyles } from '@rbx/ui';

const useQualitySignalCardStyles = makeStyles()((theme) => ({
  cardsWrapper: {
    width: '100%',
  },
  card: {
    width: '100%',
    backgroundColor: theme.palette.surface[100],
  },
  cardActionArea: {
    height: '100%',
  },
  icon: {
    margin: 12,
    padding: 8,
    backgroundColor: theme.palette.surface[400],
    width: 48,
    height: 48,
    borderRadius: 10,
  },
}));

export default useQualitySignalCardStyles;
