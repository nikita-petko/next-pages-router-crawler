import { makeStyles } from '@rbx/ui';

const useTableCreativeCellStyles = makeStyles()((theme) => ({
  creative: {
    backgroundColor: theme.palette.surface[400],
    height: 54,
    minHeight: 54,
    minWidth: 96,
    width: 96,
  },
}));

export default useTableCreativeCellStyles;
