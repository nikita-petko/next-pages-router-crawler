import { makeStyles } from '@rbx/ui';

const adManagerTabHeight = '70px';

const useAdManagerTabsStyles = makeStyles()((theme) => ({
  chipRoot: {
    backgroundColor: 'rgb(57,57,57)',
    color: 'rgb(255,255,255)',
  },

  paperContainer: { backgroundColor: theme.palette.content.static.dark },
  tab: {
    '&.Mui-selected': {
      color: '#F2F2F3', // Active state
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
