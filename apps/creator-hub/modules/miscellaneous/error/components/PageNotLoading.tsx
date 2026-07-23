import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, Grid, AutorenewIcon, Typography } from '@rbx/ui';
import { TranslationNamespace } from '../../localization';
import usePageNotLoadingStyles from './PageNotLoading.styles';

const PageNotLoading: FunctionComponent<React.PropsWithChildren> = () => {
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
