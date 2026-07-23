import { makeStyles } from '@rbx/ui';

const useVideoUploadCardStyles = makeStyles()((theme) => ({
  actionButton: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    minWidth: 40,
    padding: '8px',
  },
  // Grid container styles
  cardContainer: {
    minHeight: '76px',
  },
  contentContainer: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    display: 'block',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
  },
  placeholder: {
    alignItems: 'center',
    backgroundColor: theme.palette.components.alert.informContent,
    border: `1px solid ${theme.palette.surface.outline}`,
    borderRadius: 4,
    display: 'flex',
    flexDirection: 'column',
    height: 60,
    justifyContent: 'center',
    width: 80,
  },
  statusIconContainer: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
  },

  statusIconGrid: {
    alignItems: 'center',
    display: 'flex',
    marginRight: '2px',
    minWidth: '20px',
    transform: 'translateY(0px)',
    width: '20px',
  },

  statusText: {
    display: 'block',
    minHeight: '1.2em',
  },

  statusTextContainer: {
    flex: 1,
    minWidth: 0,
  },

  thumbnailContainer: {
    '&:hover': {
      '& video': {
        opacity: 0.8,
      },
    },
    '&:hover .play-button': {
      opacity: 1,
    },
    display: 'flex',
    height: 60,
    overflow: 'hidden',
    position: 'relative',
    width: 80,
  },

  thumbnailContainerClickable: {
    '&:hover': {
      '& video': {
        opacity: 0.8,
      },
    },
    '&:hover .play-button': {
      opacity: 1,
    },
    cursor: 'pointer',
    display: 'flex',
    height: 60,
    overflow: 'hidden',
    position: 'relative',
    width: 80,
  },

  videoThumbnail: {
    borderRadius: 4,
    height: '100%',
    margin: '0 auto',
    objectFit: 'cover',
  },
}));

export default useVideoUploadCardStyles;
