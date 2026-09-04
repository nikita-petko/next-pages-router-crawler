import type { FunctionComponent } from 'react';
import { Alert } from '@rbx/foundation-ui';
import { useImport } from '../ImportContext';
import type { ImportBatchStatus } from '../importStore';
import type { ImportQueueTranslations } from '../useImportQueueTranslations';

export type ImportStatusAlertProps = {
  status: ImportBatchStatus;
  translations: ImportQueueTranslations;
};

const ImportStatusAlert: FunctionComponent<ImportStatusAlertProps> = ({ status, translations }) => {
  const { batchStats, lastImportStats, dismissStatusAlert, retryFailed } = useImport();
  const completed = lastImportStats?.completed ?? batchStats.completed;
  const failed = lastImportStats?.failed ?? batchStats.failed;
  const unsupportedSummary =
    batchStats.invalid > 0 ? translations.unsupportedFilesSkipped(batchStats.invalid) : null;

  if (status === 'importing' && batchStats.completed > 0) {
    return (
      <Alert
        hasCloseAffordance
        onDismiss={dismissStatusAlert}
        severity='Success'
        variant='Feedback'>
        <span>
          <strong>{translations.importedCount(batchStats.completed)}</strong>{' '}
          {translations.pendingModerationDescription}
        </span>
      </Alert>
    );
  }

  if (status === 'complete_success') {
    return (
      <Alert
        hasCloseAffordance
        onDismiss={dismissStatusAlert}
        severity='Success'
        variant='Feedback'>
        <span>
          <strong>{translations.importSuccessAll(completed)}</strong>{' '}
          {translations.pendingModerationDescription}
          {unsupportedSummary != null && ` ${unsupportedSummary}`}
        </span>
      </Alert>
    );
  }

  if (status === 'complete_partial') {
    return (
      <Alert
        hasCloseAffordance
        onDismiss={dismissStatusAlert}
        severity='Warning'
        variant='Feedback'
        primaryActionLabel={batchStats.retryableFailed > 0 ? translations.retryFailed : undefined}
        onPrimaryAction={batchStats.retryableFailed > 0 ? retryFailed : undefined}>
        <span>
          <strong>{translations.importPartial(completed, failed)}</strong>
          {unsupportedSummary != null && ` ${unsupportedSummary}`}
        </span>
      </Alert>
    );
  }

  if (status === 'complete_failed') {
    return (
      <Alert
        hasCloseAffordance
        onDismiss={dismissStatusAlert}
        severity='Error'
        variant='Feedback'
        primaryActionLabel={batchStats.retryableFailed > 0 ? translations.retryAll : undefined}
        onPrimaryAction={batchStats.retryableFailed > 0 ? retryFailed : undefined}>
        <span>
          <strong>{translations.importFailedAll(failed)}</strong>
          {unsupportedSummary != null && ` ${unsupportedSummary}`}
        </span>
      </Alert>
    );
  }

  return null;
};

export default ImportStatusAlert;
