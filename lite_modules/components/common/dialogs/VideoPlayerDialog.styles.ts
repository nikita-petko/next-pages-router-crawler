import { makeStyles } from '@rbx/ui';

const useVideoPlayerDialogStyles = makeStyles()((theme) => ({
  footer: {
    alignItems: 'flex-end',
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '20px 24px',
  },
  header: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    padding: '20px 24px',
  },
  leftNav: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    padding: '20px',
    width: '80px',
  },
  modalContent: {
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
  },
  navButton: {
    '&:hover': {
      backgroundColor: theme.palette.surface.outline,
    },
    border: `1px solid ${theme.palette.surface.outline}`,
    borderRadius: '50%',
    color: theme.palette.text.primary,
    height: '48px',
    minWidth: '48px',
    pointerEvents: 'auto',
    width: '48px',
  },
  rightNav: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    padding: '20px',
    width: '80px',
  },
  video: {
    height: '45vh',
    maxWidth: '50vw',
    objectFit: 'contain',
    transition: 'opacity 0.2s ease-in-out',
    width: 'fit-content',
  },
  videoContainer: {
    alignItems: 'center',
    display: 'flex',
    flex: 1,
    justifyContent: 'center',
    minHeight: '50vh',
    overflow: 'hidden',
    padding: '0px',
  },
  videoLoading: {
    alignItems: 'center',
    backgroundColor: theme.palette.surface[200],
    borderRadius: '4px',
    display: 'flex',
    height: '50vh',
    justifyContent: 'center',
    left: '50%',
    position: 'absolute',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: '60vw',
    zIndex: 1,
  },
  videoWrapper: {
    position: 'relative',
  },
}));

export default useVideoPlayerDialogStyles;

export interface VideoAsset {
  assetId: string;
  videoSrc: string;
}
