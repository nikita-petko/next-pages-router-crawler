import { makeStyles } from '@rbx/ui';

const useOptimizationMenuStyles = makeStyles()(() => ({
  dialogButtonGroup: {
    '& button': {
      marginLeft: '8px',
    },
  },
  menuContainer: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  dialogContentText: {
    whiteSpace: 'pre-wrap',
  },
}));

export default useOptimizationMenuStyles;
