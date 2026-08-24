import { useFlag } from '@rbx/flags';
import { StatusBadge } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { isClientSessionsEnabled as isClientSessionsEnabledFlag } from '@generated/flags/creatorAnalytics';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import BreadcrumbItemType from '@modules/navigation/layout/enums/BreadcrumbsItemType';
import useBreadcrumbRegistration from '@modules/navigation/layout/hooks/useBreadcrumbRegistration';
import useClientSessionMetadata from '../hooks/useClientSessionMetadata';
import useClientSessionStatusLabels from '../hooks/useClientSessionStatusLabels';
import useUniverseRelatedSession from '../hooks/useUniverseRelatedSession';
import { CLIENT_SESSION_STATUS_BADGE_VARIANTS } from '../utils/clientSessionStatusBadgeVariants';
import ClientSessionMetadata from './ClientSessionMetadata';
import ClientSessionsMetadataClientProvider from './ClientSessionsMetadataClientProvider';

const ClientSessionsPageTitleInner = () => {
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
  } = useClientSessionMetadata({ universeId, sessionId });
  const statusLabels = useClientSessionStatusLabels();
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
          label: statusLabels[metadata.exitReason],
          variant: CLIENT_SESSION_STATUS_BADGE_VARIANTS[metadata.exitReason],
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
      <ClientSessionMetadata universeId={universeId} sessionId={sessionId} />
    </div>
  );
};

const TranslatedClientSessionsPageTitleInner = withNamespaceSwitchedTranslation(
  ClientSessionsPageTitleInner,
  [TranslationNamespace.Analytics, TranslationNamespace.ServerManagement],
);

// The page title renders in the layout's title slot, a separate React tree from the page body,
// so it provides its own session metadata client rather than inheriting one from page content.
const ClientSessionsPageTitle = () => {
  const { universeId } = useUniverseRelatedSession();

  return (
    <ClientSessionsMetadataClientProvider universeId={universeId}>
      <TranslatedClientSessionsPageTitleInner />
    </ClientSessionsMetadataClientProvider>
  );
};

export default ClientSessionsPageTitle;
