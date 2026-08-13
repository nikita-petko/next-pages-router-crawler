import { memo } from 'react';
import type { Control } from 'react-hook-form';
import { useController } from 'react-hook-form';
import { VisuallyHidden } from '@rbx/foundation-ui';
import { useTranslationWithNamespace } from '@rbx/intl';
import { ReturnPolicy, ThumbnailTypes } from '@rbx/thumbnails';
import ThumbnailImageUploader from '@modules/miscellaneous/components/uploaders/components/ThumbnailImageUploader';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import type { ConfigureDeveloperProductFormV2Values } from '../../types';
import { configureDeveloperProductSchema } from './schemas';

type ProductImageUploaderProps = {
  control: Control<ConfigureDeveloperProductFormV2Values>;
  onChange: (file: File | null) => void;
  imageAssetId?: number;
  disabled?: boolean;
  className?: string;
};

const MAX_IMAGE_SIZE_MB = 5;
const ARIA_DESCRIPTION_ID = 'thumbnail-aria-description';

export const ProductImageUploader = memo(
  ({ control, onChange, imageAssetId, disabled, className }: ProductImageUploaderProps) => {
    const { translate } = useTranslationWithNamespace(TranslationNamespace.ConfigureItem);
    const { field } = useController({
      control,
      name: 'file',
      rules: configureDeveloperProductSchema.file,
      disabled,
    });

    return (
      <div className={className}>
        <ThumbnailImageUploader
          onChange={onChange}
          targetId={imageAssetId}
          targetType={ThumbnailTypes.assetThumbnail}
          targetReturnPolicy={ReturnPolicy.PlaceHolder}
          imageType={['jpg', 'png', 'bmp']}
          maxImageSizeMB={MAX_IMAGE_SIZE_MB}
          imageAltText={translate('Label.ItemImage')}
          ariaDescribedBy={ARIA_DESCRIPTION_ID}
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
ProductImageUploader.displayName = 'ProductImageUploader';
