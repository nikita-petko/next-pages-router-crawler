import { makeStyles } from '@rbx/ui';

const adManagerTabHeight = '70px';

const useAdManagerTabsStyles = makeStyles()((theme) => ({
  chipRoot: {
    backgroundColor: theme.palette.surface[300],
    color: theme.palette.content.standard,
  },

  paperContainer: { backgroundColor: theme.palette.surface[0] },
  tab: {
    '&.Mui-selected': {
      color: theme.palette.content.standard, // Active state
    },
    height: adManagerTabHeight,
  },
  tabLeftColumn: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    marginRight: 4,
  },
  tabMainText: {
    marginRight: 8,
    textAlign: 'left',
  },
  tabRow: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
  },
  tabs: {
    height: adManagerTabHeight,
  },
}));

export default useAdManagerTabsStyles;
