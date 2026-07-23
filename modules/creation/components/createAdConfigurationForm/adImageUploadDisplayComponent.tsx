import { Button, FormHelperText, makeStyles, ReportProblemOutlinedIcon, Typography } from '@rbx/ui';
import { noop } from 'lodash';
import { useContext, useEffect, useRef, useState } from 'react';

import assetsUploadApiClient, { AssetCreationRequest, AssetType } from '@clients/assetsUpload';
import { ContextName, EventName, unifiedLogger } from '@clients/unifiedLogger';
import CustomCircularProgress from '@components/common/CustomCircularProgress';
import { TranslationNamespace } from '@constants/localization';
import { useAuthenticatedUser } from '@hooks/useAuthenticatedUser';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import getLivePreviewModalConfig from '@modules/app/utility-components/livePreviewModal';
import { CreateCampaignMetadataContext } from '@modules/creation/contexts/createCampaignPageContext';
import { createCampaignWizardModel } from '@modules/creation/wizard/models/createCampaignWizard/createCampaignWizardModel';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { useModalStore } from '@stores/modalStoreProvider';
import { ServerAdAssetCompositeReviewDecisionType } from '@type/ad';
import { CalculateAspectRatio } from '@utils/assets';
import { GetEndUserDisplayCampaignObjective } from '@utils/campaignBuilder';
import { CaptureException } from '@utils/error';
import { SetErrorModalImpersonationConfig } from '@utils/errorModalImpersonation';
import { GetEndUserAdAssetStatus } from '@utils/fileUpload';
import { GetLocalStorage, StorageKeys } from '@utils/localStorage';
import { TODOFIXANY } from 'app/shared/types';
import { PollWithRetryLimitAndCancelCallback } from 'app/util/fns';

import UploadedImageReviewComponentDynamic from '../uploadedImageReviewComponentDynamic';

const AdImageUploadDisplayComponent = ({
  disableInputs,
  formikInfo,
  isEditAd,
}: {
  disableInputs: boolean;
  formikInfo: TODOFIXANY;
  isEditAd: boolean;
}) => {
  const {
    classes: {
      configureAdRow,
      customHelperText,
      hidden,
      imageUploadError,
      imageUploadErrorContainer,
      imageUploadErrorIcon,
      imageUploadHelperText,
      progressContainer,
      uploadContainer,
      uploadSubtitle,
    },
  } = makeStyles()(() => ({
    configureAdRow: {
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'center',
      marginBottom: 24,
      marginTop: 24,
      width: '100%',
    },

    customHelperText: {
      marginTop: '3px !important',
    },

    hidden: {
      display: 'none',
      visibility: 'hidden',
    },

    imageUploadError: {
      alignContent: 'center',
      display: 'flex',
    },

    imageUploadErrorContainer: {
      marginBottom: 8,
    },

    imageUploadErrorIcon: {
      marginRight: 8,
    },

    imageUploadHelperText: {
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'center',
      marginTop: 16,
      width: '100%',
    },

    progressContainer: {
      alignItems: 'center',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      height: '100%',
      justifyContent: 'center',
      width: '100%',
    },

    uploadContainer: {
      alignContent: 'flex-start',
      alignItems: 'center',
      borderColor: 'white',
      borderStyle: 'dashed',
      borderWidth: 1,
      display: 'flex',
      flexWrap: 'wrap',
      height: 184,
      justifyContent: 'center',
      marginTop: 24,
      width: '100%',
    },

    uploadSubtitle: {
      marginTop: 16,
    },
  }))();
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { setUploadedImage, uploadedImage } = useContext(CreateCampaignMetadataContext);
  const { adAccountId = GetLocalStorage(StorageKeys.AD_ACCOUNT_ID) } = useAppStore(
    (state: AppStoreType) => state.appData,
  );

  const [imageUploading, setImageUploading] = useState(false);
  const [cancelImageUpload, setCancelImageUpload] = useState<TODOFIXANY>({});
  const [assetReplaced, setAssetReplaced] = useState(false);

  const authenticatedUser = useAuthenticatedUser();
  const inputFile = useRef(null);

  // TODO @dlouie: eventually need a more scalable way to make alternate flows for impersonation
  const isImpersonating = document.cookie.includes('ad-account-imp-info');

  const clearPreviouslyUploadedInfo = () => {
    setUploadedImage(undefined);
    formikInfo.setFieldValue(createCampaignWizardModel.formField.adAssetWidth.name, undefined);
    formikInfo.setFieldValue(createCampaignWizardModel.formField.adAssetHeight.name, undefined);
    formikInfo.setFieldValue(createCampaignWizardModel.formField.adAssetId.name, undefined);
    if (inputFile && inputFile.current) {
      // @ts-ignore */
      inputFile.current.value = null;
    }
  };

  const { setModalConfigData, setModalOpen } = useModalStore();
  const userName = authenticatedUser?.name ?? '';
  const livePreview = async () => {
    if (isImpersonating) {
      SetErrorModalImpersonationConfig(setModalOpen, setModalConfigData);
      return;
    }

    setModalOpen(true);
    setModalConfigData(
      getLivePreviewModalConfig({
        formik: formikInfo,
        setModalOpen,
        userName,
      }),
    );
  };

  const uploadFile = () => {
    if (isImpersonating) {
      SetErrorModalImpersonationConfig(setModalOpen, setModalConfigData);
      return;
    }

    if (imageUploading) {
      return;
    }

    if (inputFile && inputFile.current) {
      clearPreviouslyUploadedInfo();

      // @ts-ignore */
      inputFile.current.click();
    }
  };

  const onFileUpload = (e: TODOFIXANY) => {
    if (!authenticatedUser && !authenticatedUser!.id) {
      // TODO: Show an error modal prompting the user to login in a new tab
      return;
    }

    const image = e.target.files ? e.target.files[0] : e.dataTransfer.files[0];

    if (image === undefined) {
      return;
    }

    unifiedLogger.logImpressionEvent({
      eventName: EventName.ImageUploadClicked,
      parameters: { adAccountId },
    });

    image.arrayBuffer().then((arrayBuffer: TODOFIXANY) => {
      const blob = new Blob([new Uint8Array(arrayBuffer)], { type: image.type });

      const uploadAssetMetaData: AssetCreationRequest = {
        assetType: AssetType.Image,
        creationContext: {
          creator: { userId: authenticatedUser!.id },
        },
        description: '',
        displayName: 'AdsCreationAndManagementImage',
      };

      if (image.size > 30 * 1024 * 1024) {
        formikInfo.setErrors({
          [createCampaignWizardModel.formField.adAssetId.name]:
            'Image format does not meet size requirements. Please upload a smaller one.',
        });
        return;
      }

      const img = document.createElement('img');
      img.style.position = 'fixed';
      img.style.visibility = 'hidden';
      img.style.top = '-100%';

      const fileReader = new FileReader();

      fileReader.onload = function (ev) {
        img.src = ev!.target!.result as string;
        img.onload = () => {
          const [widthRatio, heightRatio] = CalculateAspectRatio(
            img.naturalWidth / img.naturalHeight,
            10,
          );

          img.remove();

          if (
            image?.type?.toLowerCase() !== 'image/jpeg' &&
            image?.type?.toLowerCase() !== 'image/jpg' &&
            image?.type?.toLowerCase() !== 'image/png'
          ) {
            formikInfo.setErrors({
              [createCampaignWizardModel.formField.adAssetId.name]:
                'Image format does not meet the given requirements. Please upload a new one.',
            });
            return;
          }

          if (img.naturalWidth <= 500) {
            formikInfo.setErrors({
              [createCampaignWizardModel.formField.adAssetId.name]:
                'Image format does not meet width requirements. Please upload a new one.',
            });
            return;
          }

          // AMS allows up to 2% buffer in image aspect ratio.
          const rationBuffer = 100 / (widthRatio / heightRatio);
          if (rationBuffer <= 58.25 && rationBuffer >= 54.25) {
            setImageUploading(true);
            setUploadedImage(undefined);
            // @ts-ignore
            assetsUploadApiClient?.assetsUploadApi?.middleware?.[1]?.storeCRSFToken?.(undefined); // Clear out XSRF token for fresh upload
            // @ts-ignore
            assetsUploadApiClient
              .createAsset(uploadAssetMetaData, blob)
              .then((assetCreationOperationId) => {
                if (assetCreationOperationId) {
                  const imageAssetIdResolved = async () => {
                    return assetsUploadApiClient.getAssetIdFromOperationStatus(
                      assetCreationOperationId,
                    );
                  };

                  const imageAssetResolvedSuccess = async (assetId: number) => {
                    formikInfo.setFieldValue(
                      createCampaignWizardModel.formField.adAssetWidth.name,
                      img.naturalWidth,
                    );
                    formikInfo.setFieldValue(
                      createCampaignWizardModel.formField.adAssetHeight.name,
                      img.naturalHeight,
                    );
                    formikInfo.setFieldValue(
                      createCampaignWizardModel.formField.adAssetId.name,
                      assetId,
                    );
                    formikInfo.setFieldValue(
                      createCampaignWizardModel.formField.compositeReviewDecision.name,
                      ServerAdAssetCompositeReviewDecisionType.PENDING_REVIEW,
                    );

                    setImageUploading(false);
                    setUploadedImage(image);
                    unifiedLogger.logImpressionEvent({
                      eventName: EventName.ImageUploadSuccess,
                      parameters: { adAccountId },
                    });
                  };

                  const cancelPolling = PollWithRetryLimitAndCancelCallback({
                    fn: imageAssetIdResolved,
                    interval: 750,
                    maxRetries: 20,
                    onMaxRetriesReached: () => {
                      unifiedLogger.logImpressionEvent({
                        eventName: EventName.ImageUploadFailure,
                        parameters: {
                          adAccountId,
                          ctx: ContextName.ImageUploadMaxRetriesReachedAndErrorShown,
                        },
                      });
                      setImageUploading(false);
                      formikInfo.setErrors({
                        [createCampaignWizardModel.formField.adAssetId.name]:
                          'Error uploading image - please try again',
                      });
                    },
                    successCb: imageAssetResolvedSuccess,
                  });

                  const cancelCurrentImageUpload = () => {
                    unifiedLogger.logClickEvent({
                      eventName: EventName.CancelImageUpload,
                      parameters: { adAccountId },
                    });
                    cancelPolling();
                    setTimeout(() => {
                      setImageUploading(false);
                    });
                  };

                  setCancelImageUpload({ cancelCb: cancelCurrentImageUpload });
                } else {
                  throw new Error('No Image Status Url Returned');
                }
              })
              .catch((err) => {
                setImageUploading(false);
                CaptureException(err as Error);
                formikInfo.setErrors({
                  [createCampaignWizardModel.formField.adAssetId.name]:
                    'Error uploading image - please try again later',
                });
                unifiedLogger.logImpressionEvent({
                  eventName: EventName.ImageUploadFailure,
                  parameters: { adAccountId },
                });
              });
          } else {
            formikInfo.setErrors({
              [createCampaignWizardModel.formField.adAssetId.name]:
                'Image format does not meet aspect ratio requirements. Please upload a new one.',
            });
          }
        };
        document.body.append(img);
      };

      fileReader.readAsDataURL(image);
    });
  };

  // handle drag events
  const handleDrag = function (e: TODOFIXANY) {
    if (imageUploading) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = function (e: TODOFIXANY) {
    if (imageUploading) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e);
    }
  };

  useEffect(() => {
    if (isImpersonating) {
      (async () => {
        const response = await fetch(
          `${process.env.assetPathPrefix}/common/impersonation_asset_image.png`,
        );
        const arrayBuffer = await response.arrayBuffer();
        const blob = new Blob([new Uint8Array(arrayBuffer)], { type: 'image/png' });

        formikInfo.setFieldValue(createCampaignWizardModel.formField.adAssetWidth.name, 800);
        formikInfo.setFieldValue(createCampaignWizardModel.formField.adAssetHeight.name, 600);
        formikInfo.setFieldValue(
          createCampaignWizardModel.formField.adAssetId.name,
          'simulated-asset-id',
        );

        setImageUploading(false);
        setUploadedImage(blob);
      })();
    }
  }, []);

  return (
    <div>
      {Boolean(formikInfo.errors.adAssetId) && (
        <div className={imageUploadErrorContainer}>
          <Typography classes={{ root: imageUploadError }} color='error' variant='h6'>
            <ReportProblemOutlinedIcon classes={{ root: imageUploadErrorIcon }} />{' '}
            {formikInfo.errors.adAssetId}
          </Typography>
        </div>
      )}
      {Boolean(uploadedImage) && (
        <div>
          <UploadedImageReviewComponentDynamic
            adAssetStatus={GetEndUserAdAssetStatus(formikInfo.values.compositeReviewDecision)}
            adFormat={translate(
              GetEndUserDisplayCampaignObjective(formikInfo.values.campaignObjective),
            )}
            assetReplaced={assetReplaced}
            disableInputs={disableInputs}
            livePreviewCb={livePreview}
            overlayImageStr={
              uploadedImage instanceof Blob ? URL.createObjectURL(uploadedImage) : uploadedImage
            }
            replaceImageCb={() => {
              uploadFile();
              setAssetReplaced(true);
            }}
            uploadedFormat={uploadedImage && (uploadedImage['type'] as string)}
          />

          <div className={uploadSubtitle}>
            <Typography color='primary' variant='subtitle2'>
              Please allow up to 24 hours for review.
            </Typography>
          </div>
        </div>
      )}
      <div className={uploadedImage || isEditAd ? hidden : ''}>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}>
          <label htmlFor='input-file-upload' id='label-file-upload'>
            <input
              accept='image/png, image/jpeg'
              data-testid='file-upload-input'
              disabled={imageUploading}
              hidden
              id='input-file-upload'
              onChange={onFileUpload}
              ref={inputFile}
              style={{ display: 'none' }}
              type='file'
            />
            <div
              className={uploadContainer}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onKeyPress={noop}
              role='none'>
              {Boolean(imageUploading) && (
                <div className={progressContainer}>
                  <CustomCircularProgress />
                  Uploading Image...
                  <Button
                    color='primaryBrand'
                    onClick={() => {
                      if (cancelImageUpload.cancelCb) {
                        cancelImageUpload.cancelCb();
                      }
                    }}
                    variant='outlined'>
                    Cancel
                  </Button>
                </div>
              )}
              {!imageUploading && (
                <div>
                  <div className={configureAdRow}>
                    <Button
                      color='primaryBrand'
                      disabled={disableInputs}
                      id='fileSelect'
                      onClick={uploadFile}
                      variant='outlined'>
                      Upload Media
                    </Button>
                  </div>
                  <div className={imageUploadHelperText}>
                    <Typography color='secondary' variant='smallLabel2'>
                      Drag and drop media here to upload
                    </Typography>
                  </div>
                  <div className={imageUploadHelperText}>
                    <Typography color='secondary' variant='smallLabel1'>
                      Maximum 1 file at a time
                    </Typography>
                  </div>
                </div>
              )}
            </div>
          </label>
        </div>
        <FormHelperText classes={{ root: customHelperText }}>
          <Typography variant='smallLabel2'>Format: </Typography>
          <Typography variant='smallLabel1'>PNG, JPEG; </Typography>
          <Typography variant='smallLabel2'>Aspect Ratio: </Typography>
          <Typography variant='smallLabel1'>Horizontal 16:9; </Typography>
          <Typography variant='smallLabel2'>Min Pixel Width: </Typography>
          <Typography variant='smallLabel1'>500px; </Typography>
          <Typography variant='smallLabel2'>Max File Size: </Typography>
          <Typography variant='smallLabel1'>30 MB</Typography>
        </FormHelperText>
      </div>
    </div>
  );
};

export default AdImageUploadDisplayComponent;
