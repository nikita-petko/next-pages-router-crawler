import Link from 'next/link';
import React from 'react';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  CheckCircleIcon,
  DescriptionIcon,
  EditIcon,
  Grid,
  Link as MuiLink,
  makeStyles,
  Typography,
} from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const useModalStyles = makeStyles()(() => {
  return {
    modalContainer: {
      paddingLeft: '50px',
      paddingRight: '50px',
      paddingTop: '12px',
      paddingBottom: '30px',
    },
  };
});

/**
 *  OnboardingActionsModal displays the second page of OnboardingModal for Claims Against You
 */
const OnboardingActionsModal = () => {
  const { translate, translateHTML } = useTranslation();
  const {
    classes: { modalContainer },
  } = useModalStyles();

  const actionPoints = [
    'Description.ActionPoint1',
    'Description.ActionPoint2',
    'Description.ActionPoint3',
  ];

  const actionSubpoints = [
    'Description.ActionSubpoint1',
    'Description.ActionSubpoint2',
    'Description.ActionSubpoint3',
  ];

  const actionIcons = [
    <CheckCircleIcon key='action-icon-1' />,
    <DescriptionIcon key='action-icon-2' />,
    <EditIcon key='action-icon-3' />,
  ];

  return (
    <Grid container item XSmall={12} className={modalContainer} spacing={2} direction='column'>
      <Grid container item>
        <Typography>{translate('Description.IntroducingActions')}</Typography>
      </Grid>
      {actionPoints.map((actionPoint, index) => (
        <Grid container item spacing={1} key={actionPoint} sx={{ marginTop: '0px' }}>
          <Grid item>{actionIcons[index]}</Grid>
          <Grid item container XSmall direction='column'>
            <Grid item>
              <Typography variant='h6'>{translate(actionPoint)}</Typography>
            </Grid>
            <Grid item>
              <Typography color='secondary'>{translate(actionSubpoints[index])}</Typography>
            </Grid>
          </Grid>
        </Grid>
      ))}
      <Grid container item>
        <Typography>
          {translateHTML('Description.ActionsLearnMore', [
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

export default withTranslation(OnboardingActionsModal, [TranslationNamespace.RightsPortal]);
