import React, { FunctionComponent, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Alert, AlertTitle, Button, Link, Typography } from '@rbx/ui';
import { useAgeVerificationUpsellContext } from '@modules/age-verification-upsell/context/AgeVerificationUpsellContext';
import { useSettings } from '@modules/settings';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import EstablishTrustDialog from './EstablishTrustDialog';

interface AgeRestrictedCollaborationInfoProps {
  ignoreUpsellVisibilityGate?: boolean;
}

const AgeRestrictedCollaborationInfo: FunctionComponent<AgeRestrictedCollaborationInfoProps> = ({
  ignoreUpsellVisibilityGate = false,
}) => {
  const { translate } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { isBannerEligible } = useAgeVerificationUpsellContext();
  const { settings } = useSettings();

  if (isBannerEligible && !ignoreUpsellVisibilityGate) {
    return null;
  }

  return (
    <React.Fragment>
      <Alert
        severity='warning'
        action={
          <Button
            color='inherit'
            size='small'
            onClick={() => setIsDialogOpen(true)}
            variant='outlined'>
            {translate('Action.AddTrustedConnections')}
          </Button>
        }>
        <AlertTitle>{translate('Title.CollaborationMayBeImpacted')}</AlertTitle>
        <Typography variant='body2'>{translate('Label.SelectImpactedToView')}</Typography>{' '}
        <Typography variant='body2'>
          <Link
            href={settings.impactedExperiencesTrustedLearnMoreUrl}
            target='_blank'
            rel='noopener noreferrer'
            sx={{ color: 'inherit !important', textDecoration: 'underline' }}>
            {translate('Action.ViewDetails')}
          </Link>
        </Typography>
      </Alert>
      <EstablishTrustDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAddTrustedFriends={() => {
          window.open(
            settings.impactedExperiencesTrustedLearnMoreUrl,
            '_blank',
            'noopener,noreferrer',
          );
        }}
        onAskParent={() => {
          window.open(settings.ageVerificationUpsellGetStartedUrl, '_blank', 'noopener,noreferrer');
        }}
      />
    </React.Fragment>
  );
};

export default withTranslation(AgeRestrictedCollaborationInfo, [TranslationNamespace.Creations]);
