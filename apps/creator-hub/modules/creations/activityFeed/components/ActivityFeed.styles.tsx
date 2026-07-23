import { makeStyles } from '@rbx/ui';

const fullWidthHeight = {
  width: '100%',
  height: '100%',
};

const useActivityFeedStyles = makeStyles()({
  section: {
    ...fullWidthHeight,
  },
  container: {
    ...fullWidthHeight,
  },
  title: {
    marginBottom: 48,
    flexGrow: 1,
    display: 'flex',
  },
  smallScreenMargin: {
    marginLeft: 16,
  },
});

export default useActivityFeedStyles;
