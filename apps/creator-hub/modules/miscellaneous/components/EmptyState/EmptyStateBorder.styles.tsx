import { makeStyles } from '@rbx/ui';

const useEmptyStateBorderStyles = makeStyles()((theme) => ({
  emptyStateContainer: {
    ...theme.border.radius.large,
    border: `1px solid ${theme.palette.components.divider}`,
  },
}));

export default useEmptyStateBorderStyles;
