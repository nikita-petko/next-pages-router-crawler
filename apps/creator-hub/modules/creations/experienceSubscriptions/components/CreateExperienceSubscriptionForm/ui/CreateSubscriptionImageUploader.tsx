import { Grid } from '@rbx/ui';
import ThumbnailImageUploader from '@modules/miscellaneous/components/uploaders/components/ThumbnailImageUploader';
import { ImageDimension } from '../../../constants/CreateSubscriptionRegisterConstants';

type TCreateSubscriptionImageUploaderProps = {
  onChange: (file: File | null) => void;
};

function CreateSubscriptionImageUploader({ onChange }: TCreateSubscriptionImageUploaderProps) {
  return (
    <Grid container item direction='row'>
      <ThumbnailImageUploader
        onChange={onChange}
        imageType={['jpg', 'png', 'bmp']}
        imageDimensionWidth={ImageDimension}
        imageDimensionHeight={ImageDimension}
      />
    </Grid>
  );
}

export default CreateSubscriptionImageUploader;
