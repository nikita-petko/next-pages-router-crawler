import React, { FunctionComponent } from 'react';
import { Card, Grid, Typography, makeStyles } from '@rbx/ui';

export type GroupPayoutsCardProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

const useGroupPayoutsCardStyles = makeStyles()((theme) => ({
  cardContainer: {
    minWidth: 300,
    padding: 16,
    backgroundColor: theme.palette.surface[100],
  },
  caption: {
    marginTop: 4,
  },
  contents: {
    marginTop: 8,
  },
}));

const GroupPayoutsCard: FunctionComponent<React.PropsWithChildren<GroupPayoutsCardProps>> = ({
  title,
  description,
  children,
  action,
}) => {
  const {
    classes: { cardContainer, caption, contents },
  } = useGroupPayoutsCardStyles();

  return (
    <Card className={cardContainer}>
      <Grid container direction='column'>
        <Grid container direction='row' item alignItems='center' justifyContent='space-between'>
          <Grid item>
            <Typography variant='h5'>{title}</Typography>
          </Grid>
          {action && <Grid item>{action}</Grid>}
        </Grid>
        <Grid item className={caption}>
          <Typography color='secondary' variant='body2'>
            {description}
          </Typography>
        </Grid>
        <Grid container className={contents}>
          {children}
        </Grid>
      </Grid>
    </Card>
  );
};

export default GroupPayoutsCard;
