import { memo } from 'react';
import type { Control } from 'react-hook-form';
import { useController } from 'react-hook-form';
import { VisuallyHidden } from '@rbx/foundation-ui';
import { useTranslationWithNamespace } from '@rbx/intl';
import { ReturnPolicy, ThumbnailTypes } from '@rbx/thumbnails';
import ThumbnailImageUploader from '@modules/miscellaneous/components/uploaders/components/ThumbnailImageUploader';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { configurePassMetadataSchema } from './schemas';
import type { ConfigurePassMetadataFormValues } from './types';

export type PassImageUploaderProps = {
  control: Control<ConfigurePassMetadataFormValues>;
  imageAssetId?: number;
  onChange: (file: File | null) => void;
  changeLabel?: string;
  disabled?: boolean;
  className?: string;
};

const MAX_IMAGE_SIZE_MB = 5;
const ARIA_DESCRIPTION_ID = 'thumbnail-aria-description';

export const PassImageUploader = memo(
  ({
    control,
    imageAssetId,
    onChange,
    changeLabel,
    disabled,
    className,
  }: PassImageUploaderProps) => {
    const { translate } = useTranslationWithNamespace(TranslationNamespace.ConfigureItem);
    const { field } = useController({
      control,
      name: 'file',
      rules: configurePassMetadataSchema.file,
      disabled,
    });

    return (
      <div className={className}>
        <ThumbnailImageUploader
          targetReturnPolicy={ReturnPolicy.PlaceHolder}
          targetId={imageAssetId}
          targetType={ThumbnailTypes.assetThumbnail}
          changeText={changeLabel}
          imageAltText={translate('Label.ItemImage')}
          ariaDescribedBy={ARIA_DESCRIPTION_ID}
          onChange={onChange}
          imageType={['jpg', 'png', 'bmp']}
          maxImageSizeMB={MAX_IMAGE_SIZE_MB}
          removeButtonEnabled={false}
          disabled={field.disabled}
        />
        <VisuallyHidden id={ARIA_DESCRIPTION_ID} aria-live='polite'>
          {field.value?.name
            ? translate('Label.SelectedFile', { fileName: field.value.name })
            : translate('Label.NoImageUploaded')}
        </VisuallyHidden>
      </div>
    );
  },
);
PassImageUploader.displayName = 'PassImageUploader';
