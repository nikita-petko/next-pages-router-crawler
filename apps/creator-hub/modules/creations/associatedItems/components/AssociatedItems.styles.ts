import { makeStyles } from '@rbx/ui';

const fullWidthHeight = {
  width: '100%',
  height: '100%',
};

const useAssociatedItemsStyles = makeStyles()({
  section: {
    ...fullWidthHeight,
  },
  container: {
    ...fullWidthHeight,
  },
  title: {
    flexGrow: 1,
    display: 'flex',
  },
});

export default useAssociatedItemsStyles;
