import { makeStyles } from '@rbx/ui';

const useFrequencyCappingStyles = makeStyles()(() => ({
  frequencyCappingConnectingText: {
    flex: '0 0 auto',
    margin: '0 8px',
  },
  frequencyCappingDurationSelect: {
    minWidth: '120px',
  },
  // Top-anchored rather than centered: the labels Foundation stacks above each
  // dropdown would otherwise pull the connecting text above the controls.
  frequencyCappingRow: {
    alignItems: 'flex-start',
  },
  frequencyCappingValueSelect: {
    minWidth: '160px',
  },
}));

export default useFrequencyCappingStyles;
