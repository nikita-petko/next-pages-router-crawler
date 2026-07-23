import { makeStyles } from '@rbx/ui';

const useSellingPaidModelCopyResultModalStyles = makeStyles()((theme) => ({
  dialogPaper: {
    backgroundColor: theme.palette.surface[100],
  },
  content: {
    padding: '16px, 24px',
  },
  actions: {
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'flex-end',
    columnGap: '12px',
  },
  titleRow: { display: 'flex', alignItems: 'center', gap: '8px' },
}));

export default useSellingPaidModelCopyResultModalStyles;
