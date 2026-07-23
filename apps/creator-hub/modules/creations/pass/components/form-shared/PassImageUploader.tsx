import { memo } from 'react';
import { ThumbnailImageUploader } from '@modules/miscellaneous/common/components/uploaders';
import { ReturnPolicy, ThumbnailTypes } from '@rbx/thumbnails';
import { useTranslation } from '@rbx/intl';
import { VisuallyHidden } from '@rbx/ui';
import { Control, useController } from 'react-hook-form';
import { ConfigurePassMetadataFormValues } from './types';
import { configurePassMetadataSchema } from './schemas';

export type PassImageUploaderProps = {
  control: Control<ConfigurePassMetadataFormValues>;
  imageAssetId?: number;
  onChange: (file: File | null) => void;
  changeLabel?: string;
  className?: string;
};

export const PassImageUploader = memo(
  ({ control, imageAssetId, onChange, changeLabel, className }: PassImageUploaderProps) => {
    const { translate } = useTranslation();
    const { field } = useController({
      control,
      name: 'file',
      rules: configurePassMetadataSchema.file,
    });

    const file = field.value;

    return (
      <div className={className}>
        <ThumbnailImageUploader
          targetReturnPolicy={ReturnPolicy.PlaceHolder}
          targetId={imageAssetId}
          targetType={ThumbnailTypes.assetThumbnail}
          imageAltText={translate('Label.PassImage')}
          changeText={changeLabel}
          ariaDescribedBy='thumbnail-aria-description'
          onChange={onChange}
          imageType={['jpg', 'png', 'bmp']}
          removeButtonEnabled={false}
        />
        <VisuallyHidden id='thumbnail-aria-description' aria-live='polite'>
          {file?.name
            ? translate('Label.SelectedFile', { fileName: file?.name ?? '' })
            : translate('Label.NoImageUploaded')}
        </VisuallyHidden>
      </div>
    );
  },
);
PassImageUploader.displayName = 'PassImageUploader';
