import { makeStyles } from '@rbx/ui';

const useModeratedThumbnailStyles = makeStyles()(() => ({
  moderatedThumbnail: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 4,
    height: '100%',
    width: '100%',
  },

  container: {
    paddingTop: '100%',
    height: 'auto',
    width: '100%',
    overflow: 'hidden',
  },
}));

export default useModeratedThumbnailStyles;
