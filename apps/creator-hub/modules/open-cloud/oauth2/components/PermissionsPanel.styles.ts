import { makeStyles } from '@rbx/ui';

const usePermissionsPanelStyles = makeStyles()((theme) => ({
  body: {
    paddingTop: 4,
    paddingBottom: 12,
  },
  retryButton: {
    marginTop: '16px',
  },
  alertMargin: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
}));

export default usePermissionsPanelStyles;
