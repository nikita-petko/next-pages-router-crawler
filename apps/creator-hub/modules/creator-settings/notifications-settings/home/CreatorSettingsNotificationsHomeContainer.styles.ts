import { makeStyles } from '@rbx/ui';

const useCreatorSettingsNotificationsHomeContainerStyles = makeStyles()((theme) => ({
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
}));

export default useCreatorSettingsNotificationsHomeContainerStyles;
