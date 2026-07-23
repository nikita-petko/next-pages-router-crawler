import { makeStyles } from '@rbx/ui';

const usePrimitiveGridContainerStyles = makeStyles()({
  gridContainer: {
    '& > *': {
      marginTop: 24,
      marginBottom: 24,
    },
  },

  goToParentAssetTypeCallToActionContainer: {
    width: '100%',
    marginTop: 0,
  },

  goToParentAssetTypeCallToActionText: {
    marginBottom: 16,
  },
});

export default usePrimitiveGridContainerStyles;
