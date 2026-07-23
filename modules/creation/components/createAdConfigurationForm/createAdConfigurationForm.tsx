import { makeStyles, MenuItem, Select, TextField, Typography } from '@rbx/ui';
import { useCallback, useContext, useEffect, useState } from 'react';

import CustomCircularProgress from '@components/common/CustomCircularProgress';
import { CampaignObjectiveType } from '@constants/campaignBuilder';
import { getAdSet, getCampaignV2, getFilteredAds } from '@modules/clients/ads/adsClient';
import { BillableViewDurationType, Universe } from '@modules/clients/ads/adsClientTypes';
import {
  convertPaymentTypeServerToClient,
  getEndUserAdSetAgeBucketTargeting,
  getEndUserAdSetAgeTargeting,
  getEndUserAdSetAuctionType,
  getEndUserAdSetDeviceTargeting,
  getEndUserAdSetExperienceTypesContainer,
  getEndUserAdSetGenderTargeting,
  getEndUserAdSetLanguageTargeting,
  getEndUserAdSetRegionAndCountryTargeting,
  mapServerAdTypeToFormik,
  mapServerBidTypeToFormik,
  microUsdToUsd,
  ServerToClient,
} from '@modules/clients/ads/serverClientTransformationUtilities';
import { getGameThumbnailByPlaceId } from '@modules/clients/thumbnails/thumbnailsClient';
import {
  AutocompleteOption,
  convertServerUniverseToAutocompletOption,
  SelectUniverseAutocomplete,
} from '@modules/creation/components/createAdConfigurationForm/selectUniverseAutocomplete';
import { CreateCampaignMetadataContext } from '@modules/creation/contexts/createCampaignPageContext';
import { createCampaignWizardModel } from '@modules/creation/wizard/models/createCampaignWizard/createCampaignWizardModel';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { useModalStore } from '@stores/modalStoreProvider';
import { AdFormatType } from '@type/ad';
import { AdSetBidType } from '@type/adSet';
import { UniverseShapeType } from '@type/universe';
import { CaptureException } from '@utils/error';
import { GetLocalStorage, StorageKeys } from '@utils/localStorage';
import { TODOFIXANY } from 'app/shared/types';

import {
  getAdSetBidTypeFromCampaignTypeAndPaidAccessSelection,
  handleAdSetPaidAccessChange,
  handleAdSetRestrictedMaturityChange,
  languagesEnabled,
  UniverseToggleConfigurationValuesType,
} from '../createAdSetConfigurationForm';
import { InputWrapperWithRightAlignedHelperText } from '../inputWrapperWithRightAlignedHelperText';
import UploadedSearchReviewComponentDynamic from '../uploadedSearchReviewComponentDynamic';
import UploadedTileReviewComponentDynamic from '../uploadedTileReviewComponentDynamic';
import AdImageUploadDisplayComponent from './adImageUploadDisplayComponent';
import AdVideoUploadDisplayComponent from './adVideoUploadDisplayComponent';

interface CreateAdConfigurationFormProps {
  adSetToPopulate?: string;
  campaignToPopulate?: string;
  disableInputs: boolean;
  formikInfo: TODOFIXANY;
}

export const getAdFormatFromCampaignType = (campaignObjective: CampaignObjectiveType) => {
  let adFormat;

  switch (campaignObjective) {
    case CampaignObjectiveType.AWARENESS:
      adFormat = AdFormatType.DISPLAY;
      break;
    case CampaignObjectiveType.VISITS:
      adFormat = AdFormatType.PORTAL;
      break;
    default:
      adFormat = AdFormatType.UNDEFINED;
  }

  return adFormat;
};

export const GameThumbnailComponent = ({
  adType,
  experienceName,
  hideImage = false,
  imageUrl,
  summaryView = false,
}: {
  adType: AdFormatType;
  experienceName?: string;
  hideImage: boolean;
  imageUrl: string;
  summaryView: boolean;
}) => {
  if (hideImage) {
    return <div />;
  }
  const {
    classes: {
      placeholderImageContainer,
      placeholderText,
      summaryViewContainer,
      tileImageContainer,
    },
  } = makeStyles()(() => ({
    placeholderImageContainer: {
      alignItems: 'center',
      background: '#1D1D1D',
      border: '0.845px dashed var(--secondary-states-outlined-resting-border, #989898)',
      borderRadius: 4,
      display: 'flex',
      height: 210,
      justifyContent: 'center',
      width: 210,
    },

    placeholderText: {
      width: 100,
    },

    summaryViewContainer: {
      marginTop: 14,
    },

    tileImageContainer: {
      marginBottom: 48,
      marginTop: 48,
    },
  }))();

  const reviewComponent =
    adType === AdFormatType.TILE ? (
      <UploadedTileReviewComponentDynamic
        experienceName={experienceName}
        overlayImageStr={imageUrl}
        summaryView={summaryView}
      />
    ) : (
      <UploadedSearchReviewComponentDynamic overlayImageStr={imageUrl} summaryView={summaryView} />
    );

  return (
    <div className={summaryView ? summaryViewContainer : tileImageContainer}>
      {imageUrl ? (
        reviewComponent
      ) : (
        <div className={placeholderImageContainer}>
          <Typography align='center' className={placeholderText} variant='smallLabel2'>
            Your Experience Image
          </Typography>
        </div>
      )}
      {adType === AdFormatType.TILE && (
        <Typography color='warning' variant='smallLabel1'>
          You may be part of an experiment as we introduce new features to enhance your experience.
          In this experiment, instead of displaying the 1:1 icon shown above, we may use the 16:9
          default thumbnail image you&apos;ve previously uploaded for your experience.
        </Typography>
      )}
    </div>
  );
};

export const AdCreativeFormGroup = ({
  addingToExistingAdSet,
  disableInputs,
  formikInfo,
  isEditAd,
}: {
  addingToExistingAdSet: boolean;
  disableInputs: boolean;
  formikInfo: TODOFIXANY;
  isEditAd: boolean;
}) => {
  const {
    classes: { configureAdHeader, configureAdInput, configureAdRow, experienceExtraTextContainer },
  } = makeStyles()(() => ({
    configureAdHeader: {
      marginTop: 24,
    },

    configureAdInput: {
      width: '100%',
    },

    configureAdRow: {
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'center',
      marginBottom: 24,
      marginTop: 24,
      width: '100%',
    },
    experienceExtraTextContainer: {
      marginBottom: '-12px',
      marginLeft: '15px', // Requested by design to align with text in Destination Experience input box
      marginTop: '-16px',
    },
  }))();

  const { destinationInfoToPreselect, universesCanAccess = [] as Universe[] } = useContext(
    CreateCampaignMetadataContext,
  );

  const fetchGameThumbnailInfo = async (placeId: number, formikInfoObj?: TODOFIXANY) => {
    try {
      const thumbnailResponse = await getGameThumbnailByPlaceId(placeId);
      const { imageUrl } = thumbnailResponse.data[0];
      return imageUrl;
    } catch (e) {
      throw new Error(`error getting thumbnail url for assetId ${formikInfoObj?.values?.assetId}`);
    }
  };

  const handlePortalDestinationChange = (universeObj: AutocompleteOption | null) => {
    if (universeObj) {
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.adPortalDestinationPlaceId.name,
        universeObj?.rootPlaceId,
      );
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.adPortalDestinationText.name,
        universeObj?.universeName,
      );
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.adDestinationUniverseId.name,
        universeObj?.universeId,
      );

      // fetch thumbnail for both portal and tile, so when user switch to tile the
      // image will not be blank
      fetchGameThumbnailInfo(universeObj.rootPlaceId)
        .then((thumbnailUrl: string) => {
          formikInfo.setFieldValue(
            createCampaignWizardModel.formField.adGameThumbnailUrl.name,
            thumbnailUrl,
          );
        })
        .catch(() => {
          CaptureException('Could not fetch the image url');
        });
    } else {
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.adPortalDestinationPlaceId.name,
        '',
      );
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.adPortalDestinationText.name,
        '',
      );
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.adDestinationUniverseId.name,
        '',
      );

      formikInfo.setFieldValue(createCampaignWizardModel.formField.adGameThumbnailUrl.name, '');
    }

    setTimeout(() => formikInfo.validateForm(), 0);
  };

  const disabledAdAutocomplete = (
    <SelectUniverseAutocomplete
      disabled={disableInputs}
      id={createCampaignWizardModel.formField.adPortalDestinationPlaceId.name}
      portalDestinations={[] as AutocompleteOption[]}
      renderInputFn={(params) => (
        <TextField
          {...params}
          autoFocus
          helperText={isEditAd ? '' : 'Select Portal Destination Experience'}
          id={`${createCampaignWizardModel.formField.adPortalDestinationPlaceId.name}-TextField`}
          label={createCampaignWizardModel.formField.adPortalDestinationPlaceId.label}
          name={createCampaignWizardModel.formField.adPortalDestinationPlaceId.name}
        />
      )}
      rootClass={configureAdInput}
      value={formikInfo.values.adPortalDestinationText}
    />
  );

  let uploadPreviewEl;
  if (
    formikInfo.values.adType === AdFormatType.TILE ||
    formikInfo.values.adType === AdFormatType.SEARCH
  ) {
    uploadPreviewEl = (
      <GameThumbnailComponent
        adType={formikInfo.values.adType}
        experienceName={formikInfo.values.adPortalDestinationText}
        hideImage={isEditAd}
        imageUrl={formikInfo.values.adGameThumbnailUrl}
        summaryView={false}
      />
    );
  } else if (formikInfo.values.adType === AdFormatType.VIDEO) {
    uploadPreviewEl = (
      <AdVideoUploadDisplayComponent
        disableInputs={disableInputs}
        formikInfo={formikInfo}
        isEditAd={isEditAd}
      />
    );
  } else {
    uploadPreviewEl = (
      <AdImageUploadDisplayComponent
        disableInputs={disableInputs}
        formikInfo={formikInfo}
        isEditAd={isEditAd}
      />
    );
  }

  let destinationListDisclaimer =
    'Your destination list is based on your selected paid-access and/or restricted (18+) games in the Ad Set step.';
  if (addingToExistingAdSet) {
    destinationListDisclaimer = destinationListDisclaimer.concat(
      ' ',
      'Create a new ad set to promote a new experience type.',
    );
  }

  const isVisitsBased = CampaignObjectiveType.VISITS === formikInfo.values.campaignObjective;

  useEffect(() => {
    if (destinationInfoToPreselect && isVisitsBased) {
      const { placeId, universeId } = destinationInfoToPreselect;

      if (placeId || universeId) {
        const foundDestination = universesCanAccess.find(
          (destination) =>
            destination.root_place_id === placeId || destination.universe_id === universeId,
        );
        if (foundDestination) {
          const preSelectedUniverseInfo = {
            rootPlaceId: foundDestination.root_place_id,
            universeId: foundDestination.universe_id,
            universeName: foundDestination.universe_name,
          };
          handlePortalDestinationChange(preSelectedUniverseInfo);
        }
      }
    }
  }, [destinationInfoToPreselect]);

  return (
    <>
      <div className={configureAdHeader}>
        <Typography data-rblx-ad-settings-title variant='h4'>
          Ad Creative
        </Typography>
      </div>

      {isVisitsBased && (
        <>
          {disableInputs && <div className={configureAdRow}>{disabledAdAutocomplete}</div>}
          {Boolean(formikInfo.errors.adPortalDestinationPlaceId) && (
            <div className={experienceExtraTextContainer}>
              <Typography color='error' variant='caption'>
                {formikInfo.errors.adPortalDestinationPlaceId}
              </Typography>
            </div>
          )}
        </>
      )}
      {uploadPreviewEl}
    </>
  );
};

const fetchGameThumbnailInfo = async (placeId: number, formikInfoObj: TODOFIXANY) => {
  try {
    const thumbnailResponse = await getGameThumbnailByPlaceId(placeId);
    const { imageUrl } = thumbnailResponse.data[0];
    return imageUrl;
  } catch (e) {
    throw new Error(`error getting thumbnail url for assetId ${formikInfoObj?.values?.assetId}`);
  }
};

const handlePortalDestinationChange = (
  universeObj: AutocompleteOption | null,
  formikInfo: TODOFIXANY,
  configurationValues: UniverseToggleConfigurationValuesType,
) => {
  if (universeObj) {
    formikInfo.setFieldValue(
      createCampaignWizardModel.formField.adPortalDestinationPlaceId.name,
      universeObj?.rootPlaceId,
    );
    formikInfo.setFieldValue(
      createCampaignWizardModel.formField.adPortalDestinationText.name,
      universeObj?.universeName,
    );
    formikInfo.setFieldValue(
      createCampaignWizardModel.formField.adDestinationUniverseId.name,
      universeObj?.universeId,
    );

    const universeIsRestrictedMaturity = universeObj.seventeenPlusAgeRating;
    const universeIsPaid = universeObj.paidAccess;

    handleAdSetRestrictedMaturityChange(Boolean(universeIsRestrictedMaturity), formikInfo);
    handleAdSetPaidAccessChange(Boolean(universeIsPaid), formikInfo, configurationValues);

    // fetch thumbnail for both portal and tile, so when user switch to tile the
    // image will not be blank
    fetchGameThumbnailInfo(universeObj.rootPlaceId, formikInfo)
      .then((thumbnailUrl: string) => {
        formikInfo.setFieldValue(
          createCampaignWizardModel.formField.adGameThumbnailUrl.name,
          thumbnailUrl,
        );
      })
      .catch(() => {
        CaptureException('Could not fetch the image url');
      });
  } else {
    formikInfo.setFieldValue(
      createCampaignWizardModel.formField.adPortalDestinationPlaceId.name,
      '',
    );
    formikInfo.setFieldValue(createCampaignWizardModel.formField.adPortalDestinationText.name, '');
    formikInfo.setFieldValue(createCampaignWizardModel.formField.adDestinationUniverseId.name, '');
    formikInfo.setFieldValue(createCampaignWizardModel.formField.adGameThumbnailUrl.name, '');
  }
};

export const AdNameFormGroup = ({
  disableInputs,
  formikInfo,
}: {
  disableInputs: boolean;
  formikInfo: TODOFIXANY;
}) => {
  const {
    classes: { adNameSection, configureAdInput, configureAdRowName },
  } = makeStyles()(() => ({
    adNameSection: {
      marginTop: 24,
    },

    configureAdInput: {
      width: '100%',
    },

    configureAdRowName: {
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'center',
      marginBottom: 24,
      marginTop: 12,
      width: '100%',
    },
  }))();

  return (
    <div className={adNameSection}>
      <Typography data-rblx-ad-settings-title variant='h4'>
        Ad Name
      </Typography>
      <InputWrapperWithRightAlignedHelperText
        helperTextValue={`${formikInfo.values.adName.length}/128`}
        topOffset='55px'>
        <div className={configureAdRowName}>
          <TextField
            classes={{
              root: configureAdInput,
            }}
            disabled={disableInputs}
            error={formikInfo.touched.adName && Boolean(formikInfo.errors.adName)}
            helperText={formikInfo.touched.adName && formikInfo.errors.adName}
            id={createCampaignWizardModel.formField.adName.name}
            label={createCampaignWizardModel.formField.adName.label}
            margin='none'
            name={createCampaignWizardModel.formField.adName.name}
            onBlur={formikInfo.handleBlur}
            onChange={formikInfo.handleChange}
            onKeyPress={() => {
              formikInfo.setFieldTouched(
                createCampaignWizardModel.formField.adName.name,
                true,
                true,
              );
            }}
            value={formikInfo.values.adName}
          />
        </div>
      </InputWrapperWithRightAlignedHelperText>
    </div>
  );
};

const CreateAdConfigurationForm = ({
  adSetToPopulate,
  campaignToPopulate,
  disableInputs,
  formikInfo,
}: CreateAdConfigurationFormProps) => {
  const [pageLoading, setPageLoading] = useState(true);

  const { universesCanAccess = [] as Universe[] } = useContext(CreateCampaignMetadataContext);

  const { setModalConfigData, setModalOpen } = useModalStore();

  const {
    coreCountryOverrideCodeList,
    coreRegionCodeList,
    strategicRegionCodeList,
    videoMinBidMappingsMicroUsd,
  } = useAppStore((state: AppStoreType) => state.appData);

  const configurationValues = {
    coreCountryOverrideCodeList,
    coreRegionCodeList,
    strategicRegionCodeList,
    videoMinBidMappingsMicroUsd,
  };

  const fetchCampaignsCurrentUserHasAccessTo = useCallback(async () => {
    const campaignFetchedInfo = (await getCampaignV2(campaignToPopulate || '')) || {};
    const campaignInfo = campaignFetchedInfo.campaign;

    if (campaignInfo) {
      if (campaignInfo.end_timestamp_ms > 0 && campaignInfo.end_timestamp_ms < Date.now()) {
        setModalConfigData({
          dialogContent: 'You cannot add an ad to a completed campaign',
          handleClose: (_: unknown, reason: string) => {
            if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
              return;
            }
            setModalOpen(false);
          },
          title: 'Error',
        });
        setModalOpen(true);
        return;
      }
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignId.name,
        campaignInfo!.id,
      );

      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignName.name,
        campaignInfo!.name,
      );

      const campaignObjective = ServerToClient.getFromServerCampaignObjective(campaignInfo);

      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignObjective.name,
        campaignObjective,
      );

      const paymentType = convertPaymentTypeServerToClient(campaignInfo?.payment_type);
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignPaymentMethod.name,
        paymentType,
      );

      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.adSetBidType.name,
        getAdSetBidTypeFromCampaignTypeAndPaidAccessSelection(
          campaignObjective,
          formikInfo.values.adSetPaidAccess,
        ),
      );

      const { budgetType, budgetUsd } =
        ServerToClient.getFromServerCampaignBudgetInfo(campaignInfo);

      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignBudgetType.name,
        budgetType,
      );

      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignBudgetCapUsd.name,
        budgetUsd,
      );

      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignStartDate.name,
        campaignInfo!.start_timestamp_ms,
      );

      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignEndDate.name,
        campaignInfo!.end_timestamp_ms,
      );

      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignStartTime.name,
        campaignInfo!.start_timestamp_ms,
      );

      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignEndTime.name,
        campaignInfo!.end_timestamp_ms,
      );

      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.campaignStartTimestampMs.name,
        campaignInfo!.start_timestamp_ms,
      );

      if (campaignInfo!.end_timestamp_ms) {
        formikInfo.setFieldValue(
          createCampaignWizardModel.formField.campaignEndTimestampMs.name,
          campaignInfo!.end_timestamp_ms,
        );

        formikInfo.setFieldValue(createCampaignWizardModel.formField.campaignHasEndDate.name, true);
      }

      if (campaignObjective === CampaignObjectiveType.VIDEO_VIEWS) {
        formikInfo.setFieldValue(
          createCampaignWizardModel.formField.billableViewDuration.name,
          BillableViewDurationType.FIFTEEN_SECONDS,
        );

        formikInfo.setFieldValue(
          createCampaignWizardModel.formField.adSetBidType.name,
          AdSetBidType.CPV15,
        );

        formikInfo.setFieldValue(
          createCampaignWizardModel.formField.adType.name,
          AdFormatType.VIDEO,
        );
      }

      if (campaignObjective === CampaignObjectiveType.VISITS) {
        const { universe_id } = campaignInfo;
        if (universe_id) {
          const foundDestination: UniverseShapeType = universesCanAccess.find(
            (destination) => destination.universe_id === universe_id,
          );
          if (foundDestination) {
            handlePortalDestinationChange(
              convertServerUniverseToAutocompletOption(foundDestination),
              formikInfo,
              configurationValues,
            );
          }
        }
      }
    }
  }, []);

  const { adAccountId = GetLocalStorage(StorageKeys.AD_ACCOUNT_ID) } = useAppStore(
    (state: AppStoreType) => state.appData,
  );

  const fetchAdSetCurrentUserHasAccessTo = useCallback(async () => {
    const adSetInfo = ((await getAdSet(adSetToPopulate || '')) || {}).ad_set;

    let adInfo;
    const fetchedAdRes =
      (await getFilteredAds({
        adAccountId: adAccountId as string,
        filterIds: [adSetInfo.id],
        filterType: 'ADSETS',
      })) || {};

    if (fetchedAdRes.ok) {
      const fetchedAds = await fetchedAdRes.json();
      adInfo = (fetchedAds.ads || []).find((adObj: TODOFIXANY) => {
        return (adObj as TODOFIXANY).ad_set_id === adSetToPopulate;
      });
    }

    if (adSetInfo) {
      formikInfo.setFieldValue(createCampaignWizardModel.formField.adSetId.name, adSetInfo!.id);
      formikInfo.setFieldValue(createCampaignWizardModel.formField.adSetName.name, adSetInfo!.name);

      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.adSetAuctionType.name,
        getEndUserAdSetAuctionType((adSetInfo as TODOFIXANY)!.auction_type),
      );

      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.adSetBidType.name,
        mapServerBidTypeToFormik((adSetInfo as TODOFIXANY)!.bidding_strategy.bid_type),
      );
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.adSetBidValueUsd.name,
        microUsdToUsd((adSetInfo as TODOFIXANY)!.bidding_strategy.bid_value_micro_usd),
      );
      const { capValue, frequencyCapOn } = ServerToClient.getAdSetFrequencyCapInfo(adSetInfo);
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.adSetFrequencyCapOn.name,
        frequencyCapOn,
      );
      if (frequencyCapOn) {
        formikInfo.setFieldValue(
          createCampaignWizardModel.formField.adSetFrequencyCapValue.name,
          capValue,
        );
      }

      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.adSetMixedRegionAndCountryTargeting.name,
        getEndUserAdSetRegionAndCountryTargeting(adSetInfo!),
      );

      if (languagesEnabled) {
        formikInfo.setFieldValue(
          createCampaignWizardModel.formField.adSetLanguageTargeting.name,
          getEndUserAdSetLanguageTargeting(adSetInfo!),
        );
      }
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.adSetGenderTargeting.name,
        getEndUserAdSetGenderTargeting(adSetInfo!),
      );
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.adSetAgeTargeting.name,
        getEndUserAdSetAgeTargeting(adSetInfo!),
      );
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.adSetAgeBucketTargeting.name,
        getEndUserAdSetAgeBucketTargeting(adSetInfo!),
      );
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.adSetDeviceTargeting.name,
        getEndUserAdSetDeviceTargeting(adSetInfo!),
      );

      const adFormatType = mapServerAdTypeToFormik((adInfo as TODOFIXANY)?.type);
      formikInfo.setFieldValue(createCampaignWizardModel.formField.adType.name, adFormatType);

      const { paidAccess, seventeenPlus, toggleOn } = getEndUserAdSetExperienceTypesContainer(
        adSetInfo!,
      );
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.adSetSpecialExperienceSelectionToggledOn.name,
        toggleOn,
      );
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.adSetPaidAccess.name,
        paidAccess,
      );
      formikInfo.setFieldValue(
        createCampaignWizardModel.formField.adSetRestrictedMaturity.name,
        seventeenPlus,
      );
    }
  }, []);

  useEffect(() => {
    if (adSetToPopulate) {
      Promise.all([fetchCampaignsCurrentUserHasAccessTo(), fetchAdSetCurrentUserHasAccessTo()])
        .catch(CaptureException)
        .finally(() => {
          setPageLoading(false);
        });
    } else {
      setPageLoading(false);
    }
  }, [fetchAdSetCurrentUserHasAccessTo, fetchCampaignsCurrentUserHasAccessTo]);

  const { activeStep } = useContext(CreateCampaignMetadataContext);

  useEffect(() => {
    // For when folks go back to step 2 of the wizard and change their age targeting - to update the 18+ error messaging
    if (activeStep === 2) {
      setTimeout(() => formikInfo.validateForm(), 0);
    }
  }, [activeStep]);

  const {
    classes: { campaignToPopulateDropdown, loadingContainer, rowDropdownInput },
  } = makeStyles()(() => ({
    campaignToPopulateDropdown: {
      paddingTop: 24,
    },

    loadingContainer: {
      alignItems: 'center',
      display: 'flex',
      height: '30rem',
      justifyContent: 'center',
      width: '100%',
    },
    rowDropdownInput: {
      marginBottom: 16,
      width: '100%',
    },
  }))();

  return (
    <>
      {pageLoading && (
        <div className={loadingContainer}>
          <CustomCircularProgress />
        </div>
      )}

      {!pageLoading && (
        <>
          {Boolean(campaignToPopulate) && (
            <div className={campaignToPopulateDropdown}>
              <Select
                classes={{ root: rowDropdownInput }}
                disabled
                label='Selected Campaign'
                value={formikInfo.values.campaignName}>
                <MenuItem value={formikInfo.values.campaignName}>
                  {formikInfo.values.campaignName}
                </MenuItem>
              </Select>
            </div>
          )}

          {Boolean(adSetToPopulate) && (
            <div>
              <Select
                classes={{ root: rowDropdownInput }}
                disabled
                label='Selected Ad Set'
                value={formikInfo.values.adSetName}>
                <MenuItem value={formikInfo.values.adSetName}>
                  {formikInfo.values.adSetName}
                </MenuItem>
              </Select>
            </div>
          )}

          <AdCreativeFormGroup
            addingToExistingAdSet={Boolean(adSetToPopulate)}
            disableInputs={disableInputs}
            formikInfo={formikInfo}
            isEditAd={false}
          />
          <AdNameFormGroup disableInputs={disableInputs} formikInfo={formikInfo} />
        </>
      )}
    </>
  );
};

export default CreateAdConfigurationForm;
