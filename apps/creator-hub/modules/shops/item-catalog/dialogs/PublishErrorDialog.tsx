import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { closeDialog, openDialog } from '@modules/monetization-shared/dialog/actions';
import ErrorDialogContent from '@modules/monetization-shared/error-dialogs/ErrorDialogContent';

const PublishErrorBody = withTranslation(
  ({ messageKey }: { messageKey: string }) => {
    const { translate } = useTranslation();
    return translate(messageKey);
  },
  [TranslationNamespace.PersonalizedShop],
);

/**
 * Generic error dialog shown when publishing shop item edits fails. `messageKey`
 * supplies the specific body text for the error type.
 */
export function openPublishErrorDialog({ messageKey }: { messageKey: string }) {
  openDialog({
    content: (
      <ErrorDialogContent
        titleKey='Heading.ErrorOccurred'
        body={<PublishErrorBody messageKey={messageKey} />}
        actionKey='Action.Continue'
        onClose={closeDialog}
      />
    ),
  });
}
