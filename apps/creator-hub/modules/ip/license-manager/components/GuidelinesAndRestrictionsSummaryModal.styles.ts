import { makeStyles } from '@rbx/ui';

const useGuidelinesAndRestrictionsModalStyles = makeStyles()((theme) => ({
  dialogTitle: {
    position: 'sticky',
    top: 0,
    backgroundColor: theme.palette.surface[100],
    zIndex: 2,
  },
  dialogActions: {
    position: 'sticky',
    bottom: 0,
    backgroundColor: theme.palette.surface[100],
    zIndex: 1,
  },
  dialogContent: {
    maxHeight: '50vh', // Fixes scrollbar height to only content
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  dialogContentExtraPadding: {
    maxHeight: '50vh', // Fixes scrollbar height to only content
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingTop: '0 !important', // Override Foundation DialogBody padding-top-xlarge
  },
  statementContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingBottom: theme.spacing(2),
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
  },
  selectDropdown: {
    width: '100%',
    maxWidth: '300px',
    marginTop: theme.spacing(1.5),
  },
  error: {
    marginTop: theme.spacing(-3),
    paddingBottom: theme.spacing(1),
  },
}));

export default useGuidelinesAndRestrictionsModalStyles;
