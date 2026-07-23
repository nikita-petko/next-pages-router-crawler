import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { Button, Card, CardContent, CheckCircleOutlineIcon, Grid, Typography } from '@rbx/ui';
import { creatorHub } from '@modules/miscellaneous/urls';
import useOnboardingCardStyles from './OnboardingCard.styles';

const { dashboard } = creatorHub;

const OnboardingCard: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const { classes: styles } = useOnboardingCardStyles();

  const onClickOnboard = useCallback(() => {
    router.push(dashboard.getSellerOnboardingUrl());
  }, [router]);

  return (
    <Card variant='outlined'>
      <CardContent>
        <Grid container direction='row' justifyContent='flex-end' spacing={2}>
          <Grid item>
            <CheckCircleOutlineIcon color='success' />
          </Grid>
          <Grid item XSmall>
            <Grid container direction='column'>
              <Grid item>
                <Typography variant='body1'>{translate('Heading.StoreOnboarding')}</Typography>
              </Grid>
              <Grid item>
                <Typography variant='body2'>{translate('Description.StoreOnboarding')}</Typography>
              </Grid>
            </Grid>
          </Grid>
          <Grid item XSmall='auto'>
            <Button
              className={styles.redirectButton}
              color='secondary'
              onClick={onClickOnboard}
              size='small'
              variant='text'>
              {translate('Action.RedirectToStoreOnboarding')}
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default OnboardingCard;
