import type { FC } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useUniverseRelatedSession from '../hooks/useUniverseRelatedSession';
import ClientSessionLogsTable from './ClientSessionLogsTable';

const ClientSessionDetailsPageContent: FC = () => {
  const { sessionId, universeId } = useUniverseRelatedSession();
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const logsHeading = tPendingTranslation(
    'Logs',
    'Section heading for logs from an individual client session.',
    translationKey('Heading.ClientSessionLogs', TranslationNamespace.ServerManagement),
  );

  return (
    <div className='flex flex-col gap-xxlarge padding-top-small'>
      <h2 className='text-heading-small margin-none'>{logsHeading}</h2>
      <ClientSessionLogsTable universeId={universeId} sessionId={sessionId} />
    </div>
  );
};

export default withNamespaceSwitchedTranslation(ClientSessionDetailsPageContent, [
  TranslationNamespace.ServerManagement,
]);
