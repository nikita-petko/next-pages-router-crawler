import { makeStyles } from '@rbx/ui';

const usePermissionEmptyStateStyles = makeStyles()((theme) => ({
  container: {
    ...theme.border.radius.medium,
    border: `1px solid ${theme.palette.components.divider}`,
    width: '100%',
  },
}));

export default usePermissionEmptyStateStyles;
