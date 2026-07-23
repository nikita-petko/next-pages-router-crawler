import React, { FunctionComponent } from 'react';
import { Grid, Typography } from '@rbx/ui';
import useListStateMessageStyles from './ListStateMessage.styles';

export interface ListStateMessageProps {
  title: string;
}

const ListStateMessage: FunctionComponent<React.PropsWithChildren<ListStateMessageProps>> = ({
  title,
  children,
}) => {
  const {
    classes: { text, textGrid, upperGrid },
  } = useListStateMessageStyles();

  return (
    <Grid className={textGrid} container>
      <Grid className={upperGrid} item container alignItems='flex-end' justifyContent='center'>
        <Typography variant='alertTitle'>{title}</Typography>
      </Grid>
      <Grid item container alignItems='flex-start' justifyContent='center'>
        <Typography className={text} variant='footer'>
          {children}
        </Typography>
      </Grid>
    </Grid>
  );
};

export default ListStateMessage;
