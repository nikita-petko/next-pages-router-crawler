import { PlayWithRewardServingStatus } from '@rbx/client-developer-ads-stats-api/v1';
import { Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export interface PlayWithRewardStatusLabelProps {
  playWithRewardServingStatus: PlayWithRewardServingStatus;
}

interface PlayWithRewardStatusConfig {
  labelKey: string;
  tooltipKey: string;
  tooltipDescriptionKey?: string;
}

const statusDotColor: Record<PlayWithRewardServingStatus, string> = {
  [PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_UNSPECIFIED]: 'bg-system-neutral',
  [PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_NONE]: 'bg-system-neutral',
  [PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_INACTIVE_DISABLED]:
    'bg-system-neutral',
  [PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_INACTIVE_PENDING]:
    'bg-system-warning',
  [PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_INACTIVE_REJECTED]:
    'bg-system-alert',
  [PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_INACTIVE_SUSPENDED]:
    'bg-system-alert',
  [PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_ACTIVE]: 'bg-system-success',
};

const playWithRewardStatusConfig: Record<PlayWithRewardServingStatus, PlayWithRewardStatusConfig> =
  {
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
      labelKey: 'Label.PlayWithRewardStatus.TestMode',
      tooltipKey: 'TooltipTitle.PlayWithRewardStatus.TestMode',
      tooltipDescriptionKey: 'TooltipDescription.PlayWithRewardStatus.TestMode',
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

const PlayWithRewardStatusLabel = ({
  playWithRewardServingStatus,
}: PlayWithRewardStatusLabelProps) => {
  const { translate } = useTranslationWrapper(useTranslation());

  const {
    labelKey,
    tooltipKey,
    tooltipDescriptionKey = '',
  } = playWithRewardStatusConfig[playWithRewardServingStatus] ||
  playWithRewardStatusConfig[
    PlayWithRewardServingStatus.PLAY_WITH_REWARD_SERVING_STATUS_UNSPECIFIED
  ];

  const tooltipTitle = tooltipKey
    ? translate(translationKey(tooltipKey, TranslationNamespace.ImmersiveAdsAnalytics))
    : '';
  const tooltipDescription = tooltipDescriptionKey
    ? translate(translationKey(tooltipDescriptionKey, TranslationNamespace.ImmersiveAdsAnalytics))
    : undefined;

  if (!labelKey) {
    return null;
  }

  const content = (
    <div className='inline-flex items-center gap-small'>
      <span
        className={`size-200 radius-circle shrink-0 ${statusDotColor[playWithRewardServingStatus]}`}
        aria-hidden='true'
      />
      <Typography variant='caption'>
        {translate(translationKey(labelKey, TranslationNamespace.ImmersiveAdsAnalytics))}
      </Typography>
    </div>
  );

  return tooltipKey ? (
    <Tooltip position='top-center' title={tooltipTitle} description={tooltipDescription} hasBeak>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
    </Tooltip>
  ) : (
    content
  );
};

export default PlayWithRewardStatusLabel;
