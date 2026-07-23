import { makeStyles } from '@rbx/ui';

const useUpdatesPageStyles = makeStyles()((theme) => ({
  pageRoot: {
    boxSizing: 'border-box',
    width: '100%',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    minHeight: '100vh',
    backgroundColor: theme.palette.surface[0],
  },
  tabHeaderStack: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 16,
    alignSelf: 'stretch',
    width: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    height: 72,
    padding: `0 ${theme.spacing(3)}`,
    backgroundColor: theme.palette.surface[0],
  },
  headerTitle: {
    color: theme.palette.content.standard,
    fontSize: 28,
    fontWeight: 700,
    lineHeight: '120%',
    letterSpacing: '-0.28px',
  },
  tabNavigation: {
    display: 'flex',
    alignItems: 'flex-end',
    alignSelf: 'stretch',
    borderBottom: `1px solid ${theme.palette.surface.outline}`,
    padding: 0,
    justifyContent: 'flex-start',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    background: theme.palette.surface[0],
    boxShadow: `0 8px 0 0 ${theme.palette.surface[0]}`,
  },
  tabButtons: {
    display: 'flex',
    alignItems: 'flex-end',
  },
  tabActionsWrapper: {
    display: 'flex',
    paddingLeft: 12,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
    marginLeft: 'auto',
    alignSelf: 'flex-start',
  },
  tabActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  tabActionButton: {
    padding: 12,
  },
  tabButton: {
    display: 'flex',
    padding: '4px 12px 12px 12px',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    background: 'transparent',
    border: 'none',
    borderBottom: '1.5px solid transparent',
    cursor: 'pointer',
    color: theme.palette.content.muted,
    '&:hover': {
      color: theme.palette.content.standard,
    },
  },
  tabButtonActive: {
    borderBottom: `1.5px solid ${theme.palette.content.standard}`,
    color: theme.palette.content.standard,
  },
  tabContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    alignSelf: 'stretch',
  },
}));

export default useUpdatesPageStyles;
