import { makeStyles } from '@rbx/ui';

const useHorizontalTabsStyles = makeStyles()((theme) => ({
  filledMenuTab: {
    // eslint-disable-next-line deprecation/deprecation -- (@zwang, 07/01/24): need design input on refactor/update
    backgroundColor: theme.palette.media.toolbar,
    color: theme.palette.content.muted,
  },
}));

export default useHorizontalTabsStyles;
