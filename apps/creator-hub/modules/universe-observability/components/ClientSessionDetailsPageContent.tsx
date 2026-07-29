import type { FC } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useUniverseRelatedSession from '../hooks/useUniverseRelatedSession';
import ClientSessionLogsTable from './ClientSessionLogsTable';
import ClientSessionMetadata from './ClientSessionMetadata';

const ClientSessionDetailsPageContent: FC = () => {
  const { sessionId, universeId } = useUniverseRelatedSession();
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const metadataHeading = tPendingTranslation(
    'Metadata',
    'Section heading for metadata about an individual client session.',
    translationKey('Heading.ClientSessionMetadata', TranslationNamespace.ServerManagement),
  );
  const logsHeading = tPendingTranslation(
    'Logs',
    'Section heading for logs from an individual client session.',
    translationKey('Heading.ClientSessionLogs', TranslationNamespace.ServerManagement),
  );

  return (
    <div className='flex flex-col gap-xxlarge padding-top-small'>
      <section className='flex flex-col gap-medium'>
        <h2 className='text-heading-small margin-none'>{metadataHeading}</h2>
        <ClientSessionMetadata sessionId={sessionId} />
      </section>
      <section className='flex flex-col gap-medium'>
        <h2 className='text-heading-small margin-none'>{logsHeading}</h2>
        <ClientSessionLogsTable universeId={universeId} sessionId={sessionId} />
      </section>
    </div>
  );
};

export default withNamespaceSwitchedTranslation(ClientSessionDetailsPageContent, [
  TranslationNamespace.ServerManagement,
]);
