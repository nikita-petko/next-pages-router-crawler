import React from 'react';
import { Card, CardContent, Grid, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import useEmptyResultsCardStyles from './EmptyResultsCard.styles';

const EmptyResultsCard = () => {
  const { translate } = useTranslation();
  const { classes } = useEmptyResultsCardStyles();

  return (
    <Card className={classes.noResultsContainer}>
      <CardContent>
        <Grid container direction='row' justifyContent='center' alignItems='center'>
          <Grid item>
            <Typography variant='body2'>{translate('Label.NoResults')}</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default EmptyResultsCard;
