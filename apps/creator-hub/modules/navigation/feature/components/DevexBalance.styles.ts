import { makeStyles } from '@rbx/ui';

const useDevexBalancesStyles = makeStyles()((theme) => ({
  root: {
    backgroundColor: theme.palette.surface[0],
    padding: theme.spacing(0, 0.5),
    border: `1px solid ${theme.palette.surface.outline}`,
    borderRadius: `${theme.shape.borderRadius}px`,
  },
}));

export default useDevexBalancesStyles;
