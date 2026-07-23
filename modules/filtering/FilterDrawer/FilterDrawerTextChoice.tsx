// Adapted from creator-hub: https://github.rbx.com/Roblox/creator-hub/blob/master/apps/creator-hub/modules/charts-generic/components/FilterDrawer/FilterDrawerTextChoice.tsx

import { useMemo } from 'react';

import DebouncedTextField from './DebouncedTextField';
import { useFilterDrawerEventEmitterContext } from '../FilterDrawerEventEmitterContext';
import { usePendingDialogState } from './DialogEventEmitter';
import FilterChoiceWrapper from './FilterChoiceWrapper';

interface FilterDrawerTextChoiceProps {
  initial?: string;
  name: string;
  onChangeSubmit?: (newValue: string[]) => void;
  overrideSignal?: string;
}

function FilterDrawerTextChoice({
  initial = '',
  name,
  onChangeSubmit,
  overrideSignal = '',
}: FilterDrawerTextChoiceProps) {
  // NOTE: This is a bandaid that we are using to allow a single text value in usePendingDialogState
  // We can update usePendingDialogState later to support non-array values.
  type SingleTextValueAsArray = [string];
  const initialDialogState: SingleTextValueAsArray = useMemo(() => [initial], [initial]);
  const overrideSignalState: SingleTextValueAsArray = useMemo(
    () => [overrideSignal],
    [overrideSignal],
  );

  const emitter = useFilterDrawerEventEmitterContext();
  const [current, setCurrent] = usePendingDialogState(
    initialDialogState,
    emitter,
    onChangeSubmit,
    overrideSignalState,
  );

  return (
    <FilterChoiceWrapper name=''>
      <DebouncedTextField
        data-testid='filter-drawer-arbitrary-text-field'
        debounceTime={300}
        id='keywordSearchFilter'
        label={name}
        onDebouncedChange={(input) => setCurrent([input])}
        value={current[0]}
      />
    </FilterChoiceWrapper>
  );
}

export default FilterDrawerTextChoice;
