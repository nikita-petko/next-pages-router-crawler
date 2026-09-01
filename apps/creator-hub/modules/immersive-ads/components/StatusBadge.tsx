import {
  PlacementRewardStatusEnum,
  PlacementStatusEnum,
} from '@rbx/client-developer-ads-stats-api/v1';
import { useTranslationWithNamespace, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

type StatusType = 'placement' | 'reward';
type StatusLabel =
  | 'Label.Status.Unknown'
  | 'Label.Status.Active'
  | 'Label.Status.Inactive'
  | 'Label.Status.Draft'
  | 'Label.Status.TestMode'
  | 'Label.Status.Error'
  | 'Label.Status.InvalidImage';
type StatusConfig = { label: StatusLabel; dotColor: string };

interface StatusBadgeProps {
  type: StatusType;
  status?: PlacementStatusEnum | PlacementRewardStatusEnum | null;
}

const PLACEMENT_STATUS_CONFIG: Record<number, StatusConfig> = {
  [PlacementStatusEnum.PLACEMENT_STATUS_UNSPECIFIED]: {
    label: 'Label.Status.Unknown',
    dotColor: 'bg-system-neutral',
  },
  [PlacementStatusEnum.PLACEMENT_STATUS_ACTIVE]: {
    label: 'Label.Status.Active',
    dotColor: 'bg-system-success',
  },
  [PlacementStatusEnum.PLACEMENT_STATUS_INACTIVE]: {
    label: 'Label.Status.Inactive',
    dotColor: 'bg-system-neutral',
  },
};

const REWARD_STATUS_CONFIG: Record<number, StatusConfig> = {
  [PlacementRewardStatusEnum.REWARD_STATUS_UNSPECIFIED]: {
    label: 'Label.Status.Draft',
    dotColor: 'bg-system-neutral',
  },
  [PlacementRewardStatusEnum.REWARD_STATUS_ACTIVE]: {
    label: 'Label.Status.Active',
    dotColor: 'bg-system-success',
  },
  [PlacementRewardStatusEnum.REWARD_STATUS_TEST]: {
    label: 'Label.Status.TestMode',
    dotColor: 'bg-system-warning',
  },
  [PlacementRewardStatusEnum.REWARD_STATUS_INACTIVE]: {
    label: 'Label.Status.Inactive',
    dotColor: 'bg-system-neutral',
  },
  [PlacementRewardStatusEnum.REWARD_STATUS_INVALID]: {
    label: 'Label.Status.Error',
    dotColor: 'bg-system-alert',
  },
  [PlacementRewardStatusEnum.REWARD_STATUS_DRAFT]: {
    label: 'Label.Status.Draft',
    dotColor: 'bg-system-neutral',
  },
  [PlacementRewardStatusEnum.REWARD_STATUS_TEST_INVALID_IMAGE]: {
    label: 'Label.Status.InvalidImage',
    dotColor: 'bg-system-alert',
  },
};

const DEFAULT_CONFIG: { label: ''; dotColor: string } = {
  label: '',
  dotColor: 'bg-system-neutral',
};

const StatusBadge = ({ type, status }: StatusBadgeProps) => {
  const { translate } = useTranslationWithNamespace(TranslationNamespace.ImmersiveAdsAnalytics);

  if (status == null) {
    return <span className='text-body-medium content-muted'>—</span>;
  }

  const config =
    (type === 'placement' ? PLACEMENT_STATUS_CONFIG : REWARD_STATUS_CONFIG)[status] ??
    DEFAULT_CONFIG;

  if (!config.label) {
    return <span className='text-body-medium content-muted'>—</span>;
  }

  return (
    <div className='inline-flex items-center gap-small'>
      <span className={`size-200 radius-circle shrink-0 ${config.dotColor}`} aria-hidden='true' />
      <span className='text-body-medium'>{translate(config.label)}</span>
    </div>
  );
};

export default withTranslation(StatusBadge, [TranslationNamespace.ImmersiveAdsAnalytics]);
