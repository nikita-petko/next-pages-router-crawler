import React, { FunctionComponent } from 'react';
import { useRouter } from 'next/router';
import { Button, Grid, AutorenewIcon, Typography } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '../../localization';
import usePageNotLoadingStyles from './PageNotLoading.styles';

const PageNotLoading: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const router = useRouter();
  const { translate } = useTranslation();
  const {
    classes: { root, message, button },
  } = usePageNotLoadingStyles();

  return (
    <Grid className={root} container direction='column' justifyContent='center' alignItems='center'>
      <Typography className={message} color='secondary'>
        {translate('Description.FailedToLoadPage')}
      </Typography>
      <Button
        classes={{ root: button }}
        color='primary'
        variant='outlined'
        size='large'
        onClick={() => router.reload()}>
        <AutorenewIcon />
      </Button>
    </Grid>
  );
};

export default withTranslation(PageNotLoading, [TranslationNamespace.Error]);
