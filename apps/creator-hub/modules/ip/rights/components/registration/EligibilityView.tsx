import { useRouter } from 'next/router';
import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Typography, Divider, useTheme } from '@rbx/ui';
import { PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useEligibility from '../../hooks/useEligibility';
import { RIGHTS_MANAGEMENT_HREF } from '../../urls';
import AuthFailureStatus from '../error/AuthFailureStatus';
import RightsApiErrorView from '../error/RightsApiErrorView';
import ApplyFooter from './ApplyFooter';

export interface EligibilityViewProps {
  stepper: React.ReactNode;
  setStep: (step: number) => void;
  hideTitle?: boolean;
}
// EligibilityView displays step 1 of registration
const EligibilityView = ({ stepper, setStep, hideTitle = false }: EligibilityViewProps) => {
  const { ready, translate } = useTranslation();
  const { auth, isLoading, error } = useEligibility();
  const theme = useTheme();
  const router = useRouter();

  if (isLoading || !ready) {
    return <PageLoading />;
  }

  return (
    <Grid data-testid='eligibility-view' container direction='column'>
      <Grid
        item
        container
        direction='column'
        spacing={5}
        paddingBottom={5}
        sx={{
          top: '60px',
          backgroundColor: theme.palette.surface[0],
          zIndex: '2',
        }}>
        {!hideTitle && (
          <Grid item>
            <Typography variant='h1'>{translate('Heading.Registration')}</Typography>
          </Grid>
        )}
        <Grid item>{stepper}</Grid>
        <Grid item container direction='column'>
          <Grid item>
            <Typography variant='body1'>
              {translate('Description.EligibilituyVerificationRequirement')}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
      <Grid item>
        <Grid item height='100%'>
          <AuthFailureStatus
            auth={{
              idVerified: auth?.idVerified,
              emailVerified: auth?.emailVerified,
            }}
            isLoading={isLoading}
            error={error}
            errorViewComponent={RightsApiErrorView}
          />
        </Grid>
      </Grid>
      <Grid item>
        <Divider sx={{ paddingTop: 3 }} />
      </Grid>
      <Grid item paddingRight={5} paddingTop={5}>
        <ApplyFooter
          primaryLabel={translate('Label.Next')}
          primaryEnabled={!!(auth && auth.emailVerified && auth.idVerified)}
          secondaryLabel={translate('Label.Cancel')}
          onNext={() => {
            window.scrollTo(0, 0);
            setStep(1);
          }}
          onBack={() => {
            router.push(RIGHTS_MANAGEMENT_HREF);
          }}
        />
      </Grid>
    </Grid>
  );
};

export default withTranslation(EligibilityView, [TranslationNamespace.RightsPortal]);
