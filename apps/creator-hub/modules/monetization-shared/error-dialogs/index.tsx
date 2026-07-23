// oxlint-disable-next-line check-file/no-index -- intended entrypoint
import { useTranslation, withTranslation } from '@rbx/intl';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { closeDialog, openDialog } from '../dialog/actions';
import { pluralize } from '../pluralize';
import ErrorDialogContent from './ErrorDialogContent';

const COMMON_TITLE_KEY = 'Heading.ErrorOccurred';
const COMMON_ACTION_KEY = 'Action.Continue';

/**
 * Generic error dialog used for unrecoverable failures (network errors, etc.).
 */
export function openRequestErrorDialog() {
  openDialog({
    content: (
      <ErrorDialogContent
        titleKey={COMMON_TITLE_KEY}
        bodyKey='Message.ErrorProcessingRequest'
        actionKey={COMMON_ACTION_KEY}
        onClose={closeDialog}
      />
    ),
  });
}

const PartialFailuresBody = withTranslation(
  ({ count }: { count: number }) => {
    const { translate } = useTranslation();
    const key = pluralize(
      count,
      'Message.ErrorCountSingleUpdateFailure',
      'Message.ErrorCountMultipleUpdateFailure',
    );
    return translate(key, { count: count.toString() });
  },
  [TranslationNamespace.Creations],
);

/**
 * Error dialog shown when only some updates within a bulk operation succeeded.
 */
export function openPartialFailuresDialog({ count }: { count: number }) {
  openDialog({
    content: (
      <ErrorDialogContent
        titleKey={COMMON_TITLE_KEY}
        body={<PartialFailuresBody count={count} />}
        actionKey={COMMON_ACTION_KEY}
        onClose={closeDialog}
      />
    ),
  });
}

/**
 * Error dialog shown when the user has selected too many products for a bulk operation.
 */
export function openTooManyProductsToUpdateDialog() {
  openDialog({
    content: (
      <ErrorDialogContent
        titleKey={COMMON_TITLE_KEY}
        bodyKey='Message.ErrorTooManySelectedForUpdate'
        actionKey={COMMON_ACTION_KEY}
        onClose={closeDialog}
      />
    ),
  });
}
