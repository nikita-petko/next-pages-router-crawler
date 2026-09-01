import type { FC } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { DialogTemplate } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

type UploadImageFailureDialogProps = {
  acceptMimeTypes: string[];
  onCancel: () => void;
  onConfirm: () => void;
};

const UploadImageFailureDialog: FC<UploadImageFailureDialogProps> = ({
  acceptMimeTypes,
  onCancel,
  onConfirm,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());
  return (
    <DialogTemplate
      title={translate(
        translationKey('Title.UploadImageFailed', TranslationNamespace.PlaceThumbnails),
      )}
      content={translate(
        translationKey('Description.UploadImageFailed', TranslationNamespace.PlaceThumbnails),
        {
          formats: acceptMimeTypes.map((mime) => `*.${mime.split('/')[1]}`).join(', '),
        },
      )}
      confirmText={translate(translationKey('Action.UploadImage', TranslationNamespace.Controls))}
      cancelText={translate(translationKey('Action.Cancel', TranslationNamespace.Controls))}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};

export default withTranslation(UploadImageFailureDialog, [
  TranslationNamespace.Controls,
  TranslationNamespace.PlaceThumbnails,
]);
