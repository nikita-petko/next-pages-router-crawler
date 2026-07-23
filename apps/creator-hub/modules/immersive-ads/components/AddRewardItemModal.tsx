import { useCallback, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  FeedbackBanner,
  Icon,
  Menu,
  MenuItem,
  ProgressCircle,
} from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Avatar, InputAdornment } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import DebouncedTextField from '@modules/charts-generic/charts/DebouncedTextField';
import { useUpdateDeveloperProduct } from '@modules/developer-products/queries/useUpdateDeveloperProduct';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import FileUploadBase from '@modules/miscellaneous/components/FileUploadBase';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useValidateAdReward from '../hooks/useValidateAdReward';
import type { RewardItem } from '../types/rewardTypes';

interface AddRewardItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (rewardItem: RewardItem) => void;
}

interface AddRewardItemFormValues {
  productId: number | string;
}

const ns = TranslationNamespace.ImmersiveAdsAnalytics;
const REWARD_IMAGE_ACCEPT_TYPES = 'image/jpg,image/jpeg,image/png,image/bmp';

interface RewardDetailsWithDefaultImage {
  productName?: string;
  imageAssetId?: number;
  isDefaultImage?: boolean;
}

const RewardAvatar = ({ imageAssetId, alt }: { imageAssetId?: number; alt: string }) => {
  if (!imageAssetId) {
    return null;
  }
  return (
    <Avatar variant='rounded' alt={alt} className='size-800'>
      <Thumbnail2d type={ThumbnailTypes.assetThumbnail} targetId={imageAssetId} alt={alt} />
    </Avatar>
  );
};

const AddRewardItemModal = ({ isOpen, onClose, onAdd }: AddRewardItemModalProps) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { id: universeId } = useUniverseResource();

  const {
    control,
    getValues,
    reset: resetForm,
  } = useForm<AddRewardItemFormValues>({
    defaultValues: { productId: '' },
    mode: 'onChange',
  });
  const [selectedItem, setSelectedItem] = useState<RewardItem | null>(null);
  const [uploadErrorKey, setUploadErrorKey] = useState<string | null>(null);
  const [hasUploadedImageForReview, setHasUploadedImageForReview] = useState(false);

  const productIdValue = useWatch({ control, name: 'productId' });
  const parsedProductId =
    typeof productIdValue === 'number' && productIdValue > 0 ? productIdValue : null;

  const validation = useValidateAdReward(selectedItem ? null : parsedProductId);
  const { isValidating, refetch: refetchValidation } = validation;
  const details: RewardDetailsWithDefaultImage | undefined = validation.data?.rewardDetails;
  const hasDefaultImage =
    validation.data?.isValidReward === true && details?.isDefaultImage === true; // TODO: validate once API is updated
  const displayDetails =
    hasUploadedImageForReview && selectedItem
      ? {
          productName: selectedItem.name,
          imageAssetId: selectedItem.imageAssetId,
        }
      : details;
  const { mutateAsync: updateDeveloperProduct, isPending: isUploadingImage } =
    useUpdateDeveloperProduct(
      { universeId, productId: parsedProductId ?? 0 },
      {
        onErrorResponse: (errorKey) => {
          setUploadErrorKey(errorKey ?? 'Error.Submit');
          return true;
        },
      },
    );
  const candidate: RewardItem | null =
    !selectedItem &&
    !isValidating &&
    validation.data?.isValidReward === true &&
    !hasDefaultImage &&
    !hasUploadedImageForReview &&
    details &&
    parsedProductId != null
      ? {
          productId: parsedProductId,
          name: details.productName ?? '',
          imageAssetId: details.imageAssetId,
        }
      : null;

  const isResolvedValid = Boolean(candidate) || Boolean(selectedItem);
  const hasValidationError =
    !selectedItem && !isValidating && parsedProductId
      ? validation.isError || validation.data?.isValidReward === false
      : false;

  const clearRewardState = useCallback(() => {
    setSelectedItem(null);
    setUploadErrorKey(null);
    setHasUploadedImageForReview(false);
  }, []);

  const resetState = useCallback(() => {
    resetForm();
    clearRewardState();
  }, [clearRewardState, resetForm]);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const handleImageChange = useCallback(
    async (file: File | null) => {
      if (!file || !parsedProductId) {
        return;
      }

      setUploadErrorKey(null);
      try {
        await updateDeveloperProduct({ imageFile: file });
        const refreshedValidation = await refetchValidation();
        const refreshedDetails = refreshedValidation.data?.rewardDetails ?? details;
        if (refreshedDetails) {
          setSelectedItem({
            productId: parsedProductId,
            name: refreshedDetails.productName ?? '',
            imageAssetId: refreshedDetails.imageAssetId,
          });
          setHasUploadedImageForReview(true);
        }
      } catch {
        // updateDeveloperProduct sets the upload error.
      }
    },
    [parsedProductId, updateDeveloperProduct, refetchValidation, details],
  );

  const handleUploadChange = useCallback(
    (files: FileList | null) => {
      void handleImageChange(files?.[0] ?? null);
    },
    [handleImageChange],
  );

  const handleAdd = useCallback(() => {
    if (!selectedItem) {
      return;
    }

    onAdd(selectedItem);
    resetState();
    onClose();
  }, [selectedItem, onAdd, resetState, onClose]);

  return (
    <Dialog
      size='Large'
      isModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
      hasCloseAffordance={false}>
      <DialogContent>
        <DialogBody>
          <div className='flex flex-col gap-large'>
            <div className='flex flex-col gap-xsmall margin-top-small'>
              <DialogTitle className='text-heading-small margin-y-none'>
                {translate(translationKey('Title.AddRewardItem', ns))}
              </DialogTitle>
              <span className='text-body-medium content-muted'>
                {translate(translationKey('Description.AddRewardItem', ns))}
              </span>
            </div>

            <div className='flex flex-col gap-small'>
              <Controller
                control={control}
                name='productId'
                rules={{
                  validate: (value) => typeof value === 'number' && value > 0,
                }}
                render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
                  <DebouncedTextField
                    {...field}
                    id='reward-item-input'
                    label={translate(translationKey('Label.DeveloperProductID', ns))}
                    fullWidth
                    size='medium'
                    error={Boolean(error) || hasValidationError}
                    disabled={isUploadingImage}
                    placeholder={translate(
                      translationKey('Placeholder.EnterDeveloperProductID', ns),
                    )}
                    onDebouncedChange={(input: string) => {
                      const nextProductId = Number(input);
                      if (
                        !Number.isNaN(nextProductId) &&
                        Number.isInteger(nextProductId) &&
                        nextProductId > 0
                      ) {
                        if (getValues('productId') === nextProductId) {
                          return;
                        }
                        clearRewardState();
                        onChange(nextProductId);
                        return;
                      }
                      clearRewardState();
                      onChange(input);
                    }}
                    value={value || ''}
                    inputProps={{ inputMode: 'numeric' }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position='end'>
                          {isValidating ? (
                            <ProgressCircle
                              size='Small'
                              variant='Indeterminate'
                              ariaLabel={translate(
                                translationKey('Label.ValidatingRewardItem', ns),
                              )}
                            />
                          ) : isResolvedValid ? (
                            <Icon name='icon-regular-check' size='Small' />
                          ) : null}
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </div>

            {(hasDefaultImage || hasUploadedImageForReview) && (
              <div className='flex flex-col gap-large'>
                <div className='flex items-stretch gap-large'>
                  <div className='flex items-center gap-small [min-width:200px] radius-medium stroke-thin stroke-default padding-small'>
                    <RewardAvatar
                      imageAssetId={displayDetails?.imageAssetId}
                      alt={displayDetails?.productName ?? ''}
                    />
                    <div className='flex flex-col min-width-0'>
                      <span className='text-body-medium content-emphasis'>
                        {displayDetails?.productName}
                      </span>
                      <span className='text-caption-medium content-muted'>{parsedProductId}</span>
                    </div>
                  </div>
                  <div className='flex flex-col gap-xsmall grow-1 min-width-0'>
                    <FileUploadBase
                      accept={REWARD_IMAGE_ACCEPT_TYPES}
                      onChange={handleUploadChange}>
                      {(onClick) => (
                        <Button
                          variant='Standard'
                          size='XSmall'
                          isDisabled={isUploadingImage}
                          isLoading={isUploadingImage}
                          onClick={onClick}>
                          {translate(translationKey('Label.Change', ns))}
                        </Button>
                      )}
                    </FileUploadBase>
                    <span className='text-caption-medium content-muted'>
                      {translate(translationKey('Description.RewardItemImageFormats', ns))}
                    </span>
                    <span className='text-caption-medium content-muted'>
                      {translate(translationKey('Description.RewardItemImageModeration', ns))}
                    </span>
                  </div>
                </div>
                {hasUploadedImageForReview ? (
                  <FeedbackBanner
                    severity='Warning'
                    variant='Emphasis'
                    layout='Inline'
                    showIcon
                    title={translate(translationKey('Warning.RewardItemImageUnderReview', ns))}
                  />
                ) : (
                  <FeedbackBanner
                    severity='Error'
                    variant='Emphasis'
                    layout='Inline'
                    showIcon
                    title={translate(translationKey('Error.RewardItemDefaultImage', ns))}
                  />
                )}
                {uploadErrorKey && (
                  <span className='text-body-medium content-system-alert'>
                    {translate(
                      translationKey(uploadErrorKey, TranslationNamespace.DeveloperProducts),
                    )}
                  </span>
                )}
              </div>
            )}

            {candidate && (
              <Menu size='Medium'>
                <MenuItem
                  className='!padding-medium'
                  value={String(candidate.productId)}
                  title={candidate.name}
                  description={String(candidate.productId)}
                  leading={
                    <RewardAvatar imageAssetId={candidate.imageAssetId} alt={candidate.name} />
                  }
                  onSelect={() => setSelectedItem(candidate)}
                />
              </Menu>
            )}

            {selectedItem && !hasUploadedImageForReview && (
              <div className='flex items-center gap-small radius-medium stroke-thin stroke-default padding-medium'>
                <RewardAvatar imageAssetId={selectedItem.imageAssetId} alt={selectedItem.name} />
                <div className='flex flex-col'>
                  <span className='text-body-medium content-emphasis'>{selectedItem.name}</span>
                  <span className='text-caption-medium content-muted'>
                    {selectedItem.productId}
                  </span>
                </div>
              </div>
            )}
          </div>
        </DialogBody>
        <DialogFooter>
          <div className='flex gap-small justify-end width-full'>
            <Button variant='Emphasis' size='Medium' isDisabled={!selectedItem} onClick={handleAdd}>
              {translate(translationKey('Label.Add', ns))}
            </Button>
            <Button variant='Standard' size='Medium' onClick={handleClose}>
              {translate(translationKey('Label.Cancel', ns))}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default withTranslation(AddRewardItemModal, [
  TranslationNamespace.ImmersiveAdsAnalytics,
  TranslationNamespace.DeveloperProducts,
]);
