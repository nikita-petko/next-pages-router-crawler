import React from 'react';
import {
  AttachMoneyIcon,
  Button,
  CallMadeIcon,
  Dialog,
  DialogTitle,
  EventIcon,
  Grid,
  Link as MuiLink,
  makeStyles,
  Typography,
} from '@rbx/ui';
import Link from 'next/link';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useLocalStorage } from '@rbx/react-utilities';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';

const useModalStyles = makeStyles()(() => {
  return {
    buttonSuccess: {
      backgroundColor: '#335FFF',
      color: '#fff',
    },
    modalContainer: {
      paddingLeft: '50px',
      paddingRight: '50px',
      paddingTop: '12px',
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
 *  OnboardingModal displays a modal introducing Claims & Disputes
 *  when a user goes into Rights Manager for the first time after product launch
 */
const OnboardingModal = () => {
  const { translate, translateHTML } = useTranslation();
  const [showOnboardingModal, setShowOnboardingModal] = useLocalStorage<boolean>(
    'showClaimsOnboardingModal',
    true,
  );
  const {
    classes: { titleContainer, modalContainer, buttonSuccess, dialogContainer },
  } = useModalStyles();

  const claimPoints = [
    'Description.ClaimPoint1',
    'Description.ClaimPoint2',
    'Description.ClaimPoint3',
  ];

  const claimSubpoints = [
    'Description.ClaimSubpoint1',
    'Description.ClaimSubpoint2',
    'Description.ClaimSubpoint3',
  ];

  const icons = [
    <EventIcon key='icon1' />,
    <AttachMoneyIcon key='icon2' />,
    <CallMadeIcon key='icon3' />,
  ];

  return (
    <Dialog open={showOnboardingModal} maxWidth='Large' classes={{ paper: dialogContainer }}>
      <DialogTitle className={titleContainer}>{translate('Heading.IntroducingClaims')}</DialogTitle>
      <Grid container item XSmall={12} rowSpacing={3} columnSpacing={2} className={modalContainer}>
        <Grid container item>
          <Typography>{translate('Description.IntroducingClaims')}</Typography>
        </Grid>
        {claimPoints.map((claimPoint, index) => (
          <Grid container item spacing={2} wrap='nowrap' key={claimPoint}>
            <Grid item>{icons[index]}</Grid>
            <Grid item container XSmall direction='column'>
              <Grid item>
                <Typography variant='h6'>{translate(claimPoint)}</Typography>
              </Grid>
              <Grid item>
                <Typography color='secondary'>{translate(claimSubpoints[index])}</Typography>
              </Grid>
            </Grid>
          </Grid>
        ))}
        <Grid container item>
          <Typography>
            {translateHTML('Description.ClaimLearnMore', [
              {
                opening: 'guidelinesStart',
                closing: 'guidelinesEnd',
                content(chunks) {
                  return (
                    <Link
                      href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/publishing/rights-manager`}
                      passHref
                      legacyBehavior>
                      <MuiLink color='primary'>{chunks}</MuiLink>
                    </Link>
                  );
                },
              },
              {
                opening: 'faqStart',
                closing: 'faqEnd',
                content(chunks) {
                  return (
                    <Link
                      href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/publishing/dmca-guidelines`}
                      passHref
                      legacyBehavior>
                      <MuiLink color='primary'>{chunks}</MuiLink>
                    </Link>
                  );
                },
              },
            ])}
          </Typography>
        </Grid>
        <Grid container item XSmall={12}>
          <Button
            onClick={() => setShowOnboardingModal(false)}
            variant='contained'
            className={buttonSuccess}
            fullWidth>
            {translate('Label.IUnderstand')}
          </Button>
        </Grid>
      </Grid>
    </Dialog>
  );
};

export default withTranslation(OnboardingModal, [TranslationNamespace.RightsPortal]);
