import { makeStyles } from '@rbx/ui';

const useReachCreativePreviewStyles = makeStyles()(() => ({
  previewButtonContainer: {
    alignItems: 'center',
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
  },
  previewTileContainer: {
    height: 190,
    padding: 0,
    width: 510,
  },
  reachCreativeFieldContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
}));

export default useReachCreativePreviewStyles;
