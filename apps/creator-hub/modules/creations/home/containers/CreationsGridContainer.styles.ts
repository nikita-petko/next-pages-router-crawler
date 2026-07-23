import { makeStyles } from '@rbx/ui';

const useCreationsGridContainerStyles = makeStyles()({
  gridContainer: {
    '& > *': {
      marginTop: 24,
      marginBottom: 24,
    },
  },

  createButtonContainer: {
    width: '100%',
    marginTop: 0,
  },

  folderActionContainer: {
    width: '100%',
    marginTop: 0,
  },
});

export default useCreationsGridContainerStyles;
