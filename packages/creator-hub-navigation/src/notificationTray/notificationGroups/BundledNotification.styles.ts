import { makeStyles } from '@rbx/ui';

const useNotificationBundleStyles = makeStyles()((theme) => ({
  container: {
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    transition: 'all',
  },

  subNotif: {
    transition: 'all',
    transitionDuration: '500ms',
    marginBottom: 6,
  },

  notExpanded: {
    pointerEvents: 'none',
    opacity: '0',
  },

  rootNotif: {
    zIndex: 1,
  },

  bundleLabel: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 2,
    paddingBottom: 2,
    height: 22,
    transition: 'all',
    transitionDuration: '500ms',
  },

  hidden: {
    height: 0,
    opacity: 0,
    pointerEvents: 'none',
    padding: 0,
  },

  bundleDecorationContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transition: 'all',
    transitionDuration: '500ms',
  },

  decorationTop: {
    height: 8,
    width: '96%',
    borderRadius: '0px 0px 4px 4px',
    backgroundColor: theme.palette.surface[400],
    marginTop: 1,
  },

  decorationBottom: {
    height: 8,
    width: '92%',
    borderRadius: '0px 0px 4px 4px',
    backgroundColor: theme.palette.surface[400],
    marginTop: 1,
  },

  paddingBottom: {
    paddingBottom: 6,
  },
}));

export default useNotificationBundleStyles;
