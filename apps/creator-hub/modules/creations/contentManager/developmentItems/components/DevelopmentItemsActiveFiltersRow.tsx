import type { FunctionComponent } from 'react';
import { Button, Chip } from '@rbx/foundation-ui';

export type DevelopmentItemsActiveFilterChip = {
  id: string;
  label: string;
  onClear: () => void;
};

export type DevelopmentItemsActiveFiltersRowProps = {
  chips: readonly DevelopmentItemsActiveFilterChip[];
  clearFilterLabel: (filterLabel: string) => string;
  onReset: () => void;
  resetLabel: string;
};

const DevelopmentItemsActiveFiltersRow: FunctionComponent<
  DevelopmentItemsActiveFiltersRowProps
> = ({ chips, clearFilterLabel, onReset, resetLabel }) => {
  if (chips.length === 0) {
    return null;
  }

  return (
    <div className='flex items-center gap-small wrap width-full min-width-0'>
      {chips.map((chip) => (
        <Chip
          aria-label={clearFilterLabel(chip.label)}
          className='!radius-small max-width-full'
          isChecked={false}
          key={chip.id}
          onCheckedChange={chip.onClear}
          size='Small'
          text={chip.label}
          trailingIconName='icon-regular-x'
          variant='Standard'
        />
      ))}
      <Button onClick={onReset} size='Small' variant='Utility'>
        {resetLabel}
      </Button>
    </div>
  );
};

export default DevelopmentItemsActiveFiltersRow;
