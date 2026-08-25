import { makeStyles } from '@rbx/ui';

const useExperienceUpdatesHistoryStyles = makeStyles()(() => ({
  historyTitle: {
    marginTop: 64,
    marginBottom: 24,
  },

  tooltipIcon: {
    verticalAlign: 'bottom',
    marginLeft: 4,
  },

  linkIcon: {
    verticalAlign: 'middle',
    marginLeft: 4,
  },

  tableHeadTitle: {
    whiteSpace: 'nowrap',
  },

  paginationStyle: {
    borderBottom: 0,
  },
}));

export default useExperienceUpdatesHistoryStyles;
