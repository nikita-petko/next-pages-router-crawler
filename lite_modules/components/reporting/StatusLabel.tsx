import { StatusBadge, type TStatusBadgeShape, type TStatusBadgeVariant } from '@rbx/foundation-ui';
import { ReactNode } from 'react';

import AppTooltip from '@components/common/AppTooltip';
import { StatusText } from '@constants/campaignStatus';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

const STATUS_BADGE_VARIANT: Record<StatusText, TStatusBadgeVariant> = {
  [StatusText.DISPLAY_STATUS_ACTIVE]: 'Success',
  [StatusText.DISPLAY_STATUS_AUTO_COMPLETED]: 'Emphasis',
  [StatusText.DISPLAY_STATUS_AUTO_PAUSED]: 'Standard',
  [StatusText.DISPLAY_STATUS_CANCELED]: 'Alert',
  [StatusText.DISPLAY_STATUS_CLICKBAIT]: 'Alert',
  [StatusText.DISPLAY_STATUS_COMPLETED]: 'Emphasis',
  [StatusText.DISPLAY_STATUS_ERROR]: 'Alert',
  [StatusText.DISPLAY_STATUS_GAME_FILTERED]: 'Alert',
  [StatusText.DISPLAY_STATUS_IN_REVIEW]: 'Warning',
  [StatusText.DISPLAY_STATUS_INACTIVE]: 'Standard',
  [StatusText.DISPLAY_STATUS_INVALID]: 'Standard',
  [StatusText.DISPLAY_STATUS_LEARNING]: 'Success',
  [StatusText.DISPLAY_STATUS_LOADING]: 'Standard',
  [StatusText.DISPLAY_STATUS_MODERATED_ACTIVE]: 'Warning',
  [StatusText.DISPLAY_STATUS_MODERATED_INACTIVE]: 'Standard',
  [StatusText.DISPLAY_STATUS_PARENT_AD_SET_IS_PAUSED]: 'Standard',
  [StatusText.DISPLAY_STATUS_PARENT_CAMPAIGN_IS_CANCELED]: 'Alert',
  [StatusText.DISPLAY_STATUS_PARENT_CAMPAIGN_IS_PAUSED]: 'Standard',
  [StatusText.DISPLAY_STATUS_PAUSED]: 'Standard',
  [StatusText.DISPLAY_STATUS_PLACE_JOIN_RESTRICTED]: 'Standard',
  [StatusText.DISPLAY_STATUS_PRIVATE]: 'Standard',
  [StatusText.DISPLAY_STATUS_PROCESSING]: 'Warning',
  [StatusText.DISPLAY_STATUS_REJECTED]: 'Alert',
  [StatusText.DISPLAY_STATUS_SCHEDULED]: 'Standard',
};

const StatusLabel = ({
  shape,
  status,
  tooltipContent,
}: {
  /** `Box` adds a backplate, for status shown as a standalone field value rather than a column. */
  shape?: TStatusBadgeShape;
  status: StatusText;
  tooltipContent: ReactNode;
}) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Report);

  const displayText = translate(status).split('\n')[0];

  return (
    <AppTooltip position='top-center' title={tooltipContent}>
      <StatusBadge
        data-testid='status-label'
        label={displayText}
        shape={shape}
        variant={STATUS_BADGE_VARIANT[status]}
      />
    </AppTooltip>
  );
};

export default StatusLabel;
