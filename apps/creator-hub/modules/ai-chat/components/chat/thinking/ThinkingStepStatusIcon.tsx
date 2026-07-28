import type { FC } from 'react';
import { Icon } from '@rbx/foundation-ui';
import { CircularProgress } from '@rbx/ui';
import { ThinkingStepStatus } from '@modules/analytics-assistant/types/AnalyticsChatTypes';

const ICON_CLASS =
  'flex items-center justify-center size-200 shrink-0 [margin-right:var(--size-50)]';
const CANCELLED_CLASS =
  'inline-block shrink-0 radius-circle [width:14px] [height:2px] [background:var(--color-content-muted)]';

interface ThinkingStepStatusIconProps {
  status: ThinkingStepStatus;
}

const ThinkingStepStatusIcon: FC<ThinkingStepStatusIconProps> = ({ status }) => {
  if (status === ThinkingStepStatus.InProgress) {
    return <CircularProgress size={14} color='secondary' className={ICON_CLASS} />;
  }

  if (status === ThinkingStepStatus.Completed) {
    return <Icon name='icon-regular-check' size='Medium' className={ICON_CLASS} />;
  }

  if (status === ThinkingStepStatus.Error) {
    return (
      <Icon name='icon-filled-x' size='Medium' className={`${ICON_CLASS} content-system-alert`} />
    );
  }

  return <span className={CANCELLED_CLASS} aria-hidden='true' />;
};

export default ThinkingStepStatusIcon;
