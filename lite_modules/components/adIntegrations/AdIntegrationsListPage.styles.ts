import { makeStyles } from '@rbx/ui';

const useAdIntegrationsListPageStyles = makeStyles()((theme) => ({
  filterControl: {
    minWidth: '280px',
    width: '300px',
  },
  headerRow: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
    justifyContent: 'space-between',
    width: '100%',
  },
  pageContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    width: '100%',
  },
}));

export default useAdIntegrationsListPageStyles;
