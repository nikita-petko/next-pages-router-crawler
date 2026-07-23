import { makeStyles } from '@rbx/ui';

const useTrayHeaderStyles = makeStyles()({
  header: {
    paddingLeft: 12,
    paddingRight: 6,
    paddingTop: 12,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  markAllAsReadButton: {
    padding: 8
  },

  iconButton: {
    padding: 4
  },
  headerM2: {
    flex: 1
  },
  markAllAsReadButtonM2: {
    marginTop: 5
  },
  settingsButtonM2: {
    marginTop: 5,
    marginRight: -2
  }
});

export default useTrayHeaderStyles;
