import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { resolveUrl } from '@rbx/env-utils';
import { FeedbackBanner } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Link, Typography } from '@rbx/ui';
import { AgeVerificationUpsellPage } from '@modules/age-verification-upsell/components/AgeVerificationUpsellBanner';
import AgeVerificationUpsellPersistentBanner from '@modules/age-verification-upsell/components/AgeVerificationUpsellPersistentBanner';
import EstablishTrustDialog, {
  EstablishTrustDialogSource,
} from '@modules/creations/home/components/EstablishTrustDialog';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import useCollaborationStatus from '../hooks/useCollaborationStatus';
import useCollaborators, { type UseCollaboratorsResult } from '../hooks/useCollaborators';
import useOwnerCollaborators from '../hooks/useOwnerCollaborators';
import CollaboratorsList, { type CollaboratorsListProps } from './CollaboratorsList';
import OwnerCollaboratorsView, { type OwnerCollaboratorsViewProps } from './OwnerCollaboratorsView';

const SafetyCollaboratorsPage: FunctionComponent = () => {
  const { translate, translateHTML } = useTranslation();
  const router = useRouter();
  const universeId = Number(router.query.id);
  const { settings } = useSettings();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const impressionSentRef = useRef(false);

  const {
    response: collaborationStatus,
    isLoading: statusLoading,
    error: statusError,
  } = useCollaborationStatus(universeId);

  const isAdmin = collaborationStatus?.IsAdmin ?? false;

  const editorEntries = useMemo(
    () =>
      collaborationStatus
        ? (collaborationStatus.EditView?.RequiresTrustedConnection ?? [])
        : undefined,
    [collaborationStatus],
  );
  const collaboratorsData = useCollaborators(editorEntries);

  const adminEntries = useMemo(
    () => (isAdmin ? collaborationStatus?.AdminView : undefined),
    [isAdmin, collaborationStatus?.AdminView],
  );
  const ownerCollaboratorsData = useOwnerCollaborators(adminEntries, statusError);

  const effectiveCollaboratorsData: UseCollaboratorsResult = useMemo(
    () =>
      statusError && !statusLoading
        ? { ...collaboratorsData, error: statusError, isLoading: false }
        : collaboratorsData,
    [statusError, statusLoading, collaboratorsData],
  );

  const isTrustedConnectionsRequired =
    effectiveCollaboratorsData.isLoading ||
    effectiveCollaboratorsData.error != null ||
    effectiveCollaboratorsData.friends.length > 0 ||
    effectiveCollaboratorsData.others.length > 0;

  const isNotAgeVerified =
    collaborationStatus?.EditView?.CanCollaborate === false &&
    collaborationStatus?.EditView?.Error === 'NotAgeVerified';

  const isShowingSuccessBanner = !isTrustedConnectionsRequired && !isNotAgeVerified;

  const handleDialogClose = useCallback(() => setIsDialogOpen(false), []);
  const handleAddTrustedFriends = useCallback(() => {
    window.open(
      resolveUrl(
        'trustedConnectionsLearnMoreUrl',
        process.env.targetEnvironment,
        process.env.buildTarget,
      ),
      '_blank',
      'noopener,noreferrer',
    );
  }, []);
  const handleAskParent = useCallback(() => {
    window.open(settings.ageVerificationUpsellGetStartedUrl, '_blank', 'noopener,noreferrer');
  }, [settings.ageVerificationUpsellGetStartedUrl]);

  const showOwnerView = isAdmin;

  useEffect(() => {
    if (statusLoading || impressionSentRef.current) {
      return;
    }
    impressionSentRef.current = true;
    unifiedLogger.logImpressionEvent({
      eventName: CreatorDashboardEventType.SafetyCollaboratorsImpression,
      parameters: {
        view: showOwnerView ? 'owner' : 'nonOwner',
        isAgeVerified: String(!isNotAgeVerified),
        isTrustedConnectionsRequired: String(isTrustedConnectionsRequired),
        isImpacted: String(isTrustedConnectionsRequired),
        universeId: universeId.toString(),
      },
    });
  }, [
    statusLoading,
    showOwnerView,
    isNotAgeVerified,
    isTrustedConnectionsRequired,
    universeId,
    unifiedLogger,
  ]);

  const handleOpenEstablishTrustDialog = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: CreatorDashboardEventType.SafetyCollaboratorsClick,
      parameters: {
        view: 'nonOwner',
        action: 'openEstablishTrustDialog',
        universeId: universeId.toString(),
      },
    });
    setIsDialogOpen(true);
  }, [unifiedLogger, universeId]);

  if (showOwnerView) {
    const ownerCollaboratorsViewProps: OwnerCollaboratorsViewProps = {
      collaboratorsData: ownerCollaboratorsData,
      universeId,
    };
    return <OwnerCollaboratorsView {...ownerCollaboratorsViewProps} />;
  }

  const collaboratorsListProps: CollaboratorsListProps = {
    data: effectiveCollaboratorsData,
    universeId,
  };

  return (
    <Grid
      container
      wrap='nowrap'
      direction='column'
      sx={{ display: 'flex', flexDirection: 'column' }}>
      {isNotAgeVerified && !isTrustedConnectionsRequired && (
        <AgeVerificationUpsellPersistentBanner trackingPage={AgeVerificationUpsellPage.Creations} />
      )}
      {isShowingSuccessBanner && (
        <div className='margin-bottom-medium'>
          <FeedbackBanner
            title={translate('Label.AllSetCollaborators')}
            layout='Inline'
            variant='Standard'
            severity='Success'
          />
        </div>
      )}
      <EstablishTrustDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        onAddTrustedFriends={handleAddTrustedFriends}
        onAskParent={handleAskParent}
        source={EstablishTrustDialogSource.SafetyCollaborators}
        universeId={universeId}
      />
      {isTrustedConnectionsRequired && universeId > 0 && (
        <>
          {!isShowingSuccessBanner &&
            !effectiveCollaboratorsData.isLoading &&
            !effectiveCollaboratorsData.error && (
              <Typography variant='body1' sx={{ marginBottom: '16px' }}>
                {translateHTML('Label.AddTrustedFriendsToCollaborate', [
                  {
                    opening: 'LinkStart',
                    closing: 'LinkEnd',
                    content(chunks) {
                      return (
                        <Link
                          component='button'
                          sx={{ color: 'inherit !important', textDecoration: 'underline' }}
                          onClick={handleOpenEstablishTrustDialog}>
                          {chunks}
                        </Link>
                      );
                    },
                  },
                ])}
              </Typography>
            )}
          <CollaboratorsList {...collaboratorsListProps} />
        </>
      )}
    </Grid>
  );
};

export default withTranslation(SafetyCollaboratorsPage, [TranslationNamespace.Creations]);
