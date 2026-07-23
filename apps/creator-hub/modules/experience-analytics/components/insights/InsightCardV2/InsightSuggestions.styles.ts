import { makeStyles } from '@rbx/ui';

const useInsightSuggestionsStyles = makeStyles()(() => ({
  listContainer: {
    listStyle: 'square',
    marginTop: '4px',
    paddingLeft: '20px',
    minHeight: '45px',
    marginBottom: 0,
    '& li': {
      paddingLeft: '12px',
    },
  },
  icon: {
    marginRight: '8px',
  },
  reportContainer: {
    height: '100px',
    overflowY: 'hidden',
    position: 'relative',
    alignItems: 'flex-start',
    alignContent: 'flex-start',
  },
  report: {
    padding: '4px',
  },
}));

export default useInsightSuggestionsStyles;
