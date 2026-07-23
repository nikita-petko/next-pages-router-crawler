import { useCallback, useContext, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import { ThumbnailTypes } from '@rbx/thumbnails';
import { Alert, AlertTitle, CircularProgress, FormHelperText, Grid, Typography } from '@rbx/ui';
import commerceApiClient from '@modules/clients/commerce';
import ThumbnailImageUploader from '@modules/miscellaneous/components/uploaders/components/ThumbnailImageUploader';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useUniverseId from '../../../../hooks/useUniverseId';
import DescriptionInput from '../input/DescriptionInput';
import NameInput from '../input/NameInput';
import type { VirtualBenefitFormType } from '../types';
import { ErrorStates } from '../types';
import VirtualBenefitContext from '../VirtualBenefitContext';

type DeveloperProductFormProps = {
  selectedCommerceProductId: string;
};

const DeveloperProductForm = ({ selectedCommerceProductId }: DeveloperProductFormProps) => {
  const { translate } = useTranslation();
  const universeId = useUniverseId();
  const { errorState, setErrorState } = useContext(VirtualBenefitContext);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const { watch, setValue } = useFormContext<VirtualBenefitFormType>();

  const getErrorMessage = useCallback(() => {
    switch (errorState) {
      case ErrorStates.ImageUploadFailed:
        return translate('Error.ImageUploadFailed');
      default:
        return '';
    }
  }, [errorState, translate]);

  const handleFileChange = useCallback(
    async (file: File | null) => {
      try {
        if (file) {
          setValue('imageAssetId', 0);
          setIsUploading(true);
          const res = await commerceApiClient.uploadDraftCommerceProductImage(
            universeId,
            selectedCommerceProductId,
            file,
          );
          setIsUploading(false);
          if (res.imageAssetId) {
            setValue('imageAssetId', res.imageAssetId);
            setErrorState(null);
          } else {
            setErrorState(ErrorStates.ImageUploadFailed);
          }
        }
      } catch {
        setErrorState(ErrorStates.ImageUploadFailed);
      }
    },
    [selectedCommerceProductId, setErrorState, setValue, universeId],
  );

  return (
    <Grid container direction='column' gap={3}>
      <Grid container item>
        <Grid item XSmall={12}>
          <Alert severity='info'>
            <AlertTitle paddingBottom={1}>
              {translate('Heading.PromotionalDeveloperProductDisclaimer')}
            </AlertTitle>
            {translate('Description.PromotionalDeveloperProductDisclaimer')}
          </Alert>
        </Grid>
      </Grid>
      <Grid container item direction='row' XSmall={12}>
        <ThumbnailImageUploader
          onChange={handleFileChange}
          changeText={translate('Action.UploadImage')}
          uploadText={translate('Action.UploadImage')}
          targetType={ThumbnailTypes.assetThumbnail}
          targetId={watch('imageAssetId')}
          imageType={['jpg', 'png', 'bmp']}
          removeButtonEnabled={false}
          infoSection2={translate('Label.DeveloperProductBenefitImage')}
        />
      </Grid>
      <Grid container item direction='column' XSmall={12} XLarge={6} gap={1.5}>
        <Grid item XSmall={12}>
          <NameInput />
        </Grid>
        <Grid item XSmall={12}>
          <DescriptionInput />
        </Grid>
      </Grid>
      <Grid item>
        {isUploading && (
          <Grid container alignItems='center' gap={1}>
            <Grid item>
              <Typography variant='body1'>{translate('Label.ImageUploading')}</Typography>
            </Grid>
            <Grid item>
              <CircularProgress size={24} />
            </Grid>
          </Grid>
        )}
        {errorState !== null && <FormHelperText error>{getErrorMessage()}</FormHelperText>}
      </Grid>
    </Grid>
  );
};

export default withTranslation(DeveloperProductForm, [TranslationNamespace.Commerce]);
