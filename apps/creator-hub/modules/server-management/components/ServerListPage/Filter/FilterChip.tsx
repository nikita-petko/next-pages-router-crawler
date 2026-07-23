import type { FunctionComponent } from 'react';
import type { TTailwindIconClass } from '@rbx/foundation-tailwind/classes';
import { Chip } from '@rbx/foundation-ui';

export interface FilterChipProps {
  label: string;
  onClick: () => void;
  trailingIconName?: TTailwindIconClass;
}

const FilterChip: FunctionComponent<FilterChipProps> = ({
  label,
  onClick,
  trailingIconName = 'icon-regular-x',
}) => {
  return (
    <Chip
      text={label}
      color='secondary'
      size='Medium'
      variant='Utility'
      isChecked={false}
      trailingIconName={trailingIconName}
      className='!stroke-standard !stroke-muted'
      onCheckedChange={onClick}
    />
  );
};

export default FilterChip;
