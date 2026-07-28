import type { FC } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useUniverseRelatedSession from '../hooks/useUniverseRelatedSession';
import ClientSessionLogsTable from './ClientSessionLogsTable';

const ClientSessionDetailsPageContent: FC = () => {
  const { sessionId } = useUniverseRelatedSession();
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const logsHeading = tPendingTranslation(
    'Logs',
    'Section heading for logs from an individual client session.',
    translationKey('Heading.ClientSessionLogs', TranslationNamespace.ServerManagement),
  );

  return (
    <section className='flex flex-col gap-medium'>
      <h2 className='text-heading-small margin-none'>{logsHeading}</h2>
      <ClientSessionLogsTable sessionId={sessionId} />
    </section>
  );
};

export default withNamespaceSwitchedTranslation(ClientSessionDetailsPageContent, [
  TranslationNamespace.ServerManagement,
]);
