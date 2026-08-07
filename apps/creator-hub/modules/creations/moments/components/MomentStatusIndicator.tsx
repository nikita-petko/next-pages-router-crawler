import type { FC, ReactNode } from 'react';
import { MOMENT_STATUS_DOT_CLASS } from '../constants/momentStatusDotStyles';
import type { MomentCreationStatus } from '../types/MomentCreation';

type MomentStatusIndicatorProps = {
  status: MomentCreationStatus;
  label: ReactNode;
};

const MomentStatusIndicator: FC<MomentStatusIndicatorProps> = ({ status, label }) => {
  return (
    <span className='inline-flex items-center gap-xsmall'>
      <span
        aria-hidden
        className={`size-[8px] radius-circle shrink-0 ${MOMENT_STATUS_DOT_CLASS[status]}`}
        data-testid={`moment-status-dot-${status}`}
      />
      <span>{label}</span>
    </span>
  );
};

export default MomentStatusIndicator;
