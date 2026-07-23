import type { FC } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { DialogTemplate } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

type ThumbnailsAboutToDeactiveDialogProps = {
  onPrimaryButtonClick: () => void;
  onSecondaryButtonClick: () => void;
};

const ThumbnailsAboutToDeactiveDialog: FC<ThumbnailsAboutToDeactiveDialogProps> = ({
  onPrimaryButtonClick,
  onSecondaryButtonClick,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());
  return (
    <DialogTemplate
      id='thumbnails-about-to-deactive-dialog'
      variant='alert'
      title={translate(
        translationKey('Title.ConfirmDeactiveThumbnails', TranslationNamespace.PlaceThumbnails),
      )}
      content={translate(
        translationKey(
          'Description.ConfirmDeactiveThumbnails',
          TranslationNamespace.PlaceThumbnails,
        ),
      )}
      cancelText={translate(translationKey('Action.Cancel', TranslationNamespace.Controls))}
      confirmText={translate(
        translationKey('Action.ContinueTest', TranslationNamespace.PlaceThumbnails),
      )}
      onConfirm={onPrimaryButtonClick}
      onCancel={onSecondaryButtonClick}
    />
  );
};

export default withTranslation(ThumbnailsAboutToDeactiveDialog, [
  TranslationNamespace.Controls,
  TranslationNamespace.PlaceThumbnails,
]);
