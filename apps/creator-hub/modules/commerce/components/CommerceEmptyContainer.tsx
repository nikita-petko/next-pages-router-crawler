import { Grid, makeStyles } from '@rbx/ui';

const useStyles = makeStyles()((theme) => ({
  root: {
    ...theme.border.radius.large,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.palette.components.divider,
    flexGrow: 1,
    height: 'calc(100% - 64px)',
    minHeight: 560,
    marginTop: 12,
  },
  container: {
    textAlign: 'center',
    width: '100%',
    marginTop: 192,
    marginBottom: 240,
    paddingLeft: 40,
    paddingRight: 40,
    rowGap: 20,
  },
}));

const CommerceEmptyContainer = ({ children }: React.PropsWithChildren) => {
  const { classes } = useStyles();

  return (
    <Grid
      container
      className={classes.root}
      justifyContent='center'
      alignItems='center'
      direction='column'>
      <Grid
        item
        container
        direction='column'
        justifyContent='center'
        alignItems='center'
        className={classes.container}
        rowGap={2.5}>
        {children}
      </Grid>
    </Grid>
  );
};

export default CommerceEmptyContainer;
