import { makeStyles } from '@rbx/ui';

const useNotificationsSettingsCategoryLinkStyles = makeStyles()(() => ({
  subtext: {
    marginTop: 6,
  },

  container: {
    paddingTop: 28,
    paddingBottom: 28,
    paddingLeft: 0,
    paddingRight: 0,
    cursor: 'pointer',
    width: '100%',
  },

  leftContent: {
    flex: '1',
    flexDirection: 'column',
    display: 'flex',
    justifyContent: 'center',
    minWidth: 0,
  },

  rightContent: {
    padding: 12,
    alignItems: 'center',
    display: 'flex',
    marginLeft: 24,
  },
}));

export default useNotificationsSettingsCategoryLinkStyles;
