import React, { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography, Button } from '@rbx/ui';
import usePageLoadErrorStyles from './LoadError.styles';

export type TLoadErrorProps = {
  src: string;
  onReload: () => void;
};

const LoadError: FunctionComponent<TLoadErrorProps> = ({ src, onReload }) => {
  const { translate } = useTranslation();
  const {
    classes: { background, button },
  } = usePageLoadErrorStyles();
  return (
    <Grid container classes={{ root: background }} direction='column' alignItems='center'>
      <Grid container item justifyContent='center'>
        <img src={src} alt='Error Illustration' width='192px' height='192px' />
      </Grid>
      <Grid container item direction='column' justifyContent='center' alignItems='center'>
        <Typography variant='h6' align='center'>
          {translate('Heading.FailedToLoadPage')}
        </Typography>
        <Typography color='secondary' align='center'>
          {translate('Message.FailedToLoadPage')}
        </Typography>
        <Button classes={{ root: button }} variant='outlined' color='secondary' onClick={onReload}>
          {translate('Action.FailedToLoadPage')}
        </Button>
      </Grid>
    </Grid>
  );
};

export default LoadError;
