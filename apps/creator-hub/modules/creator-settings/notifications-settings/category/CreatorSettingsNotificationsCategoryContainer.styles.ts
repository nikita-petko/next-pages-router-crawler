import { makeStyles } from '@rbx/ui';

const useCreatorSettingsNotificationsCategoryContainerStyles = makeStyles()((theme) => ({
  grid: {
    maxWidth: 1200,
    rowGap: 48,
    [theme.breakpoints.down('Medium')]: {
      padding: 12,
    },
    [theme.breakpoints.down('XLarge')]: {
      maxWidth: 900,
    },
  },

  titleRowGap: { rowGap: 16 },
  accordionTitleGap: { rowGap: 32 },
  buttonGap: { gap: 12 },
  settingsGap: { gap: 48 },

  stickyFooter: {
    justifyContent: 'flex-end',
    marginLeft: -47,
    [theme.breakpoints.down('Medium')]: {
      marginLeft: -23,
    },
  },

  divider: {
    marginBottom: 24,
  },
}));

export default useCreatorSettingsNotificationsCategoryContainerStyles;
