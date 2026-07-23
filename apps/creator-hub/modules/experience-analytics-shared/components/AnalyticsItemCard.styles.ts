import { makeStyles } from '@rbx/ui';
import type { TCardStyleConfig } from '../constants/cardConstants';

const useAnalyticsItemCardStyles = makeStyles<TCardStyleConfig>()((theme, props) => ({
  card: {
    maxWidth: `${props.maxWidth}px`,
    minWidth: `${props.minWidth}px`,
    background: theme.palette.surface[200],
  },

  cardActionArea: {
    padding: `${props.padding}px`,
  },

  cardContent: {
    padding: '0',
  },

  cardContentFullHeightContainer: {
    height: '100%',
  },

  link: {
    color: 'inherit',
    '&:hover': {
      textDecoration: 'none',
    },
  },

  itemAvatarContainer: {
    width: '100px',
    height: '100px',
    backgroundColor: 'transparent',
  },

  valueContainer: {
    paddingTop: '10px',
  },

  cardTitle: {
    display: 'block',
  },
}));

export default useAnalyticsItemCardStyles;
