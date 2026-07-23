import { makeStyles } from '@rbx/ui';

const useAvatarTabContentStyles = makeStyles()((theme) => ({
  zeroStateContainer: {
    ...theme.border.radius.large,
    border: `1px solid ${theme.palette.components.divider}`,
    width: '100%',
  },
  contentContainer: {
    gap: 48,
    maxWidth: '100%',
  },
}));

export default useAvatarTabContentStyles;
