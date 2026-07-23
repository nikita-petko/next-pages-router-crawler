import { makeStyles } from '@rbx/ui';

const useActivityFeedItemListStyles = makeStyles()((theme) => ({
  table: {
    tableLayout: 'fixed',
    flexGrow: 1,
    marginTop: '1em',
    width: '100%',
  },
}));

export default useActivityFeedItemListStyles;
