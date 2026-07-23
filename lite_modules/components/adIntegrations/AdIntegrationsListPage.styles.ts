import { makeStyles } from '@rbx/ui';

const useAdIntegrationsListPageStyles = makeStyles()((theme) => ({
  // Nudge up from flex-end so the checkbox centers with the dropdown input.
  archivedCampaignsFilter: {
    marginBottom: theme.spacing(1),
  },
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
