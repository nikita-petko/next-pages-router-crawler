import type { FunctionComponent } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { FeedbackBanner, Link } from '@rbx/foundation-ui';
import { useLocalization, useTranslation, withTranslation } from '@rbx/intl';
import { PageLoading } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { buildTrustedFriendsUrl, PARENTAL_CONTROLS_URL } from './constants';
import EditorCollaboratorsView from './EditorCollaboratorsView';
import useImpactedCollaborators from './hooks/useImpactedCollaborators';
import OwnerCollaboratorsView from './OwnerCollaboratorsView';
import { fetchFailureEvent, pageLoadEvent } from './unifiedLoggerUtils';

const CollaboratorPageContent: FunctionComponent = () => {
  const router = useRouter();
  const { translateWithNamespace, translateWithNamespaceHTML } = useTranslation();
  const { locale } = useLocalization();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const universeId = Number(router.query.id);
  const {
    canCollaborate,
    isAdmin,
    isAgeVerified,
    impactedCollaborators,
    accessedCollaborators,
    impactingMe,
    impactingOthers,
    joinAttempts,
    isLoading,
    error,
  } = useImpactedCollaborators(universeId);

  const isOwner = isAdmin ?? false;
  const requiresAction = isOwner
    ? impactedCollaborators.length > 0 || joinAttempts.length > 0
    : impactingMe.length > 0 || impactingOthers.length > 0;
  // Determines if empty state should be shown
  const hasContent = requiresAction || (isOwner && accessedCollaborators.length > 0);

  const impressionSentRef = useRef(false);
  useEffect(() => {
    if (isLoading || impressionSentRef.current) {
      return;
    }
    impressionSentRef.current = true;
    unifiedLogger.logImpressionEvent(
      pageLoadEvent(universeId, isOwner, isAgeVerified, requiresAction),
    );
  }, [isLoading, isOwner, isAgeVerified, requiresAction, universeId, unifiedLogger]);
  const errorLoggedRef = useRef(false);
  useEffect(() => {
    if (!error || isLoading || errorLoggedRef.current) {
      return;
    }
    errorLoggedRef.current = true;
    unifiedLogger.logErrorEvent(fetchFailureEvent(universeId, isOwner, error.message));
  }, [error, isLoading, isOwner, universeId, unifiedLogger]);

  // Determine loading/error state or correct view based on user role
  const content = useMemo(() => {
    if (isLoading) {
      return <PageLoading />;
    }
    if (error) {
      if (error?.message === 'TooManyCollaborators') {
        return (
          <FeedbackBanner
            title={translateWithNamespace(
              TranslationNamespace.Creations,
              'Banner.TooManyCollaborators',
            )}
            layout='Inline'
            variant='Emphasis'
            severity='Error'
          />
        );
      }
      if (error?.message === 'AgeVerificationCountryBlocked') {
        return (
          <FeedbackBanner
            title={translateWithNamespace(
              TranslationNamespace.Creations,
              'Description.TeamCreateDisabledForCountry',
            )}
            layout='Inline'
            variant='Emphasis'
            severity='Error'
          />
        );
      }
      return (
        <FailureView
          title={translateWithNamespace(TranslationNamespace.Error, 'Heading.FailedToLoadPage')}
          message={translateWithNamespace(TranslationNamespace.Error, 'Message.FailedToLoadPage')}
        />
      );
    }
    // This banner is to be replaced by the additional error handling in the V2 designs
    const unknownCollaborationErrorBanner = (
      <FeedbackBanner
        title={translateWithNamespace(
          TranslationNamespace.Creations,
          'Description.UnknownCollaborationError',
        )}
        layout='Inline'
        variant='Emphasis'
        severity='Warning'
      />
    );
    if (!hasContent) {
      // Empty state
      return canCollaborate ? (
        <FeedbackBanner
          title={translateWithNamespace(
            TranslationNamespace.Creations,
            isAdmin
              ? 'Banner.AllCollaboratorsCanWork'
              : 'Description.YouCanWorkWithAllCollaborators',
          )}
          layout='Inline'
          variant='Emphasis'
          severity='Success'
        />
      ) : (
        unknownCollaborationErrorBanner
      );
    }

    // Banner is shown in both non-empty views
    const collaboratorWarningBanner = requiresAction ? (
      <FeedbackBanner
        variant='Emphasis'
        severity='Warning'
        title={translateWithNamespace(
          TranslationNamespace.Creations,
          'Description.CollaboratorRequirementsBanner',
        )}
        className='margin-y-small'
      />
    ) : undefined;

    if (isAdmin) {
      return (
        <>
          {collaboratorWarningBanner}
          <OwnerCollaboratorsView
            accessedUsers={accessedCollaborators}
            pendingAccess={impactedCollaborators}
            joinAttempts={joinAttempts}
            universeId={universeId}
          />
        </>
      );
    }

    return (
      <>
        {!canCollaborate && impactingMe.length === 0
          ? unknownCollaborationErrorBanner
          : collaboratorWarningBanner}
        <EditorCollaboratorsView
          impactingMe={impactingMe}
          impactingOthers={impactingOthers}
          universeId={universeId}
        />
      </>
    );
  }, [
    translateWithNamespace,
    error,
    isAdmin,
    universeId,
    requiresAction,
    isLoading,
    impactedCollaborators,
    accessedCollaborators,
    impactingMe,
    impactingOthers,
    joinAttempts,
    hasContent,
    canCollaborate,
  ]);

  return (
    <>
      <p className='margin-top-none'>
        {translateWithNamespaceHTML(
          TranslationNamespace.Creations,
          'Description.CrossAgeCollaboration',
          [
            {
              opening: 'parentalPermissionLinkStart',
              closing: 'parentalPermissionLinkEnd',
              content(chunks) {
                return (
                  <Link
                    color='Standard'
                    underline='always'
                    href={PARENTAL_CONTROLS_URL}
                    target='_blank'
                    rel='noopener noreferrer'>
                    {chunks}
                  </Link>
                );
              },
            },
            {
              opening: 'trustedFriendLinkStart',
              closing: 'trustedFriendLinkEnd',
              content(chunks) {
                return (
                  <Link
                    color='Standard'
                    underline='always'
                    href={buildTrustedFriendsUrl(locale ?? 'en-us')}
                    target='_blank'
                    rel='noopener noreferrer'>
                    {chunks}
                  </Link>
                );
              },
            },
          ],
        )}
      </p>
      {content}
    </>
  );
};

export default withTranslation(CollaboratorPageContent, [
  TranslationNamespace.Creations,
  TranslationNamespace.Error,
]);
