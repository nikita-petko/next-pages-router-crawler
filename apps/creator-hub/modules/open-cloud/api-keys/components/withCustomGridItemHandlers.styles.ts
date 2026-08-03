import { makeStyles } from '@rbx/ui';

const useCustomTargetPartGridItemStyles = makeStyles()(() => ({
  gridItem: {
    padding: 8,
  },

  targetValueLabel: {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
}));

export default useCustomTargetPartGridItemStyles;
