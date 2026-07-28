import { makeStyles } from '@rbx/ui';

const usePurchaseCellStyles = makeStyles()((theme) => ({
  avatarIcon: {
    backgroundColor: theme.palette.surface[400],
    height: 32,
    overflow: 'hidden',
    width: 32,
    borderRadius: 16,
  },
  placeIcon: {
    backgroundColor: theme.palette.surface[400],
    height: 32,
    overflow: 'hidden',
    width: 32,
    borderRadius: 8,
  },
}));

export default usePurchaseCellStyles;
