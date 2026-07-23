import { makeStyles } from '@rbx/ui';
import announcementMetadataStyles from '@modules/updates/announcementMetadata.styles';
import { getCarouselTileBaseStyles } from './Updates.styles';

const useUpdatesTileStyles = makeStyles()((theme) => ({
  ...announcementMetadataStyles(theme),
  card: {
    display: 'flex',
    padding: '4px 8px',
    alignItems: 'flex-start',
    gap: 16,
    alignSelf: 'stretch',
    borderRadius: 8,
    background: 'transparent',
    border: 'none',
    boxShadow: 'none',
    '&:hover': {
      background: theme.palette.states.hover,
    },
  },
  cardNoHover: {
    '&:hover': {
      background: 'transparent',
    },
  },
  // Mobile carousel tile only - inherits from Updates.styles, adds hover
  carouselCard: {
    ...getCarouselTileBaseStyles(theme),
    '&:hover': {
      background: theme.palette.states.hover,
    },
  },
  actionArea: {
    width: '100%',
    borderRadius: 8,
    '& .MuiCardActionArea-focusHighlight': {
      backgroundColor: 'transparent',
      opacity: 0,
    },
  },
  tileContent: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
    width: '100%',
  },
  contentColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    flex: '1 0 0',
    minWidth: 0,
  },
  title: {
    alignSelf: 'stretch',
    color: theme.palette.content.standard,
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: 700,
    lineHeight: '140%',
  },
  carouselTitle: {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  metadataRow: {
    display: 'flex',
    padding: '2px 0',
    alignItems: 'center',
    alignContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
    flexWrap: 'nowrap',
    overflow: 'hidden',
  },
  metadataItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  icon: {
    width: 16,
    height: 16,
    aspectRatio: '1/1',
    color: theme.palette.content.muted,
  },
  tagsRowInline: {
    flex: '1 1 auto',
    minWidth: 0,
    '& > *': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  },
}));

export default useUpdatesTileStyles;
