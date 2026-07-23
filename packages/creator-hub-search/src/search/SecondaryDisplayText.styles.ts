import { makeStyles } from '@rbx/ui';

const useSecondaryDisplayTextStyles = makeStyles()(() => ({
  container: {
    display: 'inline-flex',
    maxWidth: '100%',
    overflow: 'hidden',
    alignItems: 'baseline',
  },
  shrinkable: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flexShrink: 1,
    minWidth: 0,
  },
  fixed: {
    flexShrink: 0,
    whiteSpace: 'pre',
  },
  boldSeparator: {
    flexShrink: 0,
    whiteSpace: 'nowrap',
    margin: '0 8px',
    fontWeight: 1000,
  },
}));

export default useSecondaryDisplayTextStyles;
