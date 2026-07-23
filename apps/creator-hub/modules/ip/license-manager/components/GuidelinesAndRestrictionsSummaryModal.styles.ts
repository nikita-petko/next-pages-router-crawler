import { makeStyles } from '@rbx/ui';

const useGuidelinesAndRestrictionsModalStyles = makeStyles()((theme) => ({
  contentStandardsButton: {
    alignSelf: 'flex-start',
  },
  dialogTitle: {
    position: 'sticky',
    top: 0,
    backgroundColor: theme.palette.surface[300],
    zIndex: 2,
  },
  dialogActions: {
    position: 'sticky',
    bottom: 0,
    backgroundColor: theme.palette.surface[300],
    zIndex: 1,
  },
  dialogContent: {
    maxHeight: '50vh', // Fixes scrollbar height to only content
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: theme.spacing(1),
  },
  dialogContentExtraPadding: {
    maxHeight: '50vh', // Fixes scrollbar height to only content
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: theme.spacing(4),
  },
  statementContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: theme.spacing(1, 0),
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
  },
  selectDropdown: {
    width: '100%',
    maxWidth: '300px',
    marginTop: theme.spacing(1),
  },
  error: {
    marginTop: theme.spacing(-3),
    paddingBottom: theme.spacing(1),
  },
  text: {
    padding: theme.spacing(1, 1),
  },
}));

export default useGuidelinesAndRestrictionsModalStyles;
