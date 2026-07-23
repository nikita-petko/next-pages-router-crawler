import { makeStyles } from '@rbx/ui';

const useEntryListStyle = makeStyles()((theme) => ({
  list: {
    overflow: 'hidden',
  },

  buttonListItem: {
    paddingLeft: 32,
  },

  text: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  shimmerText: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: theme.palette.stateSecondary.outlinedRestingBorder,
  },
}));

export default useEntryListStyle;
