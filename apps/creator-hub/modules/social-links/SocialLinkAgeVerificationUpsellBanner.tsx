import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Alert, Button, AlertTitle, Typography, Link } from '@rbx/ui';
import { ageVerificationRedirectPath, socialLinksExperienceGuidelinesUrl } from './constants';
import useSocialLinkAgeVerificationUpsellBannerStyles from './SocialLinkAgeVerificationUpsellBanner.styles';

const SocialLinkAgeVerificationUpsellBanner = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  const { translate } = useTranslation();
  const {
    classes: { socialLinkExpirationAlertContainer, getStarted, alertTitle, viewDetails },
  } = useSocialLinkAgeVerificationUpsellBannerStyles();

  return (
    <Alert
      severity='info'
      variant='filled'
      className={socialLinkExpirationAlertContainer}
      action={
        <Button
          key='getStarted'
          href={ageVerificationRedirectPath}
          className={getStarted}
          color='inherit'
          size='small'>
          {translate('Action.GetStarted')}
        </Button>
      }>
      <AlertTitle className={alertTitle}>{title}</AlertTitle>
      <Typography variant='body2'>{description}</Typography>
      &nbsp;
      <Link
        className={viewDetails}
        href={socialLinksExperienceGuidelinesUrl}
        target='_blank'
        rel='noopener noreferrer'
        color='inherit'>
        {translate('Label.ViewDetails')}
      </Link>
    </Alert>
  );
};

export default SocialLinkAgeVerificationUpsellBanner;
