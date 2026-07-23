import React from 'react';
import {
  EventIcon,
  Grid,
  Link as MuiLink,
  LockIcon,
  makeStyles,
  RobuxIcon,
  Typography,
} from '@rbx/ui';
import Link from 'next/link';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';

const useModalStyles = makeStyles()(() => {
  return {
    modalContainer: {
      paddingLeft: '50px',
      paddingRight: '50px',
      paddingTop: '12px',
      paddingBottom: '30px',
    },
    redText: {
      color: '#F45B52',
    },
  };
});

/**
 *  OnboardingClaimModal displays a the first page of OnboardingModal for Claims Against You
 */
const OnboardingClaimModal = () => {
  const { translate, translateHTML } = useTranslation();
  const {
    classes: { modalContainer, redText },
  } = useModalStyles();

  const claimPoints = [
    'Description.ClaimAgainstYouPoint1',
    'Description.ClaimAgainstYouPoint2',
    'Description.ClaimAgainstYouPoint3',
  ];

  const claimSubpoints = [
    'Description.ClaimAgainstYouSubpoint1',
    'Description.ClaimAgainstYouSubpoint2',
    'Description.ClaimAgainstYouSubpoint3',
  ];

  const claimIcons = [
    <RobuxIcon key='claim-icon-1' />,
    <LockIcon key='claim-icon-2' />,
    <EventIcon key='claim-icon-3' />,
  ];

  return (
    <Grid container item XSmall={12} spacing={2} className={modalContainer}>
      <Grid container item>
        <Typography>{translate('Description.IntroducingClaimsAgainstYou')}</Typography>
      </Grid>
      {claimPoints.map((claimPoint, index) => (
        <Grid container item spacing={1} key={claimPoint} sx={{ marginTop: '0px' }}>
          <Grid item>{claimIcons[index]}</Grid>
          <Grid item container XSmall direction='column'>
            <Grid item>
              <Typography variant='h6' className={index === 2 ? redText : ''}>
                {translate(claimPoint)}
              </Typography>
            </Grid>
            <Grid item>
              <Typography color='secondary'>{translate(claimSubpoints[index])}</Typography>
            </Grid>
          </Grid>
        </Grid>
      ))}
      <Grid container item>
        <Typography>
          {translateHTML('Description.ClaimAgainstYouLearnMore', [
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
    </Grid>
  );
};

export default withTranslation(OnboardingClaimModal, [TranslationNamespace.RightsPortal]);
