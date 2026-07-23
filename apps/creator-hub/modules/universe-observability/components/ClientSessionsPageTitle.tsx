import { useFlag } from '@rbx/flags';
import { useTranslation } from '@rbx/intl';
import { isClientSessionsEnabled as isClientSessionsEnabledFlag } from '@generated/flags/creatorAnalytics';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import BreadcrumbItemType from '@modules/navigation/layout/enums/BreadcrumbsItemType';
import useBreadcrumbRegistration from '@modules/navigation/layout/hooks/useBreadcrumbRegistration';
import useUniverseRelatedSession from '../hooks/useUniverseRelatedSession';

const ClientSessionsPageTitle = () => {
  const { isErrorLoadingUniverse, isLoadingUniverse, sessionId, universeId } =
    useUniverseRelatedSession();
  const { ready, value: isClientSessionsEnabled } = useFlag(isClientSessionsEnabledFlag, {
    universeId,
  });
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
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

  useBreadcrumbRegistration(BreadcrumbItemType.ClientSession, sessionBreadcrumbName);

  if (isLoadingUniverse || isErrorLoadingUniverse || !ready || !isClientSessionsEnabled) {
    return null;
  }

  return (
    <div className='flex flex-col gap-xsmall'>
      <h1 className='text-heading-large margin-none'>{title}</h1>
      {description != null && (
        <span className='text-body-large content-default padding-top-xsmall'>{description}</span>
      )}
    </div>
  );
};

export default withNamespaceSwitchedTranslation(ClientSessionsPageTitle, [
  TranslationNamespace.Analytics,
]);
