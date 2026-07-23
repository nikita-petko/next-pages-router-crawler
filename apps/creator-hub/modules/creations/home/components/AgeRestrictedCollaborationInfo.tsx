import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import { resolveUrl } from '@rbx/env-utils';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Alert, AlertTitle, Button, Link, Typography } from '@rbx/ui';
import { useAgeVerificationUpsellContext } from '@modules/age-verification-upsell/context/AgeVerificationUpsellContext';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import EstablishTrustDialog, { EstablishTrustDialogSource } from './EstablishTrustDialog';

interface AgeRestrictedCollaborationInfoProps {
  ignoreUpsellVisibilityGate?: boolean;
  /** Impacted universes currently shown; used for tracking */
  universeIds?: number[];
}

const AgeRestrictedCollaborationInfo: FunctionComponent<AgeRestrictedCollaborationInfoProps> = ({
  ignoreUpsellVisibilityGate = false,
  universeIds,
}) => {
  const { translate } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { isBannerEligible } = useAgeVerificationUpsellContext();
  const { settings } = useSettings();
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const trackAddTrustedConnectionsClick = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: CreatorDashboardEventType.ImpactedExperiencesBannerClick,
      parameters: {
        page: 'creations',
        action: 'addTrustedConnections',
        ...(universeIds && universeIds.length > 0 && { universeIds: universeIds.join(',') }),
      },
    });
    setIsDialogOpen(true);
  }, [unifiedLogger, universeIds]);

  const trackViewDetailsClick = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: CreatorDashboardEventType.ImpactedExperiencesBannerClick,
      parameters: {
        page: 'creations',
        action: 'viewDetails',
        ...(universeIds && universeIds.length > 0 && { universeIds: universeIds.join(',') }),
      },
    });
  }, [unifiedLogger, universeIds]);

  if (isBannerEligible && !ignoreUpsellVisibilityGate) {
    return null;
  }

  return (
    <>
      <Alert
        severity='warning'
        action={
          <Button
            color='inherit'
            size='small'
            onClick={trackAddTrustedConnectionsClick}
            variant='outlined'>
            {translate('Action.AddTrustedFriends')}
          </Button>
        }>
        <AlertTitle>{translate('Title.CollaborationMayBeImpacted')}</AlertTitle>
        <Typography variant='body2'>{translate('Label.SelectImpactedToView2')}</Typography>{' '}
        <Typography variant='body2'>
          <Link
            href={resolveUrl(
              'trustedConnectionsLearnMoreUrl',
              process.env.targetEnvironment,
              process.env.buildTarget,
            )}
            target='_blank'
            rel='noopener noreferrer'
            onClick={trackViewDetailsClick}
            sx={{ color: 'inherit !important', textDecoration: 'underline' }}>
            {translate('Action.ViewDetails')}
          </Link>
        </Typography>
      </Alert>
      <EstablishTrustDialog
        source={EstablishTrustDialogSource.CreationsBanner}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAddTrustedFriends={() => {
          window.open(
            resolveUrl(
              'trustedConnectionsLearnMoreUrl',
              process.env.targetEnvironment,
              process.env.buildTarget,
            ),
            '_blank',
            'noopener,noreferrer',
          );
        }}
        onAskParent={() => {
          window.open(settings.ageVerificationUpsellGetStartedUrl, '_blank', 'noopener,noreferrer');
        }}
      />
    </>
  );
};

export default withTranslation(AgeRestrictedCollaborationInfo, [TranslationNamespace.Creations]);
