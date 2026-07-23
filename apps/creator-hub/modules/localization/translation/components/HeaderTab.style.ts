import { makeStyles } from '@rbx/ui';

const useHeaderTabStyle = makeStyles()((theme) => ({
  tab: {
    borderBottom: `1px solid ${theme.palette.outlineBorder}`,
    zIndex: 1,
  },

  stringsTab: {
    zIndex: 2,
  },

  icon: {
    marginLeft: -10,
    marginTop: 15,
    zIndex: 3,
  },
}));

export default useHeaderTabStyle;
