import { makeStyles } from '@rbx/ui';

const useFrequencyCappingStyles = makeStyles()(() => ({
  frequencyCappingConnectingText: {
    alignSelf: 'center',
    flex: '0 0 auto',
    margin: '0 8px',
  },
  frequencyCappingDurationSelect: {
    minWidth: '120px',
  },
  frequencyCappingRow: {
    alignItems: 'center',
  },
  frequencyCappingValueSelect: {
    minWidth: '160px',
  },
}));

export default useFrequencyCappingStyles;
