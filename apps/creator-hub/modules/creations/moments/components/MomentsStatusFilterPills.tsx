import type { FC } from 'react';
import { Chip } from '@rbx/foundation-ui';
import type { MomentCreationStatusFilterTab } from '../types/MomentCreation';
import { MomentCreationStatusFilterTabs } from '../types/MomentCreation';

const STATUS_PILLS: MomentCreationStatusFilterTab[] = MomentCreationStatusFilterTabs;

type MomentsStatusFilterPillsProps = {
  selected: MomentCreationStatusFilterTab;
  onChange: (status: MomentCreationStatusFilterTab) => void;
  labels: Record<MomentCreationStatusFilterTab, string>;
  groupLabel: string;
};

const MomentsStatusFilterPills: FC<MomentsStatusFilterPillsProps> = ({
  selected,
  onChange,
  labels,
  groupLabel,
}) => {
  return (
    <div
      className='inline-flex wrap items-center gap-small'
      data-testid='moments-status-filter-pills'
      role='radiogroup'
      aria-label={groupLabel}>
      {STATUS_PILLS.map((status) => (
        <Chip
          key={status}
          data-testid={`moments-status-pill-${status}`}
          isChecked={selected === status}
          size='Medium'
          text={labels[status]}
          onCheckedChange={(checked) => {
            if (checked) {
              onChange(status);
            }
          }}
        />
      ))}
    </div>
  );
};

export default MomentsStatusFilterPills;
