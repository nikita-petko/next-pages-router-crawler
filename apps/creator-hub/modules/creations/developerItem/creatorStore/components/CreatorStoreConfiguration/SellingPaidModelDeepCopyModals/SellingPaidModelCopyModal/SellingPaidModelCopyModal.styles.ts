import { makeStyles } from '@rbx/ui';

const useSellingPaidModelCopyModalStyles = makeStyles()((theme) => ({
  dialogPaper: {
    backgroundColor: theme.palette.surface[100],
  },
  title: {
    padding: '24px',
  },
  content: {
    padding: '24px',
  },
  fieldLabel: {
    marginBottom: '8px',
  },
  field: {
    marginBottom: '24px',
  },
  intro: {
    marginBottom: '16px',
  },
  disclaimer: {
    marginTop: '16px',
  },
  inlineLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    textDecoration: 'none',
  },
  divider: {
    marginTop: '24px',
  },
  actions: {
    padding: '16px 24px',
  },
}));

export default useSellingPaidModelCopyModalStyles;
