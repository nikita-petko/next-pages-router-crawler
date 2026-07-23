import { makeStyles, TTheme } from '@rbx/ui';
import { PlayWithRewardServingStatus } from '@rbx/clients/developerAdsStatsApi';

const statusStyles = (theme: TTheme) => {
  const defaultStyles = {
    backgroundColor: theme.palette.surface[300],
  };
  const rejectedStyles = {
    backgroundColor: theme.palette.components.alert.importantFill,
    color: theme.palette.components.alert.importantContent,
  };

  return {
    [PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_UNSPECIFIED]: defaultStyles,
    [PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_NONE]: defaultStyles,
    [PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_INACTIVE_DISABLED]: defaultStyles,
    [PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_INACTIVE_PENDING]: {
      backgroundColor: theme.palette.components.alert.noticeFill,
      color: theme.palette.components.alert.noticeContent,
    },
    [PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_INACTIVE_REJECTED]: rejectedStyles,
    [PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_INACTIVE_SUSPENDED]:
      rejectedStyles,
    [PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_ACTIVE]: {
      backgroundColor: theme.palette.components.alert.activeFill,
      color: theme.palette.components.alert.activeContent,
    },
  };
};

const usePlayWithRewardServingStatusStyles = makeStyles<{ status: PlayWithRewardServingStatus }>()((
  theme,
  { status },
) => {
  const variantStyles = statusStyles(theme)[status] || {};

  return {
    labelClasses: {
      fontSize: '12px',
      gap: '6px',
      padding: '2px 8px',
      whiteSpace: 'nowrap',
      display: 'flex',
      alignItems: 'center',
      borderRadius: '4px',
      width: 'fit-content',
      ...variantStyles,
    },
  };
});

export default usePlayWithRewardServingStatusStyles;
