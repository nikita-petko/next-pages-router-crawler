import { makeStyles } from '@rbx/ui';
import { TileSize } from '../../constants/feedConstants';
import type { TFeedItemType } from '../../types';

type TUseStylesProps = {
  feedType: TFeedItemType;
};

const useFeedTileStyles = makeStyles<TUseStylesProps>()((theme, props) => ({
  root: {
    position: 'relative',
    width: TileSize.width,
    height: 'auto',
    textDecoration: 'none',
  },
  thumbnailContainer: {
    ...theme.border.radius.xsmall,
    width: '100%',
    height: TileSize.height,
    marginBottom: 12,
    borderRadius: 12,
    border: `1px solid ${theme.palette.surface.outline}`,
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '& > button': {
      opacity: props.feedType === 'YouTubeVideo' ? 0 : 1,
      transition: 'opacity 100ms ease-in',
    },
    '&:hover > button': {
      opacity: 1,
    },
  },
  thumbnail: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: theme.palette.content.static.light,
    color: theme.palette.content.static.dark,
    borderRadius: 6,
    fontWeight: 600,
    backdropFilter: 'blur(5px)',
    WebkitBackdropFilter: 'blur(5px)',
  },
  durationLabel: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    color: theme.palette.content.static.light,
    backgroundColor: theme.palette.components.media.overlay,
    backdropFilter: 'blur(5px)',
    WebkitBackdropFilter: 'blur(5px)',
  },
  title: {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
    marginBottom: 6,
    lineClamp: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  description: {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    lineClamp: 2,
    WebkitLineClamp: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginTop: 4,
    marginBottom: 4,
  },
  avatar: {
    marginTop: 5,
  },
  avatarName: {
    marginTop: 2,
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 1,
  },
}));

export default useFeedTileStyles;
