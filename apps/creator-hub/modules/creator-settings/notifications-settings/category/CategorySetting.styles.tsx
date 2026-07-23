import { makeStyles } from '@rbx/ui';

const useCategorySettingStyles = makeStyles()(() => ({
  notificationDescription: {
    marginBottom: 16,
  },

  outerGrid: {
    columnGap: 16,
  },

  option: {
    display: 'flex',
    alignItems: 'center',
  },

  channelContainer: {
    gap: 8,
  },

  betaLabel: {
    paddingLeft: 6,
  },
}));

export default useCategorySettingStyles;
