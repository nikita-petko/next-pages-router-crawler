import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, Grid, makeStyles } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useLocalStorage } from '@rbx/react-utilities';
import OnboardingClaimModal from './OnboardingClaimModal';
import OnboardingActionsModal from './OnboardingActionsModal';

const useModalStyles = makeStyles()(() => {
  return {
    buttonSuccess: {
      backgroundColor: '#335FFF',
      color: '#fff',
    },
    modalContainer: {
      paddingLeft: '50px',
      paddingRight: '50px',
      paddingBottom: '30px',
    },
    titleContainer: {
      paddingLeft: '50px',
      paddingTop: '30px',
    },
    dialogContainer: {
      maxWidth: '750px',
    },
  };
});

/**
 *  OnboardingModal displays a modal introducing Claims Against You when a user receives a claim for the first time after product launch
 */
const OnboardingModal = () => {
  const { translate } = useTranslation();
  const [showOnboardingModal, setShowOnboardingModal] = useLocalStorage<boolean>(
    'showClaimAgainstYouOnboardingModal',
    true,
  );

  const [activeStep, setActiveStep] = useState(0);
  const {
    classes: { titleContainer, modalContainer, buttonSuccess, dialogContainer },
  } = useModalStyles();

  return (
    <Dialog open={showOnboardingModal} maxWidth='Large' classes={{ paper: dialogContainer }}>
      <DialogTitle className={titleContainer}>
        {translate(
          activeStep === 0 ? 'Heading.IntroducingClaimsAgainstYou' : 'Heading.IntroducingActions',
        )}
      </DialogTitle>
      <Grid container item XSmall={12} columnSpacing={2} className={modalContainer}>
        {activeStep === 0 ? <OnboardingClaimModal /> : <OnboardingActionsModal />}
        <Grid container item XSmall={12}>
          {activeStep === 0 && (
            <Button
              onClick={() => {
                if (activeStep === 0) {
                  setActiveStep(1);
                }
              }}
              variant='contained'
              className={buttonSuccess}
              fullWidth>
              {translate('Label.Next')}
            </Button>
          )}
          {activeStep === 1 && (
            <Grid container item XSmall={12} direction='row' columnSpacing={2}>
              <Grid item XSmall={6}>
                <Button
                  onClick={() => {
                    if (activeStep === 1) {
                      setActiveStep(0);
                    }
                  }}
                  variant='outlined'
                  fullWidth>
                  {translate('Label.Back')}
                </Button>
              </Grid>
              <Grid item XSmall={6}>
                <Button
                  onClick={() => setShowOnboardingModal(false)}
                  variant='contained'
                  className={buttonSuccess}
                  fullWidth>
                  {translate('Label.IUnderstand')}
                </Button>
              </Grid>
            </Grid>
          )}
        </Grid>
      </Grid>
    </Dialog>
  );
};

export default withTranslation(OnboardingModal, [TranslationNamespace.RightsPortal]);
