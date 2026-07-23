import { makeStyles } from '@rbx/ui';
import type { TTileStyleConfig } from '../../constants/tileConstants';

type useStyleProps = { styleConfig: TTileStyleConfig; isDragging: boolean };

const useAnalyticsExperienceTileStyles = makeStyles<useStyleProps>()((theme, props) => ({
  thumbnail: {
    position: 'relative',
    cursor: 'pointer',
  },

  thumbnailImage: {
    display: 'block',
    paddingTop: `${props.styleConfig.thumbnailHeight}px`,
  },

  thumbnailImageCover: {
    objectFit: 'cover',
    borderTopRightRadius: '4px',
    borderTopLeftRadius: '4px',
  },

  // NOTE(shumingxu, 03/07/2024): We disable the href in css instead of DOM to prevent rerenders
  disableLinkWhenDragging: {
    pointerEvents: props.isDragging ? 'none' : 'auto',
  },
}));

export default useAnalyticsExperienceTileStyles;
