import { makeStyles } from '@rbx/ui';

const useMenuContainerStyles = makeStyles()((theme) => ({
  menuContainer: {
    '& > *:not(:last-child)': {
      marginBottom: 24,
      [theme.breakpoints.down('Large')]: {
        marginBottom: 0,
      },
    },
  },

  subMenuToolbarContainer: {
    width: '100%',
    paddingBottom: 24,
    alignContent: 'flex-start',
    rowGap: 12,
  },
}));

export default useMenuContainerStyles;
