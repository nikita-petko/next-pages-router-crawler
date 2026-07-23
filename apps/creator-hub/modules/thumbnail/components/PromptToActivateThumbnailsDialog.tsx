import type { FC } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { DialogTemplate } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

type PromptToActivateThumbnailsDialogProps = {
  onPrimaryButtonClick: () => void;
  onSecondaryButtonClick: () => void;
};

const PromptToActivateThumbnailsDialog: FC<PromptToActivateThumbnailsDialogProps> = ({
  onPrimaryButtonClick,
  onSecondaryButtonClick,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());
  return (
    <DialogTemplate
      id='prompt-to-activate-thumbnails-dialog'
      variant='alert'
      title={translate(
        translationKey('Title.PromptToActivateThumbnails', TranslationNamespace.PlaceThumbnails),
      )}
      content={translate(
        translationKey(
          'Description.PromptToActivateThumbnails',
          TranslationNamespace.PlaceThumbnails,
        ),
      )}
      cancelText={translate(
        translationKey(
          'Action.CancelPromptToActivateThumbnails',
          TranslationNamespace.PlaceThumbnails,
        ),
      )}
      confirmText={translate(
        translationKey('Action.PromptToActivateThumbnails', TranslationNamespace.PlaceThumbnails),
      )}
      onConfirm={onPrimaryButtonClick}
      onCancel={onSecondaryButtonClick}
    />
  );
};

export default withTranslation(PromptToActivateThumbnailsDialog, [
  TranslationNamespace.PlaceThumbnails,
]);
