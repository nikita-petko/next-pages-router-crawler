import { makeStyles } from '@rbx/ui';

const useSellingPaidModelDependenciesModalStyles = makeStyles()((theme) => ({
  dialogContent: {
    padding: '16px 24px 0px 24px',
  },
  dialogPaper: {
    backgroundColor: theme.palette.surface[100],
  },
  header: {
    marginBottom: '8px',
  },
  subheader: {
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  actions: {
    padding: '16px 24px',
  },
  actionsGrid: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    alignItems: 'center',
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
  },
  right: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  inlineLink: {
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
}));

export default useSellingPaidModelDependenciesModalStyles;
