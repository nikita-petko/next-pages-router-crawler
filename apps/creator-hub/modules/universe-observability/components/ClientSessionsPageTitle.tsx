import { useMemo } from 'react';
import { useFlag } from '@rbx/flags';
import { StatusBadge, type TStatusBadgeVariant } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { isClientSessionsEnabled as isClientSessionsEnabledFlag } from '@generated/flags/creatorAnalytics';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import BreadcrumbItemType from '@modules/navigation/layout/enums/BreadcrumbsItemType';
import useBreadcrumbRegistration from '@modules/navigation/layout/hooks/useBreadcrumbRegistration';
import useClientSessionMetadata from '../hooks/useClientSessionMetadata';
import useUniverseRelatedSession from '../hooks/useUniverseRelatedSession';
import { ClientSessionStatus } from '../types/ClientSession';
import ClientSessionMetadata from './ClientSessionMetadata';

const STATUS_BADGE_VARIANTS = {
  [ClientSessionStatus.Unspecified]: 'Standard',
  [ClientSessionStatus.Active]: 'Success',
  [ClientSessionStatus.Ended]: 'Standard',
  [ClientSessionStatus.Crashed]: 'Alert',
} as const satisfies Record<ClientSessionStatus, TStatusBadgeVariant>;

const ClientSessionsPageTitle = () => {
  const { isErrorLoadingUniverse, isLoadingUniverse, sessionId, universeId } =
    useUniverseRelatedSession();
  const { ready, value: isClientSessionsEnabled } = useFlag(isClientSessionsEnabledFlag, {
    universeId,
  });
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const {
    data: metadata,
    isError: isMetadataError,
    isLoading: isMetadataLoading,
  } = useClientSessionMetadata({ sessionId });
  const statusLabels = useMemo(
    () => ({
      [ClientSessionStatus.Unspecified]: tPendingTranslation(
        'Unspecified',
        'Client session status when the status is unknown.',
        translationKey(
          'Label.ClientSessionStatus.Unspecified',
          TranslationNamespace.ServerManagement,
        ),
      ),
      [ClientSessionStatus.Active]: tPendingTranslation(
        'Active',
        'Client session status when the session is ongoing.',
        translationKey('Label.ClientSessionStatus.Active', TranslationNamespace.ServerManagement),
      ),
      [ClientSessionStatus.Ended]: tPendingTranslation(
        'Ended',
        'Client session status when the session has finished.',
        translationKey('Label.ClientSessionStatus.Ended', TranslationNamespace.ServerManagement),
      ),
      [ClientSessionStatus.Crashed]: tPendingTranslation(
        'Crashed',
        'Client session status when the session crashed.',
        translationKey('Label.ClientSessionStatus.Crashed', TranslationNamespace.ServerManagement),
      ),
    }),
    [tPendingTranslation],
  );
  const title = sessionId
    ? tPendingTranslation(
        'Session ID {sessionId}',
        'Page title for an individual client session; {sessionId} is the client session identifier.',
        translationKey('Heading.SessionId', TranslationNamespace.Analytics),
        { sessionId },
      )
    : tPendingTranslation(
        'Session browser',
        'Page title for the Client Sessions page.',
        translationKey('Heading.SessionBrowser', TranslationNamespace.Analytics),
      );
  const description = sessionId
    ? null
    : tPendingTranslation(
        'Observe logs, dumps, and replays for all client-side sessions',
        'Page description for the Client Sessions page.',
        translationKey('Description.SessionBrowser', TranslationNamespace.Analytics),
      );
  const sessionBreadcrumbName =
    sessionId && !isLoadingUniverse && !isErrorLoadingUniverse && ready && isClientSessionsEnabled
      ? title
      : undefined;
  const status =
    sessionId && !isMetadataLoading && !isMetadataError && metadata
      ? {
          label: statusLabels[metadata.session.status],
          variant: STATUS_BADGE_VARIANTS[metadata.session.status],
        }
      : undefined;

  useBreadcrumbRegistration(BreadcrumbItemType.ClientSession, sessionBreadcrumbName);

  if (isLoadingUniverse || isErrorLoadingUniverse || !ready || !isClientSessionsEnabled) {
    return null;
  }

  return (
    <div className='flex gap-medium justify-between width-full'>
      <div className='flex flex-col gap-xsmall'>
        <div className='flex items-center wrap gap-small'>
          <h1 className='text-heading-large margin-none'>{title}</h1>
          {status != null && (
            <StatusBadge label={status.label} variant={status.variant} size='Small' shape='Box' />
          )}
        </div>
        {description != null && (
          <span className='text-body-large content-default padding-top-xsmall'>{description}</span>
        )}
      </div>
      <ClientSessionMetadata sessionId={sessionId} />
    </div>
  );
};

export default withNamespaceSwitchedTranslation(ClientSessionsPageTitle, [
  TranslationNamespace.Analytics,
  TranslationNamespace.ServerManagement,
]);
