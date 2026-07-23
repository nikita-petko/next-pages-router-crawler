import { Button, makeStyles, Typography } from '@rbx/ui';
import { useCallback, useEffect, useState } from 'react';

import { EventName, unifiedLogger } from '@clients/unifiedLogger';
import { EntityType } from '@constants/entity';
import { TranslationNamespace } from '@constants/localization';
import { useAuthenticatedUser } from '@hooks/useAuthenticatedUser';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import getLivePreviewModalConfig from '@modules/app/utility-components/livePreviewModal';
import {
  getGameThumbnailByUniverseId,
  getImageThumbnail,
} from '@modules/clients/thumbnails/thumbnailsClient';
import {
  AdCreativeFormGroup,
  AdNameFormGroup,
  GameThumbnailComponent,
} from '@modules/creation/components/createAdConfigurationForm/createAdConfigurationForm';
import UploadedImageReviewComponentDynamic from '@modules/creation/components/uploadedImageReviewComponentDynamic';
import UploadedVideoReviewComponentDynamic from '@modules/creation/components/uploadedVideoReviewComponentDynamic';
import { editAdComponentModel } from '@modules/management/models/editAdComponentModel';
import VideoAssetComponent from '@modules/miscellaneous/video/videoAssetComponent';
import { getUniverses } from '@services/ads/getUniversesService';
import { useModalStore } from '@stores/modalStoreProvider';
import { AdFormatType } from '@type/ad';
import { GetEndUserDisplayCampaignObjective } from '@utils/campaignBuilder';
import { ConvertEntityTypeEnumToString } from '@utils/enumToString';
import { CaptureException } from '@utils/error';
import { SetErrorModalImpersonationConfig } from '@utils/errorModalImpersonation';
import { GetEndUserAdAssetStatus } from '@utils/fileUpload';
import { TODOFIXANY } from 'app/shared/types';

interface EditAdSetComponentProps {
  disableEdit: boolean;
  formikInfo: TODOFIXANY;
  onCancelClick: TODOFIXANY;
}

export const EditAdComponent = ({
  disableEdit,
  formikInfo,
  onCancelClick,
}: EditAdSetComponentProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const [fetchedThumbnailUrl, setFetchedThumbnailUrl] = useState<string>();
  const {
    classes: { buttonContainer, cancelButton, mainContainer, titleContainer, warningContainer },
  } = makeStyles()(() => ({
    buttonContainer: {
      display: 'flex',
      justifyContent: 'flex-end',
    },

    cancelButton: {
      marginRight: 16,
    },

    mainContainer: {
      margin: 32,
    },

    titleContainer: {
      margin: '32px 0px',
    },

    warningContainer: {
      marginBottom: 32,
    },
  }))();

  const [initialAdName, setInitialAdName] = useState('');
  const [tileThumbnailUrl, setTileThumbnailUrl] = useState('');
  const [useThumbnailForVideo, setUseThumbnailForVideo] = useState(false);
  const isImpersonating = document.cookie.includes('ad-account-imp-info');

  const fetchAssetThumbnailInfo = useCallback(async () => {
    try {
      const thumbnailResponse = await getImageThumbnail(
        formikInfo.values.adAssetId || formikInfo.values.adVideoAssetId,
      );
      const { imageUrl } = thumbnailResponse.data[0];
      return imageUrl;
    } catch (e) {
      throw new Error(
        `error getting thumbnail url for assetId ${
          formikInfo.values.assetId || formikInfo.values.adVideoAssetId
        }`,
      );
    }
  }, []);

  const fetchGameThumbnailInfo = useCallback(async () => {
    try {
      const thumbnailResponse = await getGameThumbnailByUniverseId(
        formikInfo.values.adDestinationUniverseId,
      );
      const { imageUrl } = thumbnailResponse.data[0];
      return imageUrl;
    } catch (e) {
      throw new Error(
        `error getting thumbnail url for universeId ${formikInfo.values.adDestinationUniverseId}`,
      );
    }
  }, []);

  const fetchUniverseName = useCallback(async (universeId: number) => {
    try {
      const universeResponse = await getUniverses([universeId]);
      const { name } = universeResponse.data[0];
      return name;
    } catch (e) {
      throw new Error(`error getting universe name for for universeId ${universeId}`);
    }
  }, []);

  const { setModalConfigData, setModalOpen } = useModalStore();
  const authenticatedUser = useAuthenticatedUser();
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

  useEffect(() => {
    setInitialAdName(formikInfo.values.adName);
    formikInfo.setFieldValue(editAdComponentModel.formField.adName.name, formikInfo.values.adName);
    formikInfo.setFieldValue(editAdComponentModel.formField.adType.name, formikInfo.values.adType);
    formikInfo.setFieldValue(
      editAdComponentModel.formField.adAssetId.name,
      formikInfo.values.adAssetId,
    );
    formikInfo.setFieldValue(
      editAdComponentModel.formField.adVideoAssetId.name,
      formikInfo.values.adVideoAssetId,
    );
    formikInfo.setFieldValue(
      editAdComponentModel.formField.adAssetWidth.name,
      formikInfo.values.adAssetWidth,
    );
    formikInfo.setFieldValue(
      editAdComponentModel.formField.adAssetHeight.name,
      formikInfo.values.adAssetHeight,
    );
    formikInfo.setFieldValue(
      editAdComponentModel.formField.adPortalDestinationText.name,
      formikInfo.values.adPortalDestinationText,
    );
    formikInfo.setFieldValue(
      editAdComponentModel.formField.adPortalDestinationPlaceId.name,
      formikInfo.values.adPortalDestinationPlaceId,
    );
    formikInfo.setFieldValue(
      editAdComponentModel.formField.adPortalDestinationPlaceId.name,
      formikInfo.values.adPortalDestinationPlaceId,
    );

    formikInfo.setFieldValue(
      editAdComponentModel.formField.adDestinationUniverseId.name,
      formikInfo.values.adDestinationUniverseId,
    );

    if (
      formikInfo.values.adType === AdFormatType.TILE ||
      formikInfo.values.adType === AdFormatType.SEARCH
    ) {
      fetchGameThumbnailInfo()
        .then((thumbnailUrl: string) => {
          setTileThumbnailUrl(thumbnailUrl);
        })
        .catch(() => {
          CaptureException('Could not fetch the image url');
        });
      fetchUniverseName(formikInfo.values.adDestinationUniverseId)
        .then((name: string) => {
          formikInfo.setFieldValue(
            editAdComponentModel.formField.adPortalDestinationText.name,
            name,
          );
        })
        .catch(() => {
          CaptureException('Could not fetch the universe name');
        });
    } else {
      fetchAssetThumbnailInfo()
        .then((thumbnailUrl: string) => {
          setFetchedThumbnailUrl(thumbnailUrl);
        })
        .catch(() => {
          // TODO: show error model
          CaptureException('Could not fetch the image url');
        });
    }
  }, []);

  const isAdInfoUnchanged = () => {
    return formikInfo.values.adName === initialAdName;
  };

  let imagePreviewComponent = null;
  const isTile = formikInfo.values.adType === AdFormatType.TILE;
  const isVideo = formikInfo.values.adType === AdFormatType.VIDEO;
  const isSearch = formikInfo.values.adType === AdFormatType.SEARCH;

  if (isTile || isSearch) {
    imagePreviewComponent = (
      <GameThumbnailComponent
        adType={formikInfo.values.adType}
        experienceName={formikInfo.values.adPortalDestinationText}
        hideImage={false}
        imageUrl={tileThumbnailUrl || ''}
        summaryView={false}
      />
    );
  } else if (isVideo) {
    imagePreviewComponent = (
      <>
        {useThumbnailForVideo && (
          <UploadedVideoReviewComponentDynamic
            adAssetStatus={GetEndUserAdAssetStatus(formikInfo.values.compositeReviewDecision)}
            adFormat={translate(
              GetEndUserDisplayCampaignObjective(formikInfo.values.campaignObjective),
            )}
            disableInputs
            livePreviewCb={livePreview}
            uploadedFormat='image/png'
            uploadedVideoObjectUrl={fetchedThumbnailUrl}
          />
        )}
        {!useThumbnailForVideo && (
          <UploadedVideoReviewComponentDynamic
            adAssetStatus={GetEndUserAdAssetStatus(formikInfo.values.compositeReviewDecision)}
            adFormat={translate(
              GetEndUserDisplayCampaignObjective(formikInfo.values.campaignObjective),
            )}
            disableInputs
            livePreviewCb={livePreview}
            overrideThumbVideoPlayer={
              <VideoAssetComponent
                compositeReviewDecision={formikInfo.values.compositeReviewDecision}
                setUseThumbnailForVideo={setUseThumbnailForVideo}
                videoAssetId={formikInfo.values.adVideoAssetId}
              />
            }
            uploadedVideoObjectUrl={fetchedThumbnailUrl}
          />
        )}
      </>
    );
  } else {
    imagePreviewComponent = (
      <UploadedImageReviewComponentDynamic
        adAssetStatus={GetEndUserAdAssetStatus(formikInfo.values.compositeReviewDecision)}
        adFormat={translate(
          GetEndUserDisplayCampaignObjective(formikInfo.values.campaignObjective),
        )}
        disableInputs
        livePreviewCb={livePreview}
        overlayImageStr={fetchedThumbnailUrl}
        replaceImageCb
      />
    );
  }

  return (
    <div className={mainContainer}>
      <div className={buttonContainer}>
        <Button className={cancelButton} color='primary' onClick={onCancelClick} variant='outlined'>
          Cancel
        </Button>
        <Button
          color='primaryBrand'
          data-testid='edit-save-button'
          disabled={!formikInfo.isValid || disableEdit || isAdInfoUnchanged()}
          onClick={(e) => {
            e.preventDefault();
            formikInfo.handleSubmit(e);
            unifiedLogger.logClickEvent({
              eventName: EventName.SubmitEditButtonClicked,
              parameters: {
                entityType: ConvertEntityTypeEnumToString(EntityType.ENTITY_TYPE_AD),
              },
            });
          }}
          variant='contained'>
          Save
        </Button>
      </div>
      <div className={titleContainer}>
        <Typography variant='h2'>
          {disableEdit ? '' : 'Edit '} {initialAdName}
        </Typography>
      </div>
      {disableEdit && (
        <div className={warningContainer}>
          <Typography color='warning' variant='body2'>
            Cannot edit completed ad.
          </Typography>
        </div>
      )}
      <AdCreativeFormGroup
        addingToExistingAdSet={false}
        disableInputs
        formikInfo={formikInfo}
        isEditAd
      />
      {imagePreviewComponent}
      <AdNameFormGroup disableInputs={disableEdit} formikInfo={formikInfo} />
    </div>
  );
};
