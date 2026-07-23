import { makeStyles } from '@rbx/ui';

const useHorizontalTabsStyles = makeStyles()((theme) => ({
  filledMenuTab: {
    backgroundColor: theme.palette.media.toolbar,
    color: theme.palette.content.muted,
  },
}));

export default useHorizontalTabsStyles;
