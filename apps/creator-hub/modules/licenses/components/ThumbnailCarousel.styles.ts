import { makeStyles } from '@rbx/ui';

const useThumbnailCarouselStyles = makeStyles()((theme) => ({
  thumbnailContainer: {
    position: 'relative',
    paddingTop: 0,
    width: '100%',
    height: '440px',
    display: 'block',
    overflow: 'hidden',
    ...theme.border.radius.small,

    // The gradient at the bottom of the thumbnail
    '&:before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: `linear-gradient(to top , ${theme.palette.surface[0]} , transparent 65%)`,
      zIndex: 2,
    },
  },

  slidesContainer: {
    transition: 'transform 0.3s ease-in-out',
  },

  slide: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },

  primaryThumbnail: {
    // 1320px is the width of the thumbnail we are displaying
    width: 'max(1320px, 100%)',
    height: 'auto',
    // Center the image horizontally
    marginLeft: '50%',
    transform: 'translateX(-50%)',
  },

  navigationButton: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 3,
    backgroundColor: theme.palette.surface[0],
    opacity: 0,
    transition: 'opacity 0.2s ease-in-out, background-color 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: theme.palette.surface[0],
    },
  },

  visibleButton: {
    opacity: 0.5,
  },

  leftButton: {
    left: 16,
  },

  rightButton: {
    right: 16,
  },

  dotBar: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    zIndex: 3,
    paddingBottom: 80,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 6,
    background:
      theme.palette.mode === 'light' ? theme.palette.common.black : theme.palette.common.white,
    margin: '0 4px',
    opacity: 0.5,
    transition: 'all 0.2s',
  },

  activeDot: {
    width: 32,
    height: 8,
    borderRadius: 6,
    background:
      theme.palette.mode === 'light' ? theme.palette.common.black : theme.palette.common.white,
    opacity: 0.5,
    margin: '0 4px',
    transition: 'all 0.2s',
  },
}));

export default useThumbnailCarouselStyles;
