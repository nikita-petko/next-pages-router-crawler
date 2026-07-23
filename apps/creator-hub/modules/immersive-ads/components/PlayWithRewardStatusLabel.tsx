import React from 'react';
import { Typography, Tooltip } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { PlayWithRewardServingStatus } from '@rbx/clients/developerAdsStatsApi';
import usePlayWithRewardStatusLabelStyles from './PlayWithRewardStatusLabel.styles';

export interface PlayWithRewardStatusLabelProps {
  playWithRewardServingStatus: PlayWithRewardServingStatus;
}

const playWithRewardStatusConfig = {
  [PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_UNSPECIFIED]: {
    labelKey: '',
    tooltipKey: '',
  },
  [PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_NONE]: {
    labelKey: '',
    tooltipKey: '',
  },
  [PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_INACTIVE_DISABLED]: {
    labelKey: 'Label.PlayWithRewardStatus.Deactivated',
    tooltipKey: '',
  },
  [PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_INACTIVE_PENDING]: {
    labelKey: 'Label.PlayWithRewardStatus.InReview',
    tooltipKey: 'Tooltip.PlayWithRewardStatus.InReview',
  },
  [PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_INACTIVE_REJECTED]: {
    labelKey: 'Label.PlayWithRewardStatus.Rejected',
    tooltipKey: 'Tooltip.PlayWithRewardStatus.Rejected',
  },
  [PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_INACTIVE_SUSPENDED]: {
    labelKey: 'Label.PlayWithRewardStatus.Rejected',
    tooltipKey: '',
  },
  [PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_ACTIVE]: {
    labelKey: 'Label.PlayWithRewardStatus.Active',
    tooltipKey: '',
  },
};

const PlayWithRewardStatusLabel: React.FC<PlayWithRewardStatusLabelProps> = ({
  playWithRewardServingStatus,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { classes } = usePlayWithRewardStatusLabelStyles({ status: playWithRewardServingStatus });

  const { labelKey, tooltipKey } =
    playWithRewardStatusConfig[playWithRewardServingStatus] ||
    playWithRewardStatusConfig[
      PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_UNSPECIFIED
    ];

  return labelKey ? (
    <Tooltip
      placement='top'
      title={translate(translationKey(tooltipKey, TranslationNamespace.ImmersiveAdsAnalytics))}
      arrow>
      <div className={classes.labelClasses}>
        <Typography variant='caption'>
          {translate(translationKey(labelKey, TranslationNamespace.ImmersiveAdsAnalytics))}
        </Typography>
      </div>
    </Tooltip>
  ) : null;
};

export default PlayWithRewardStatusLabel;
