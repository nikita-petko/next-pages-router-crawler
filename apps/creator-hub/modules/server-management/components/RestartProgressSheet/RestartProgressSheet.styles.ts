import { makeStyles } from '@rbx/ui';

const useRestartProgressSheetStyles = makeStyles()((theme) => ({
  sheetContent: {
    maxWidth: '440px !important',
  },
  sheetBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
  },
}));

export default useRestartProgressSheetStyles;
