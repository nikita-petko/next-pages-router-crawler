import { makeStyles } from '@rbx/ui';

const useActivityFeedFilterMenuStyles = makeStyles()((theme) => ({
  filterMenuHeader: {
    marginLeft: 17,
    marginTop: 20,
  },

  filteringButtonSmallScreen: {
    marginLeft: 16,
  },

  filteringButton: {
    height: '100%',
    marginRight: 16,
    textTransform: 'none',
  },

  filteringMenuOption: {
    paddingTop: 10,
  },

  filteringMenuButtons: {
    marginLeft: 10,
    marginBottom: 10,
    marginTop: 5,
  },
}));

export default useActivityFeedFilterMenuStyles;
