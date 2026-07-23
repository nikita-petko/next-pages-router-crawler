import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import router from 'next/router';
import type { SubmitHandler, FormState } from 'react-hook-form';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { ModerationState, AssetType } from '@rbx/client-assets-upload-api/v1';
import { Restriction } from '@rbx/client-marketplace-publishing-requirements-api/v1';
import { useTranslation } from '@rbx/intl';
import { ReturnPolicy, ThumbnailTypes } from '@rbx/thumbnails';
import {
  Button,
  CircularProgress,
  Divider,
  FormHelperText,
  Grid,
  Tooltip,
  useSnackbar,
  VisuallyHidden,
} from '@rbx/ui';
import type { Money } from '@modules/clients/creatorStoreProduct/openCloudCreatorStoreProduct';
import type { DeveloperItemDistributionQuota } from '@modules/clients/publish';
import { DataSharingLicenseType } from '@modules/clients/resourceSettings';
import { useFetchItemDetails } from '@modules/clients/ToolboxServiceQueries';
import { getErrorCode } from '@modules/clients/utils/errorHelpers';
import { setAssetConfigurations } from '@modules/data-collection/utils/apiUtils';
import {
  assetToProduct,
  useMarketplaceFiatServiceProvider,
} from '@modules/marketplaceFiatService/MarketplaceFiatServiceProvider';
import type { CreatorStoreProductConfiguration } from '@modules/marketplaceFiatService/MarketplaceFiatServiceProvider';
import {
  useFetchProduct,
  useFetchPrices,
} from '@modules/marketplaceFiatService/MarketplaceFiatServiceQueries';
import {
  isDataSharingAvailableForAssetType,
  isDataSharingAvailableForPriceString,
  isDataSharingAvailableForRoles,
} from '@modules/marketplaceFiatService/utils/fiatUtils';
import { assetToMprsAsset } from '@modules/marketplacePublishingRequirements/MarketplacePublishingRequirementsProvider';
import { useFetchCreatorStoreAssetConfigurationRequirements } from '@modules/marketplacePublishingRequirements/MarketplacePublishingRequirementsQueries';
import {
  AllSettlePromiseSuccess,
  Asset,
  AssetError,
  CreatorType,
  FormMode,
} from '@modules/miscellaneous/common';
import { CREATOR_STORE_VERIFICATION_URL } from '@modules/miscellaneous/common/constants/linkConstants';
import { EmptyGrid } from '@modules/miscellaneous/components';
import useThumbnailImage from '@modules/miscellaneous/components/ThumbnailImage/useThumbnailImage';
import ThumbnailImageUploader from '@modules/miscellaneous/components/uploaders/components/ThumbnailImageUploader';
import type { ThumbnailImageUploaderRef } from '@modules/miscellaneous/components/uploaders/components/ThumbnailImageUploader';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { getEnumKeyByValue } from '@modules/miscellaneous/utils';
import {
  useGetCreatorStoreDataSharingPreference,
  useGetWasDataSharingEnabled,
} from '@modules/react-query/resourceSettings';
import { FrontendFlagName } from '@modules/toolboxService/toolboxFeatureManagement';
import { useToolboxServiceApiProvider } from '@modules/toolboxService/ToolboxServiceApiProvider';
import AssetAccessForm from '../../../common/AssetAccessForm/AssetAccessForm';
import BasicInfoForm from '../../../common/BasicInfoForm/BasicInfoForm';
import {
  getDeveloperItemDistributionQuota,
  getBackToCreationsPageLink,
  postDeveloperItemDetails,
  getDistributionErrorStateForRestrictions,
  DistributionErrorState,
} from '../../../common/common';
import type { TConfigureDeveloperItemProps } from '../../../common/types';
import UploadImagePreviewsForm from '../../../common/UploadImagePreviewsForm/UploadImagePreviewsForm';
import UploadVideoPreviewsForm from '../../../common/UploadVideoPreviewsForm/UploadVideoPreviewsForm';
import usePaidModelConfirmationData from '../../hooks/usePaidModelConfirmationData';
import type { FetchPreviewIdsResponse } from '../../hooks/usePreviews';
import usePreviews from '../../hooks/usePreviews';
import type { FetchSocialLinksResponse, SocialLinkWithType } from '../../hooks/useSocialLinks';
import useSocialLinks from '../../hooks/useSocialLinks';
import DistributionFormShard from '../DistributionFormShard/DistributionFormShard';
import SocialLinksFormShard from '../SocialLinksFormShard/SocialLinksFormShard';
import {
  TryAssetMode,
  TRY_ASSET_PLACE_ID_KEY,
  TRY_ASSET_PLACE_ID_ELEMENT_ID,
  FORM_ERROR_TYPE_REQUIRED,
  FORM_ERROR_TYPE_VALIDATION,
  getTryAssetFormValueFromPlaceId,
  getPlaceIdFromTryAssetFormValue,
} from '../SocialLinksFormShard/TryAssetForm/tryAssetFormHelpers';
import useCreatorStoreConfigurationStyles from './CreatorStoreConfiguration.styles';
import SellingPaidModelConfirmationWarning from './SellingPaidModelConfirmationWarning/SellingPaidModelConfirmationWarning';
import SellingPaidModelDeepCopyModals from './SellingPaidModelDeepCopyModals/SellingPaidModelDeepCopyModals';
import type { CreatorStoreConfigurationType } from './types';

const ThumbnailImageTypes = ['jpg', 'gif', 'png', 'tga', 'bmp'];
const VIDEO_PREVIEW_TYPE = AssetType.StorePreviewVideo;

const CreatorStoreConfiguration: FunctionComponent<
  React.PropsWithChildren<TConfigureDeveloperItemProps>
> = ({
  developerItemDetails,
  enableAssetAccessForm,
  isCreatorEligibleForAssetAccessBeta,
  onDataFetchFailed,
}) => {
  const { frontendFlags, loadingFrontendFlags } = useToolboxServiceApiProvider();
  // Simple data fetches and hooks go here
  const { creator, id: assetId, type: assetType } = developerItemDetails;

  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { data: basePrices, isPending: isBasePricesLoading } = useFetchPrices(
    assetToProduct(assetType),
  );
  const { data: fiatProduct, isPending: isFiatProductLoading } = useFetchProduct(
    assetId,
    assetToProduct(assetType),
  );
  const {
    data: assetConfigurationRequirements,
    isPending: isAssetConfigurationRequirementsLoading,
  } = useFetchCreatorStoreAssetConfigurationRequirements(
    assetToMprsAsset(assetType),
    parseInt(assetId, 10),
  );
  const { data: toolboxItemDetails } = useFetchItemDetails(parseInt(assetId, 10), true);
  const areCompositeAssetChecksPending =
    (assetConfigurationRequirements?.publishing?.restrictions?.includes(
      Restriction.CompositeAssetSubcomponentsEligibilityPending,
    ) ??
      false) ||
    (assetConfigurationRequirements?.publishing?.restrictions?.includes(
      Restriction.CompositeAssetLatestVersionUnverified,
    ) ??
      false);
  const { data: dataSharingPreference, isPending: isDataSharingPreferenceLoading } =
    useGetCreatorStoreDataSharingPreference(true);
  const { data: wasDataSharingEnabled, isPending: isWasDataSharingEnabledLoading } =
    useGetWasDataSharingEnabled(parseInt(assetId, 10), assetType);
  const { translate, translateHTML } = useTranslation();
  const { enqueue } = useSnackbar();
  const { configureProduct } = useMarketplaceFiatServiceProvider();
  const {
    classes: {
      button,
      buttonContainer,
      divider,
      errorMessageContainer,
      formContainer,
      imageContainer,
      imageUploaderContainer,
      pageContainer,
    },
  } = useCreatorStoreConfigurationStyles();

  // Other state goes here
  const pageLoadingStartTimeRef = useRef<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [openSellingPaidModelConfirmationDialog, setOpenSellingPaidModelConfirmationDialog] =
    useState<boolean>(false);

  const isPaidModelConfirmationWarningEligibilityRequired =
    developerItemDetails.type === Asset.Model && creator.type === CreatorType.User;
  // Eligibility is based on the Model's dependencies and does not consider its price or distribution status, which are fetched below
  const {
    isEligibleForPaidModelConfirmationWarning,
    isPaidModelConfirmationWarningEligibilityPending,
  } = usePaidModelConfirmationData({
    assetId: parseInt(assetId, 10),
    creator,
    enabled: isPaidModelConfirmationWarningEligibilityRequired,
  });

  const { thumbnailImage } = useThumbnailImage({
    targetId: parseInt(assetId, 10),
    targetType: ThumbnailTypes.assetThumbnail,
    isStatusTextShown: true,
    returnPolicy: ReturnPolicy.PlaceHolder,
  });

  // Helper to render the verification notice used in both image and video sections
  const verificationNotice = useMemo(() => {
    return translateHTML('Message.VerificationRequiredForMediaVisibility', [
      {
        opening: 'linkStart',
        closing: 'linkEnd',
        content(chunks) {
          return (
            <a href={CREATOR_STORE_VERIFICATION_URL} target='_blank' rel='noreferrer'>
              {chunks}
            </a>
          );
        },
      },
    ]);
  }, [translateHTML]);

  // More complex data fetches go here so they are called when the component first mounts
  const [isOpenUseAsset, setIsOpenUseAsset] = useState(false);
  const [isPageInitializing, setIsPageInitializing] = useState<boolean>(true);
  const [quota, setQuota] = useState<DeveloperItemDistributionQuota | null>(null);
  const [imagePreviewIds, setImagePreviewIds] = useState<number[]>([]);
  const [videoPreviewId, setVideoPreviewId] = useState<number | null>(null);
  const [videoModerationState, setVideoModerationState] = useState<ModerationState>(
    ModerationState.Unspecified,
  );
  const uploaderRef = useRef<ThumbnailImageUploaderRef>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLinkWithType[]>([]);
  const [initialTryAssetPlaceId, setInitialTryAssetPlaceId] = useState<string | null>(null);
  const [tryAssetExistingPlaceIsPlayable, setTryAssetExistingPlaceIsPlayable] = useState<
    boolean | null
  >(null);
  const refreshThumbnail = useCallback(() => {
    void uploaderRef.current?.refreshThumbnail();
  }, []);

  const handleVideoUploadComplete = useCallback(() => {
    setVideoModerationState(ModerationState.Reviewing);
  }, []);

  const {
    arePreviewsEnabled,
    areVideoPreviewsEnabled,
    isConfiguringThumbnailEnabled,
    isRemovingThumbnailEnabled,
    hasRemovableThumbnail,
    fetchPreviewIds,
    configurePreviews,
    configureThumbnail,
    uploadPreview,
    deletePreview,
  } = usePreviews(
    parseInt(assetId, 10),
    assetType,
    creator.id,
    creator.type,
    refreshThumbnail,
    VIDEO_PREVIEW_TYPE,
  );

  const previewsEnabledForUser = arePreviewsEnabled;
  const videoPreviewsEnabledForUser = areVideoPreviewsEnabled;
  const {
    socialLinkTypeToTranslatedText,
    fetchAreSocialLinksEnabledForUser,
    fetchSocialLinks,
    updateSocialLinks,
    validateTryAssetPlaceId,
  } = useSocialLinks(parseInt(assetId, 10), assetType);
  // If the user is U13, the backend will not allow them to view or create links.
  const [areSocialLinksEnabledForUser, setAreSocialLinksEnabledForUser] = useState(false);

  // - SocialLinkView hides the section entirely.
  // - SocialLinkCreate keeps it visible but read-only (view + delete only, no create/update).
  const assetConfigRestrictions = assetConfigurationRequirements?.assetConfigMetadata?.restrictions;
  const isSocialLinksSectionHidden =
    assetConfigRestrictions?.includes(Restriction.SocialLinkView) ?? false;
  const canCreateOrUpdateSocialLinks =
    !isSocialLinksSectionHidden &&
    !(assetConfigRestrictions?.includes(Restriction.SocialLinkCreate) ?? false);

  useEffect(() => {
    async function fetchData() {
      const requests: Promise<
        | DeveloperItemDistributionQuota
        | FetchSocialLinksResponse
        | FetchPreviewIdsResponse
        | boolean
        | null
      >[] = [
        getDeveloperItemDistributionQuota(assetType),
        fetchSocialLinks(),
        fetchAreSocialLinksEnabledForUser(),
      ];
      if (previewsEnabledForUser) {
        requests.push(fetchPreviewIds());
      }
      await Promise.all(requests).then(
        (responses) => {
          /* oxlint-disable typescript/no-unsafe-type-assertion -- each responses[n] matches the fixed request order in requests[] */
          setQuota(responses[0] as DeveloperItemDistributionQuota);
          setSocialLinks((responses[1] as FetchSocialLinksResponse).socialLinks);
          setInitialTryAssetPlaceId((responses[1] as FetchSocialLinksResponse).tryAssetPlaceId);
          setTryAssetExistingPlaceIsPlayable(
            (responses[1] as FetchSocialLinksResponse).tryAssetExistingPlaceIsPlayable,
          );
          setAreSocialLinksEnabledForUser(responses[2] as boolean);
          if (previewsEnabledForUser) {
            const previewData = responses[3] as FetchPreviewIdsResponse;
            setImagePreviewIds(previewData.imagePreviewIds);
            setVideoPreviewId(previewData.videoPreviewId);
            setVideoModerationState(previewData.videoModerationState);
          }
          /* oxlint-enable typescript/no-unsafe-type-assertion */
        },
        () => {
          onDataFetchFailed();
        },
      );
    }

    // oxlint-disable-next-line react/react-compiler -- not fixing lint because below comment shows this is here for a reason
    setIsPageInitializing(true);
    // This fixes a flicker caused by isRichMediaEnabledForUser changing to true
    // It requires assetConfigurationRequirements to complete loading
    if (isAssetConfigurationRequirementsLoading) {
      return;
    }
    void fetchData().then(() => {
      setIsPageInitializing(false);
    });
  }, [
    assetId,
    assetType,
    fetchSocialLinks,
    onDataFetchFailed,
    setIsPageInitializing,
    fetchAreSocialLinksEnabledForUser,
    isAssetConfigurationRequirementsLoading,
    previewsEnabledForUser,
    fetchPreviewIds,
  ]);

  // React Hook Form initialization and form methods
  const isDataSharingEligible = dataSharingPreference?.isEligible ?? false;
  const isDataSharingDefaultEnabled = dataSharingPreference?.isDataSharingDefaultEnabled ?? false;

  const formValues = useMemo(() => {
    return {
      imagePreviewIds,
      videoPreviewId,
      dataSharingEnabled: wasDataSharingEnabled ?? isDataSharingDefaultEnabled,
      description: developerItemDetails?.description,
      fiatPrice: JSON.stringify(fiatProduct?.basePrice),
      file: null,
      removeCustomThumbnail: false,
      isItemDistributed: fiatProduct?.published ?? false,
      name: developerItemDetails?.name,
      socialLinks,
      tryAsset: getTryAssetFormValueFromPlaceId(initialTryAssetPlaceId),
    };
  }, [
    imagePreviewIds,
    videoPreviewId,
    wasDataSharingEnabled,
    isDataSharingDefaultEnabled,
    developerItemDetails?.description,
    developerItemDetails?.name,
    fiatProduct?.basePrice,
    fiatProduct?.published,
    socialLinks,
    initialTryAssetPlaceId,
  ]);
  const methods = useForm<CreatorStoreConfigurationType>({
    defaultValues: formValues,
    mode: FormMode.OnChange,
    reValidateMode: FormMode.OnChange,
    shouldUnregister: false,
  });
  const { isSubmitting, isValid, isValidating, isDirty } = methods.formState;

  const handleUploadPreview = useCallback(
    async (file: File, fileAssetType: AssetType) => {
      const currentImagePreviewIds = methods.getValues('imagePreviewIds') || [];
      const currentVideoPreviewId = methods.getValues('videoPreviewId');
      await uploadPreview(file, fileAssetType, currentImagePreviewIds, currentVideoPreviewId);
    },
    [uploadPreview, methods],
  );

  const handleDeletePreview = useCallback(
    async (previewId: number) => {
      const currentImagePreviewIds = methods.getValues('imagePreviewIds') || [];
      const currentVideoPreviewId = methods.getValues('videoPreviewId');
      await deletePreview(previewId, currentImagePreviewIds, currentVideoPreviewId);
    },
    [deletePreview, methods],
  );
  useEffect(() => {
    // This prevents flickering issues when the form is submitted
    if (isSubmitting) {
      return;
    }
    methods.reset(formValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- We don't want to trigger this based on isSubmitting
  }, [formValues, methods]);

  const isItemDistributedValue = useWatch({
    control: methods.control,
    name: 'isItemDistributed',
  });

  const isBackendFiatProductDistributed = fiatProduct?.published ?? false;
  const isBackendFiatProductPriced =
    fiatProduct?.basePrice?.quantity?.significand !== undefined &&
    fiatProduct?.basePrice?.quantity?.significand !== null &&
    Number(fiatProduct?.basePrice?.quantity?.significand) > 0;
  const assetTypeIsMonetizable =
    assetConfigurationRequirements?.pricing?.restrictions &&
    !assetConfigurationRequirements.pricing.restrictions.includes(Restriction.AssetType);
  const distributionErrorState = useMemo(() => {
    if (
      assetType === Asset.Plugin ||
      frontendFlags[FrontendFlagName.FrontendFlagEnableNonPluginDistributionRestrictions]
    ) {
      return getDistributionErrorStateForRestrictions(
        assetConfigurationRequirements?.publishing?.restrictions ?? [],
        assetConfigurationRequirements?.publishing?.isAllowed ?? false,
        assetConfigurationRequirements?.pricing?.restrictions ?? [],
        assetConfigurationRequirements?.pricing?.isAllowed ?? false,
        assetTypeIsMonetizable ?? false,
        isBackendFiatProductPriced,
        toolboxItemDetails?.asset?.visibilityStatus,
      );
    }

    return undefined;
  }, [
    assetConfigurationRequirements?.publishing?.isAllowed,
    assetConfigurationRequirements?.publishing?.restrictions,
    assetConfigurationRequirements?.pricing?.isAllowed,
    assetConfigurationRequirements?.pricing?.restrictions,
    assetType,
    assetTypeIsMonetizable,
    frontendFlags,
    isBackendFiatProductPriced,
    toolboxItemDetails?.asset?.visibilityStatus,
  ]);

  const handleFileChange = useCallback(
    (file: File | null) => {
      if (file) {
        methods.setValue('removeCustomThumbnail', false);
      }
      methods.setValue('file', file, { shouldDirty: file !== null, shouldValidate: true });
    },
    [methods],
  );

  const handleRemoveExistingThumbnail = useCallback(() => {
    methods.setValue('removeCustomThumbnail', true, { shouldDirty: true });
    methods.setValue('file', null);
  }, [methods]);

  const configureDataSharing = useCallback(
    async (data: CreatorStoreConfigurationType) => {
      if (
        isDataSharingEligible &&
        data.isItemDistributed &&
        isDataSharingAvailableForAssetType(assetType) &&
        isDataSharingAvailableForPriceString(data.fiatPrice) &&
        isDataSharingAvailableForRoles(assetConfigurationRequirements?.roles?.roles ?? [])
      ) {
        try {
          const dataLicenseList = data.dataSharingEnabled
            ? [DataSharingLicenseType.RobloxGlobal]
            : [];
          const assetConfigurationMap: Record<number, Set<DataSharingLicenseType>> = {
            [parseInt(assetId, 10)]: new Set(dataLicenseList),
          };
          await setAssetConfigurations(assetConfigurationMap);
        } catch {
          throw new Error(translate('Error.DataSharingConfigurationError'));
        }
      }
    },
    [
      assetConfigurationRequirements?.roles?.roles,
      assetId,
      assetType,
      isDataSharingEligible,
      translate,
    ],
  );

  const configureFiatProduct = useCallback(
    async (
      data: CreatorStoreConfigurationType,
      currentDirtyFields: FormState<CreatorStoreConfigurationType>['dirtyFields'],
    ) => {
      // If the asset is moderation / safety / rights restrictions, don't call MFS since it'll spam warning logs
      const restrictionsToCheck: Restriction[] = [
        Restriction.AssetModeration,
        Restriction.SafetyStatus,
        Restriction.RightsClaim,
      ];
      const skipMFSCallDueToAssetRestrictions =
        assetConfigurationRequirements?.publishing?.restrictions?.some((restriction) =>
          restrictionsToCheck.includes(restriction),
        );
      if (skipMFSCallDueToAssetRestrictions) {
        return;
      }
      // Call MFS if either:
      // 1. The Creator is attempting to change distribution status
      // 2. The Creator is attempting to change the price
      // 3. We need to update Stripe for a name / description change of a priced asset
      if (
        currentDirtyFields.isItemDistributed ||
        currentDirtyFields.fiatPrice ||
        (isBackendFiatProductPriced && (currentDirtyFields.description || currentDirtyFields.name))
      ) {
        try {
          let basePrice: Money | undefined;
          if (data.fiatPrice === undefined) {
            basePrice = undefined;
          } else {
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- fiatPrice JSON is form-controlled via price dropdowns
            basePrice = JSON.parse(data.fiatPrice) as Money;
          }
          const creatorStoreProductConfiguration: CreatorStoreProductConfiguration = {
            assetId,
            published: data.isItemDistributed,
            productType: assetToProduct(assetType),
            basePrice,
          };
          await configureProduct(creatorStoreProductConfiguration);
        } catch (err) {
          console.error(err);
          const errorReason = translate(`Error.FiatConfigurationGenericError`);
          throw new Error(errorReason, { cause: err });
        }
      }
    },
    [
      assetConfigurationRequirements?.publishing?.restrictions,
      assetId,
      assetType,
      configureProduct,
      isBackendFiatProductPriced,
      translate,
    ],
  );

  const configureDeveloperItem = useCallback(
    async (
      data: CreatorStoreConfigurationType,
      currentDirtyFields: FormState<CreatorStoreConfigurationType>['dirtyFields'],
    ) => {
      if (currentDirtyFields.description || currentDirtyFields.name) {
        try {
          await postDeveloperItemDetails(assetId, {
            description: data.description ?? '',
            name: data.name,
          });
        } catch (err) {
          const errorName = getEnumKeyByValue(AssetError, getErrorCode(err));
          const errorReason = translate(`Error.${errorName}`) ?? translate('Error.UnknownError');
          throw new Error(errorReason, { cause: err });
        }
      }
    },
    [assetId, translate],
  );

  const configureSocialLinks = useCallback(
    async (
      data: CreatorStoreConfigurationType,
      currentDirtyFields: FormState<CreatorStoreConfigurationType>['dirtyFields'],
    ) => {
      if (
        (currentDirtyFields.socialLinks && currentDirtyFields.socialLinks.length > 0) ||
        currentDirtyFields.tryAsset
      ) {
        try {
          const updatedPlaceId = getPlaceIdFromTryAssetFormValue(data.tryAsset);
          await updateSocialLinks(
            socialLinks,
            data.socialLinks,
            initialTryAssetPlaceId,
            updatedPlaceId,
          );
        } catch (err) {
          const errorName = getEnumKeyByValue(AssetError, getErrorCode(err));
          const errorReason = translate(`Error.${errorName}`) ?? translate('Error.UnknownError');
          throw new Error(errorReason, { cause: err });
        }
      }
    },
    [socialLinks, initialTryAssetPlaceId, translate, updateSocialLinks],
  );

  const showSuccessToast = useCallback(() => {
    enqueue(
      {
        message: (
          <span data-testid='update-success-message'>
            {translate('Message.ChangesSavedSuccess')}
          </span>
        ),
        autoHide: true,
      },
      (reason) => reason === 'timeout',
    );
  }, [enqueue, translate]);

  // Used after form submission to reset the form's default values to the newly submitted values
  const resetFormToNewDefaultValues = useCallback(
    (data: CreatorStoreConfigurationType) => {
      methods.reset({
        ...data,
        // `file` is a transient upload field; clear it so post-save thumbnail refresh
        // does not re-dirty the form when the uploader clears local selection.
        file: null,
        removeCustomThumbnail: false,
      });
    },
    [methods],
  );

  // Merges error messages if multiple APIs failed
  const createMergedErrorMessage = useCallback(
    (results: PromiseSettledResult<unknown>[]) => {
      const errorMessages = results
        .filter(
          (result): result is PromiseRejectedResult => result.status !== AllSettlePromiseSuccess,
        )
        .flatMap((result) => (result.reason instanceof Error ? [result.reason.message] : []))
        .join(', ');
      return `${errorMessages} ${translate('Message.PleaseTryAgain')}`;
    },
    [translate],
  );

  const refetchPreviewIds = useCallback(async () => {
    const { imagePreviewIds: fetchedImagePreviewIds, videoPreviewId: fetchedVideoPreviewId } =
      await fetchPreviewIds();
    setImagePreviewIds(fetchedImagePreviewIds);
    setVideoPreviewId(fetchedVideoPreviewId);
  }, [fetchPreviewIds]);

  const handleFormSubmit: SubmitHandler<CreatorStoreConfigurationType> = useCallback(
    async (data) => {
      setIsSaving(true);
      setErrorMessage(null);
      const requests: Promise<unknown>[] = [
        configureDeveloperItem(data, methods.formState.dirtyFields),
        configureSocialLinks(data, methods.formState.dirtyFields),
      ];
      if (previewsEnabledForUser) {
        requests.push(configurePreviews(data, methods));
      }
      if (isConfiguringThumbnailEnabled) {
        requests.push(configureThumbnail(data, methods));
      }
      let results = await Promise.allSettled(requests);

      // To avoid the following race condition:
      // 1. A user converts a Model on Store to a Package
      // 2. It converts, but the user is not allowed to put Packages on Store
      // 3. The Model is taken off of store
      // 4. MarketplaceFiatService does not know this and puts the asset on Store before it is recognized as a Package
      // We only call MarketplaceFiatService after the Develop API succeeds
      const developResponse = results[0];
      if (developResponse.status === AllSettlePromiseSuccess) {
        const configureFiatProductResponse = await Promise.allSettled([
          configureFiatProduct(data, methods.formState.dirtyFields),
        ]);
        results = results.concat(configureFiatProductResponse);

        if (configureFiatProductResponse[0].status === AllSettlePromiseSuccess) {
          const configureDataSharingResponse = await Promise.allSettled([
            configureDataSharing(data),
          ]);
          results = results.concat(configureDataSharingResponse);
        }
      }
      if (results.every((result) => result.status === AllSettlePromiseSuccess)) {
        showSuccessToast();
        resetFormToNewDefaultValues(data);
      } else {
        const mergedErrorMessage = createMergedErrorMessage(results);
        setErrorMessage(mergedErrorMessage);
      }
      setIsSaving(false);
    },
    [
      configureDeveloperItem,
      methods,
      configureSocialLinks,
      previewsEnabledForUser,
      isConfiguringThumbnailEnabled,
      configurePreviews,
      configureThumbnail,
      configureFiatProduct,
      configureDataSharing,
      showSuccessToast,
      resetFormToNewDefaultValues,
      createMergedErrorMessage,
    ],
  );

  // Sets a validation error on the Try Asset Place ID field and scrolls to it
  // The scroll/focus is deferred to the next tick
  // This allows React to re-render with the error state before we attempt to locate and scroll to the field
  const setTryAssetPlaceIdError = useCallback(
    (type: string, message: string) => {
      methods.setError(TRY_ASSET_PLACE_ID_KEY, { type, message });
      setTimeout(() => {
        const errorField = document.getElementById(TRY_ASSET_PLACE_ID_ELEMENT_ID);
        errorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorField?.focus();
      }, 0);
    },
    [methods],
  );

  const validateAndSubmit = useCallback(
    async (data: CreatorStoreConfigurationType) => {
      // Pre-submission validation for Try Asset Place ID
      // Only validate when mode is 'custom' (user-provided place ID)
      if (data.tryAsset.mode === TryAssetMode.Custom) {
        if (!data.tryAsset.placeId) {
          setTryAssetPlaceIdError(FORM_ERROR_TYPE_REQUIRED, translate('Error.InvalidPlaceId'));
          return;
        }

        const { isValid: isPlaceIdValid, errorMessage: placeIdErrorMessage } =
          await validateTryAssetPlaceId(data.tryAsset.placeId);
        if (!isPlaceIdValid) {
          setTryAssetPlaceIdError(FORM_ERROR_TYPE_VALIDATION, placeIdErrorMessage);
          return;
        }
      }

      // If validation passes, proceed with normal submission
      await handleFormSubmit(data);
    },
    [validateTryAssetPlaceId, setTryAssetPlaceIdError, handleFormSubmit, translate],
  );

  const onClickSave = useCallback(() => {
    const isModelCurrentlyOffStoreOrFree =
      !isBackendFiatProductDistributed || !isBackendFiatProductPriced;
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- fiatPrice JSON is form-controlled via price dropdowns
    const parsedFiatPrice = JSON.parse(methods.getValues('fiatPrice')) as Money;
    const fiatPriceSignificand = Number(parsedFiatPrice.quantity?.significand ?? 0);
    const isModelBeingDistributedAndPriced = isItemDistributedValue && fiatPriceSignificand > 0;
    if (
      isEligibleForPaidModelConfirmationWarning &&
      isModelCurrentlyOffStoreOrFree &&
      isModelBeingDistributedAndPriced
    ) {
      setOpenSellingPaidModelConfirmationDialog(true);
    } else {
      void methods.handleSubmit(validateAndSubmit)();
    }
  }, [
    isBackendFiatProductDistributed,
    isBackendFiatProductPriced,
    isItemDistributedValue,
    isEligibleForPaidModelConfirmationWarning,
    methods,
    validateAndSubmit,
  ]);

  const onConfirmSaveChanges = useCallback(() => {
    void methods.handleSubmit(validateAndSubmit)();
    setOpenSellingPaidModelConfirmationDialog(false);
  }, [methods, validateAndSubmit, setOpenSellingPaidModelConfirmationDialog]);

  const onCancelSaveChanges = useCallback(() => {
    setOpenSellingPaidModelConfirmationDialog(false);
  }, []);

  // Log how long users are waiting for asset action eligibility to be calculated
  useEffect(() => {
    if (areCompositeAssetChecksPending) {
      pageLoadingStartTimeRef.current = Date.now();
      // Only log the event if the user was actually waiting
    } else if (pageLoadingStartTimeRef.current !== null) {
      const endTime = Date.now();
      const durationMs = endTime - pageLoadingStartTimeRef.current;
      unifiedLogger.logClickEvent({
        eventName: 'assetConfiguration.assetActionEligibilityPending',
        parameters: {
          assetId,
          assetType: assetType.toString(),
          durationMs: durationMs.toString(),
        },
      });
      pageLoadingStartTimeRef.current = null;
    }
  }, [areCompositeAssetChecksPending, unifiedLogger, assetId, assetType]);

  const isFormLoading =
    loadingFrontendFlags ||
    isPageInitializing ||
    isAssetConfigurationRequirementsLoading ||
    areCompositeAssetChecksPending ||
    isBasePricesLoading ||
    isFiatProductLoading ||
    isDataSharingPreferenceLoading ||
    isWasDataSharingEnabledLoading ||
    (isPaidModelConfirmationWarningEligibilityRequired &&
      isPaidModelConfirmationWarningEligibilityPending);
  if (isFormLoading) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  const isAnyDataNull =
    !quota ||
    !developerItemDetails ||
    !assetConfigurationRequirements ||
    !basePrices ||
    !fiatProduct;
  if (isAnyDataNull) {
    onDataFetchFailed();
    return null;
  }

  return (
    <FormProvider {...methods}>
      <Grid container item classes={{ root: pageContainer }}>
        {isConfiguringThumbnailEnabled && (
          <Grid container item XSmall={12} classes={{ root: imageUploaderContainer }}>
            <ThumbnailImageUploader
              ariaDescribedBy='thumbnail-aria-description'
              enableRemovingExistingThumbnail={isRemovingThumbnailEnabled}
              hasRemovableThumbnail={hasRemovableThumbnail}
              imageType={ThumbnailImageTypes}
              imageAltText={translate('Label.PluginIcon')}
              infoSection1={
                <span>
                  <span>
                    {`${translate('Label.Format')} ${ThumbnailImageTypes.map(
                      (type) => `*.${type}`,
                    ).join(', ')}`}
                  </span>
                  {assetType === Asset.Model && (
                    <>
                      <br />
                      <span>
                        {translate('Message.AspectRatioLimitText', { aspectRatio: '1:1' })}
                      </span>
                    </>
                  )}
                </span>
              }
              infoSection2={translate('Message.Moderation')}
              onChange={handleFileChange}
              onRemoveExistingThumbnail={handleRemoveExistingThumbnail}
              ref={uploaderRef}
              targetId={parseInt(assetId, 10)}
              targetType={ThumbnailTypes.assetThumbnail}
            />
            <VisuallyHidden id='thumbnail-aria-description' aria-live='polite'>
              {methods.getValues('file')?.name
                ? translate('Label.SelectedFile', {
                    fileName: methods.getValues('file')?.name ?? '',
                  })
                : translate('Label.NoImageUploaded')}
            </VisuallyHidden>
          </Grid>
        )}
        <Grid container item classes={{ root: formContainer }} alignItems='flex-start'>
          <Grid container item XSmall={12} Large={8} XLarge={6}>
            <BasicInfoForm />
            <Grid item XSmall={12}>
              <Divider classes={{ root: divider }} />
            </Grid>
            {videoPreviewsEnabledForUser && (
              <Grid data-testid='asset-media-upload-container' item XSmall={12}>
                <UploadVideoPreviewsForm
                  uploadPreview={handleUploadPreview}
                  deletePreview={handleDeletePreview}
                  videoModerationState={videoModerationState}
                  videoType={VIDEO_PREVIEW_TYPE}
                  onVideoUploadComplete={handleVideoUploadComplete}
                  refetchPreviewIds={refetchPreviewIds}
                  noticeMessage={verificationNotice}
                />
                <Divider classes={{ root: divider }} />
              </Grid>
            )}
            {previewsEnabledForUser && (
              <Grid data-testid='asset-media-upload-container' item XSmall={12}>
                <UploadImagePreviewsForm
                  assetId={parseInt(assetId, 10)}
                  refetchPreviewIds={refetchPreviewIds}
                  uploadPreview={handleUploadPreview}
                  deletePreview={handleDeletePreview}
                  noticeMessage={verificationNotice}
                />
                <Divider classes={{ root: divider }} />
              </Grid>
            )}
            {areSocialLinksEnabledForUser && !isSocialLinksSectionHidden && (
              <Grid item XSmall={12}>
                <SocialLinksFormShard
                  assetId={parseInt(assetId, 10)}
                  assetType={assetType}
                  socialLinkTypeToTranslatedText={socialLinkTypeToTranslatedText}
                  tryAssetExistingPlaceIsPlayable={tryAssetExistingPlaceIsPlayable}
                  canCreateOrUpdate={canCreateOrUpdateSocialLinks}
                />
                <Divider classes={{ root: divider }} />
              </Grid>
            )}
            {enableAssetAccessForm && (
              <Grid item XSmall={12}>
                <AssetAccessForm
                  developerItemDetails={developerItemDetails}
                  isCreatorEligibleForAssetAccessBeta={isCreatorEligibleForAssetAccessBeta}
                  openUseRestrictions={assetConfigurationRequirements?.openUse?.restrictions ?? []}
                  onSetAssetOpenUse={() => setIsOpenUseAsset(true)}
                />
                <Divider classes={{ root: divider }} />
              </Grid>
            )}
            <DistributionFormShard
              assetConfigurationRequirements={assetConfigurationRequirements}
              assetType={assetType}
              basePrices={basePrices}
              developerItemDetails={developerItemDetails}
              fiatProduct={fiatProduct}
              frontendFlagEnableModelPricingTransition={
                frontendFlags[FrontendFlagName.FrontendFlagEnableModelPricingTransition]
              }
              isDataSharingEligible={isDataSharingEligible}
              isItemDistributedValue={isItemDistributedValue}
              isOpenUseAsset={isOpenUseAsset}
              quota={quota}
              distributionErrorState={distributionErrorState}
              isBackendFiatProductDistributed={isBackendFiatProductDistributed}
            />
          </Grid>
          {!isConfiguringThumbnailEnabled && (
            <Grid
              container
              item
              XSmall={12}
              Large={4}
              XLarge={2}
              classes={{ root: imageContainer }}>
              {thumbnailImage}
            </Grid>
          )}
        </Grid>
        <Grid container item XSmall={12} XLarge={8}>
          <Grid item XSmall={12}>
            <Divider />
          </Grid>
          <Grid container item XSmall={12} classes={{ root: buttonContainer }}>
            <Button
              classes={{ root: button }}
              color='primary'
              disabled={isSubmitting}
              onClick={() => {
                void router.push(getBackToCreationsPageLink(developerItemDetails));
              }}
              size='large'
              variant='outlined'>
              {translate('Action.Cancel')}
            </Button>
            <Tooltip
              placement='right'
              title={!isValid ? translate('Label.InvalidFormTooltipMessage') : ''}
              arrow>
              <span>
                <Button
                  classes={{ root: button }}
                  data-testid='save-button'
                  disabled={
                    !isDirty ||
                    (!isValidating && !isValid) ||
                    distributionErrorState === DistributionErrorState.PotentialPolicyViolation // Temp fix for STM-5217
                  }
                  loading={isSubmitting || isSaving}
                  onClick={onClickSave}
                  size='large'
                  variant='contained'>
                  {translate('Action.SaveChanges')}
                </Button>
              </span>
            </Tooltip>
            {errorMessage && (
              <FormHelperText classes={{ root: errorMessageContainer }}>
                {errorMessage}
              </FormHelperText>
            )}
          </Grid>
        </Grid>
      </Grid>
      {isEligibleForPaidModelConfirmationWarning &&
        (frontendFlags[FrontendFlagName.FrontendFlagEnablePaidModelDependenciesModal] ? (
          <SellingPaidModelDeepCopyModals
            assetId={parseInt(assetId, 10)}
            creator={{ id: creator.id, type: creator.type }}
            assetName={developerItemDetails.name}
            open={openSellingPaidModelConfirmationDialog}
            onCancel={onCancelSaveChanges}
            onConfirm={onConfirmSaveChanges}
          />
        ) : (
          <SellingPaidModelConfirmationWarning
            assetId={parseInt(assetId, 10)}
            creator={{ id: creator.id, type: creator.type }}
            open={openSellingPaidModelConfirmationDialog}
            onCancel={onCancelSaveChanges}
            onConfirm={onConfirmSaveChanges}
          />
        ))}
    </FormProvider>
  );
};

export default CreatorStoreConfiguration;
