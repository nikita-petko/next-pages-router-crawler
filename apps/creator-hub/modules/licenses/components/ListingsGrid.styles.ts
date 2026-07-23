import { makeStyles } from '@rbx/ui';

const useListingsGridStyles = makeStyles()((theme) => ({
  itemGrid: {
    marginTop: theme.spacing(2),
    display: 'grid',
    gridGap: theme.spacing(2),
    gridTemplateColumns: `repeat(auto-fill, minmax(272px, 1fr))`,
    [theme.breakpoints.down('Medium')]: {
      padding: theme.spacing(0, 1),
      marginTop: theme.spacing(1),
      gridGap: theme.spacing(1),
    },
  },
}));

export default useListingsGridStyles;
