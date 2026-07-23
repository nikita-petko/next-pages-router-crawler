import { makeStyles } from '@rbx/ui';
import type { TTileStyleConfig } from '../../constants/tileConstants';

const cardBorderRadius = '0 0 4px 4px';

const useAnalyticsTileStyles = makeStyles<TTileStyleConfig>()((theme, props) => ({
  analyticsTileCard: {
    maxWidth: `${props.maxWidth}px`,
    minWidth: `${props.minWidth}px`,
    height: `${props.height}px`,
    background: theme.palette.surface[200],
    '&:hover, &:focus': {
      background: theme.palette.surface[400],
    },
    overflow: 'unset',
    // NOTE(shumingxu, 03/25/2024): Do not use MUI's default mask to show our floating action buttons.
    // But we also need to manually set border radius to fit hover overlay to action area borders.
    maskImage: 'none',
    borderRadius: cardBorderRadius,
  },

  titleDisplay: {
    display: 'block',
  },

  actionBorderRadius: {
    borderRadius: cardBorderRadius,
    height: `${props.height - props.thumbnailHeight}px`,
  },

  cardContent: {
    padding: `${props.padding}px`,
  },
}));

export default useAnalyticsTileStyles;
