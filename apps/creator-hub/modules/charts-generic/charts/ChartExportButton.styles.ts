import { makeStyles } from '@rbx/ui';

const useChartExportButtonStyles = makeStyles()(() => ({
  button: {
    '&:hover': {
      backgroundColor: 'inherit',
    },
    padding: 0,
    minWidth: 0,
  },
}));

export default useChartExportButtonStyles;
