import { useMemo } from 'react';
import type { FormattedText } from '@modules/analytics-translations/types';
import DebouncedTextField from '../../charts/DebouncedTextField';
import { useFilterDrawerEventEmitterContext } from '../../context/FilterDrawerEventEmitterContext';
import { usePendingDialogState } from './DialogEventEmitter';
import FilterChoiceWrapper from './FilterChoiceWrapper';

export interface FilterDrawerTextChoiceProps {
  name: FormattedText;
  initial?: string;
  onChangeSubmit?: (newValue: string[]) => void;
}

function FilterDrawerTextChoice({
  name,
  initial = '',
  onChangeSubmit,
}: FilterDrawerTextChoiceProps) {
  // NOTE: This is a bandaid that we are using to allow a single text value in usePendingDialogState
  // We can update usePendingDialogState later to support non-array values.
  type SingleTextValueAsArray = [string];
  const initialDialogState: SingleTextValueAsArray = useMemo(() => [initial], [initial]);
  const emitter = useFilterDrawerEventEmitterContext();
  const [current, setCurrent] = usePendingDialogState(initialDialogState, emitter, onChangeSubmit);

  return (
    <FilterChoiceWrapper name={name}>
      <DebouncedTextField
        id='keywordSearchFilter'
        data-testid='filter-drawer-arbitrary-text-field'
        debounceTime={300}
        value={current[0]}
        onDebouncedChange={(input) => setCurrent([input])}
        label={undefined}
      />
    </FilterChoiceWrapper>
  );
}

export default FilterDrawerTextChoice;
