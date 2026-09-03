import { makeStyles } from '@rbx/ui';

const useSellingPaidModelCopyingModalStyles = makeStyles()((theme) => ({
  dialogPaper: {
    backgroundColor: theme.palette.surface[100],
  },
  content: {
    padding: '24px',
    paddingTop: '16px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  paragraph: { marginBottom: '16px' },
  footer: { paddingTop: '8px', display: 'flex', justifyContent: 'flex-start' },
  inlineLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    textDecoration: 'none',
  },
}));

export default useSellingPaidModelCopyingModalStyles;
