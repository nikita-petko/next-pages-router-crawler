import { Divider } from '@rbx/foundation-ui';
import { Button, Grid, makeStyles } from '@rbx/ui';
import { Formik } from 'formik';
import { isEmpty, omit } from 'lodash';
import { useRouter } from 'next/router';
import { ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { EventName, unifiedLogger } from '@clients/unifiedLogger';
import CampaignBreadcrumbs from '@components/campaignBuilder/common/Breadcrumbs';
import AdsManagerPageBaseLayout from '@components/common/AdsManagerDefaultLayout';
import CampaignWizardBanner from '@components/common/CampaignWizardBanner';
import { getCreatorHubPageLayout } from '@components/common/CreatorHubPageLayout';
import { openEntitySubmitErrorDialog } from '@components/common/dialog/entitySubmitErrorDialog';
import { openErrorDialog } from '@components/common/dialog/errorDialog';
import { CampaignObjectiveType, DefaultTimeZone } from '@constants/campaignBuilder';
import Routes from '@constants/routes';
import {
  createCampaignV2,
  getAd,
  getAdSet,
  getCampaign,
  getCampaignV2,
  getCanAccessUniverses,
} from '@modules/clients/ads/adsClient';
import { BudgetType, PaymentMethodType } from '@modules/clients/ads/adsClientTypes';
import {
  ClientToServer,
  mapServerAdTypeToFormik,
} from '@modules/clients/ads/serverClientTransformationUtilities';
import { CampaignConfigurationSummary } from '@modules/creation/components/campaignConfigurationSummary';
import CreateAdConfigurationForm from '@modules/creation/components/createAdConfigurationForm/createAdConfigurationForm';
import {
  CLASSIC_DISABLED_SPONSORED_AND_SEARCH_BANNER_TEXT_BEFORE_LINK,
  CreateAdSetConfigurationForm,
} from '@modules/creation/components/createAdSetConfigurationForm';
import {
  AudienceEstimateEnum,
  AudienceEstimateType,
  CreateAudienceEstimate,
} from '@modules/creation/components/createAudienceEstimate';
import { CreateCampaignConfigurationForm } from '@modules/creation/components/createCampaignConfigurationForm';
import { CreateCampaignStepper } from '@modules/creation/components/createCampaignStepper';
import {
  CreateCampaignMetadataContext,
  CreateCampaignMetadataContextProvider,
} from '@modules/creation/contexts/createCampaignPageContext';
import {
  CreateCampaignWizardInitialValuesType,
  createCampaignWizardModel,
  getCreateCampaignWizardInitialValues,
  getFullCampaignValidationSchema,
} from '@modules/creation/wizard/models/createCampaignWizard/createCampaignWizardModel';
import {
  fetchAssetThumbnailInfo,
  fetchGameThumbnailInfo,
  fetchUniverseName,
  getUpdatedFormikValues,
} from '@modules/creation/wizard/models/createCampaignWizard/createCampaignWizardUtilities';
import { useIdempotencyKeyStore } from '@modules/stores/idempotencyKeyStoreProvider';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { useModalStore } from '@stores/modalStoreProvider';
import { AdFormatType, ServerAdAssetCompositeReviewDecisionType } from '@type/ad';
import { AMAErrorResponseType } from '@type/errorResponse';
import { UniverseShapeType } from '@type/universe';
import { MicroUsdToUsd } from '@utils/currency';
import { CaptureException } from '@utils/error';
import { GetLocalStorage, StorageKeys } from '@utils/localStorage';
import { GetTimezoneObjFromEnum } from '@utils/timezone';

const NewCampaignWizardDefaults = {
  adSetToPopulate: '',
  campaignToPopulate: '',
  handleSubmitBodyFn: undefined,
  isAdFormDisabled: false,
  isAdSetFormDisabled: false,
  isCampaignFormDisabled: false,
  prechargeAmountValue: '5.00 USD', // TODO, fetch from AMA in future release
  showSummaryAdSetEditButton: true,
  showSummaryCampaignEditButton: true,
  successDialogCTAText: 'MANAGE CAMPAIGNS',
  successDialogText: 'Your campaign will go live soon after moderation approval.',
  successDialogTitle: 'Campaign Created',
  successTileAdDialogText: 'Your campaign is live!',
  wizardHeader: 'Create Campaign',
  wizardHeaderFinalStep: 'Review Campaign',
};

// TODO: Make Translated String - Ads Manager
const NewCampaignWizard = ({
  adSetToPopulate = NewCampaignWizardDefaults.adSetToPopulate,
  campaignToPopulate = NewCampaignWizardDefaults.campaignToPopulate,
  handleSubmitBodyFn = NewCampaignWizardDefaults.handleSubmitBodyFn,
  isAdFormDisabled = NewCampaignWizardDefaults.isAdFormDisabled,
  isAdSetFormDisabled = NewCampaignWizardDefaults.isAdSetFormDisabled,
  isCampaignFormDisabled = NewCampaignWizardDefaults.isCampaignFormDisabled,
  onSuccessDialogCTAClick,
  prechargeAmountValue = NewCampaignWizardDefaults.prechargeAmountValue,
  showSummaryAdSetEditButton = NewCampaignWizardDefaults.showSummaryAdSetEditButton,
  showSummaryCampaignEditButton = NewCampaignWizardDefaults.showSummaryCampaignEditButton,
  successDialogCTAText = NewCampaignWizardDefaults.successDialogCTAText,
  successDialogText = NewCampaignWizardDefaults.successDialogText,
  successDialogTitle = NewCampaignWizardDefaults.successDialogTitle,
  successTileAdDialogText = NewCampaignWizardDefaults.successTileAdDialogText,
  wizardHeader = NewCampaignWizardDefaults.wizardHeader,
  wizardHeaderFinalStep = NewCampaignWizardDefaults.wizardHeaderFinalStep,
}: any) => {
  const router = useRouter();
  const adAccountIsExternalManaged = useAppStore(
    (state: AppStoreType) => state.adAccountIsExternalManaged,
  );
  const adAccountIsInternalManaged = useAppStore(
    (state: AppStoreType) => state.adAccountIsInternalManaged,
  );
  const accountIsManaged = adAccountIsExternalManaged();
  const accountIsInternal = adAccountIsInternalManaged();
  const isBusinessOrganization = useAppStore((state: AppStoreType) =>
    state.organizationIsBusiness(),
  );
  const advertisingEnabled = useAppStore((state: AppStoreType) =>
    state.advertisingShouldBeEnabled(),
  );
  const {
    adAccountId = GetLocalStorage(StorageKeys.AD_ACCOUNT_ID),
    adCreditActivated,
    adCreditBalance,
    coreCountryOverrideCodeList,
    coreRegionCodeList,
    coreRegionFloorPriceUsd,
    cpcCeilingPriceUsd,
    cpcFloorPriceUsd,
    cpmMaximumBidUsd,
    cpmMinimumBidUsd,
    cptMaximumBidUsd,
    cptMinimumBidUsd,
    mixedRegionFloorPriceUsd,
    opportunisticRegionCodeList,
    opportunisticRegionFloorPriceUsd,
    organizationInfo,
    paymentProfiles,
    portalAdsMaximumBidValueUsd,
    showAudienceEstimate,
    strategicRegionCodeList,
    strategicRegionFloorPriceUsd,
    tileAdsMaximumBidValueUsd,
    tileAdsMinimumBidValueUsd,
    videoMinBidMappingsMicroUsd,
  } = useAppStore((state: AppStoreType) => state.appData);

  const campaignMinimumDailyBudgetMicroUsd = useAppStore(
    (state) => state.appMetadataState?.data?.campaignMinimumDailyBudgetMicroUsd,
  );

  const campaignMinimumDailyBudgetUsd = campaignMinimumDailyBudgetMicroUsd
    ? MicroUsdToUsd(campaignMinimumDailyBudgetMicroUsd)
    : 10.0;

  const {
    query: { adIdToClone, adSetIdToClone, campaignIdToClone },
  } = useRouter();
  const isInCloneMode = Boolean(campaignIdToClone && adIdToClone && adSetIdToClone);
  const [shouldShowOneTimeCloningTreatment, setShouldShowOneTimeCloningTreatment] =
    useState<boolean>(isInCloneMode);
  const [formikInitialValues, setFormikInitialValues] = useState<
    Partial<CreateCampaignWizardInitialValuesType>
  >(
    getCreateCampaignWizardInitialValues(
      accountIsInternal,
      accountIsManaged,
      campaignMinimumDailyBudgetUsd,
      paymentProfiles && paymentProfiles.length > 0,
      Boolean(adCreditActivated),
      organizationInfo,
    ),
  );
  const navigateToHomePage = () => {
    router.push({
      pathname: Routes.CLASSIC,
      query: {
        tableView: 'campaigns',
      },
    });
  };

  const { formId } = createCampaignWizardModel;
  const idempotencyKey = useIdempotencyKeyStore((state) => state.idempotencyKey);
  const setIdempotencyKey = useIdempotencyKeyStore((state) => state.setIdempotencyKey);

  const {
    classes: {
      campaignInformationContainer,
      createCampaignColumns,
      createCampaignContainerContents,
      stepperButton,
      stepperButtonsContainer,
      stepperNavigationControlsContainer,
    },
  } = makeStyles()(() => ({
    campaignInformationContainer: {
      marginTop: '175px',
      minHeight: '100%',
      width: '50%',
    },

    createCampaignColumns: {
      display: 'flex',
      flexDirection: 'row',
      gap: '32px',
    },

    createCampaignContainerContents: {
      height: '100%',
      maxWidth: 880,
      // To cover 3 cards side by side for the brand suitability selection
      minWidth: 830,
      width: '50%',
    },

    prechargeInformationContainer: {
      marginBottom: '48px',
      marginTop: '48px',
    },

    stepperButton: {
      marginRight: 10,
    },

    stepperButtonsContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 10,
      marginTop: 10,
      paddingTop: 10,
    },

    stepperNavigationControlsContainer: {
      paddingTop: 30,
    },
  }))();

  // `setModalConfigData` / `setModalOpen` remain for the inline confirm modal
  // ("Are you sure?") and the precharge confirmation modal. Generic errors
  // now go through `openErrorDialog`; the inline custom modals are tracked
  // separately for future migration.
  const { setModalConfigData, setModalOpen } = useModalStore();

  const {
    activeStep,
    isCreditCardPrechargeForAccountRequired,
    setActiveStep,
    setDestinationInfoToPreselect,
    setUniversesCanAccess,
    setUploadedImage,
    setUploadedVideo,
    steps,
    universesCanAccess = [],
  } = useContext(CreateCampaignMetadataContext);
  const timeZone = organizationInfo.time_zone
    ? GetTimezoneObjFromEnum(organizationInfo.time_zone).timezoneDbName
    : DefaultTimeZone.timezoneDbName;

  const { currStep } = router.query;

  useEffect(() => {
    if (typeof currStep === 'string') {
      setActiveStep(parseInt(currStep, 10));
    }
  }, [currStep]);

  const [estimate, setEstimate] = useState<AudienceEstimateType>({
    estimateLowerBound: 0,
    estimateNum: 0,
    estimateStatus: AudienceEstimateEnum.Audience_Estimate_Loading,
    estimateUpperBound: 0,
    showAudienceGenreDisclaimer: false,
  });
  const [createCampaignPageIsLoading, setCreateCampaignPageIsLoading] = useState(true);

  const fetchCampaignsAds = useCallback(async () => {
    try {
      const fetchedCampaignInfoRes = await getCampaignV2(campaignToPopulate!);
      const { campaign = {} } = fetchedCampaignInfoRes;
      const { universe_id } = campaign;
      setDestinationInfoToPreselect({
        universeId: universe_id,
      });
    } catch (e) {
      CaptureException(e as Error);
    }
  }, []);

  const fetchUniversesCurrentUserHasAccessTo = useCallback(async () => {
    const fetchedUniverses = await getCanAccessUniverses();
    if (fetchedUniverses && fetchedUniverses.universes) {
      const universeInfoResults =
        fetchedUniverses.universes.map((universe: UniverseShapeType) => {
          const updatedUniverse = universe;
          // Fill with default false if undefined
          if (universe.paid_access === undefined) {
            updatedUniverse.paid_access = false;
          }
          // Fill with default false if undefined
          if (universe.seventeen_plus_age_rating === undefined) {
            updatedUniverse.seventeen_plus_age_rating = false;
          }
          return updatedUniverse;
        }) || [];
      setUniversesCanAccess(universeInfoResults);
    }
    return {};
  }, []);

  const fetchInfoForCloning = useCallback(async () => {
    try {
      // Fetch the campaign info, adset info and ad info to clone
      const [{ campaign }, { ad_set: adSet }, { ad }] = await Promise.all([
        getCampaign(campaignIdToClone as string),
        getAdSet(adSetIdToClone as string),
        getAd(adIdToClone as string),
      ]);
      let updatedFormikValues = getUpdatedFormikValues(campaign, adSet, ad, timeZone);

      // Fetch the thumbnail for the asset
      const adFormatType = mapServerAdTypeToFormik(ad?.type);
      let assetId;
      let universeId;
      switch (adFormatType) {
        case AdFormatType.PORTAL:
          assetId = ad.portal_ad_metadata?.banner_asset_metadata.asset_id;
          universeId = ad.portal_ad_metadata?.target_place_id;
          break;
        case AdFormatType.TILE:
          universeId = ad.sponsored_universe_ad_metadata?.target_universe_id;
          break;
        case AdFormatType.SEARCH:
          universeId = ad.search_ad_metadata?.target_universe_id;
          break;
        case AdFormatType.VIDEO:
          assetId = ad.video_ad_metadata?.asset_metadata.asset_id;
          break;
        default:
          assetId = ad.display_ad_metadata?.asset_metadata.asset_id;
          break;
      }

      const { adAssetId, adGameThumbnailUrl, adPortalDestinationText, adVideoAssetId } =
        createCampaignWizardModel.formField;
      if (
        updatedFormikValues?.compositeReviewDecision ===
        ServerAdAssetCompositeReviewDecisionType.REJECTED
      ) {
        updatedFormikValues = omit(updatedFormikValues, [adAssetId.name, adVideoAssetId.name]);
      } else if (adFormatType === AdFormatType.TILE || adFormatType === AdFormatType.SEARCH) {
        if (universeId) {
          await Promise.all([fetchGameThumbnailInfo(universeId), fetchUniverseName(universeId)])
            .then(([thumbnailUrl, name]) => {
              updatedFormikValues = {
                ...updatedFormikValues,
                [adGameThumbnailUrl.name]: thumbnailUrl,
                [adPortalDestinationText.name]: name,
              };
              setUploadedImage(thumbnailUrl);
            })
            .catch(() => {
              CaptureException('Could not fetch the image url');
            });
        }
      } else if (assetId) {
        await fetchAssetThumbnailInfo(assetId)
          .then((thumbnailUrl: string) => {
            if (adFormatType === AdFormatType.VIDEO) {
              setUploadedVideo(thumbnailUrl);
            } else {
              setUploadedImage(thumbnailUrl);
            }
          })
          .catch(() => {
            CaptureException('Could not fetch the image url');
          });
      }
      return updatedFormikValues;
    } catch (e) {
      CaptureException(e as Error);
    }
    return {};
  }, []);

  useEffect(() => {
    Promise.all([
      fetchUniversesCurrentUserHasAccessTo(),
      isInCloneMode ? fetchInfoForCloning() : Promise.resolve({}),
      campaignToPopulate ? fetchCampaignsAds() || {} : Promise.resolve({}),
    ])
      .then(([updatedFormikValuesFromUniverses, updatedFormikValuesfromCloning]) => {
        setFormikInitialValues((prevValues) => ({
          ...prevValues,
          ...updatedFormikValuesFromUniverses,
          ...updatedFormikValuesfromCloning,
          [createCampaignWizardModel.formField.campaignAdCreditBalanceMicro.name]: adCreditBalance,
        }));
      })
      .catch((err) => {
        CaptureException(err as Error);
      })
      .finally(() => {
        setCreateCampaignPageIsLoading(false);
      });
  }, [fetchUniversesCurrentUserHasAccessTo, fetchInfoForCloning]);

  useEffect(() => {
    setIdempotencyKey(uuidv4());
  }, []);

  useEffect(() => {
    if (!advertisingEnabled.advertisingShouldBeEnabled) {
      navigateToHomePage();
    }
  }, [advertisingEnabled]);

  const breadcrumbRef = useRef<null | HTMLDivElement>(null);
  useEffect(() => {
    if (breadcrumbRef?.current) {
      breadcrumbRef?.current?.scrollIntoView();
    }
  }, [activeStep]);

  const handleNext = () => {
    unifiedLogger.logClickEvent({
      eventName:
        EventName.AdsCreationFlowStep +
        (typeof activeStep === 'number' ? steps![activeStep].replace(' ', '') : 'Unknown'),
      parameters: { adAccountId },
    });
    (setActiveStep as any)((prevActiveStep: number) => prevActiveStep + 1);
  };

  const handleBack = (formik: any) => {
    if (activeStep === 0) {
      if (isEmpty(formik.touched)) {
        navigateToHomePage();
      } else {
        setModalConfigData({
          // @ts-ignore
          dialogActions: (
            <>
              <Button
                onClick={() => {
                  setModalOpen(false);
                }}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setModalOpen(false);
                  navigateToHomePage();
                }}
                variant='contained'>
                Go Back To My Campaigns
              </Button>
            </>
          ),
          dialogContent: 'You will lose your campaign configuration progress',
          handleClose: (_: any, reason: string) => {
            if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
              return;
            }
            setModalOpen(false);
          },
          title: 'Are you sure?',
        });
        setModalOpen(true);
      }
      return;
    }

    (setActiveStep as any)((prevActiveStep: number) => prevActiveStep - 1);
  };

  const isLastStep = () => {
    return activeStep === steps!.length;
  };

  const [submitting, setSubmitting] = useState<boolean>(false);

  const showSuccessfulCampaignCreationModal = (campaignId: string, values: any) => {
    unifiedLogger.logImpressionEvent({
      eventName: EventName.SubmitCampaignSuccessModal,
      parameters: { adAccountId },
    });
    setSubmitting(false);
    const onSubmit = () => {
      unifiedLogger.logClickEvent({
        eventName: EventName.OnSubmitManageCampaignsButtonClicked,
        parameters: { adAccountId },
      });
      setModalOpen(false);

      if (onSuccessDialogCTAClick) {
        onSuccessDialogCTAClick();
        return;
      }

      if (navigateToHomePage) {
        navigateToHomePage();
      }
    };
    const addAdSet = () => {
      setModalOpen(false);
      router.push({
        pathname: Routes.CREATE_ADSET,
        query: {
          campaignId,
          currStep: 1,
        },
      });
    };

    const isNewCampaign = router.pathname === Routes.CREATE_CAMPAIGN;

    const isTileAd = values.adType === AdFormatType.TILE;

    const modalDialogActions = (
      <>
        {isNewCampaign && (
          <Button onClick={addAdSet} variant='outlined'>
            Add Ad Set
          </Button>
        )}
        <Button onClick={onSubmit} variant='contained'>
          {successDialogCTAText}
        </Button>
      </>
    );

    const handleModalClose = (_: unknown, reason: string) => {
      if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
        return;
      }
      setModalOpen(false);
    };

    setModalConfigData({
      // @ts-ignore
      dialogActions: modalDialogActions,
      dialogContent: isTileAd ? successTileAdDialogText : successDialogText,
      handleClose: handleModalClose,
      title: successDialogTitle,
    });

    setModalOpen(true);
  };

  const dailySpendLimitMicroUsd = useAppStore(
    (state) => state.advertiserState.data?.ad_account?.daily_spend_limit_micro_usd || 0,
  );
  const dailySpendLimitUsd = MicroUsdToUsd(dailySpendLimitMicroUsd);

  const currentValidationSchema = getFullCampaignValidationSchema(
    dailySpendLimitUsd,
    accountIsManaged,
    accountIsInternal,
    cpmMinimumBidUsd || 1.0,
    cptMinimumBidUsd || 0.1,
    tileAdsMinimumBidValueUsd || 1.0,
    portalAdsMaximumBidValueUsd || 1.0,
    tileAdsMaximumBidValueUsd || 1.0,
    campaignMinimumDailyBudgetUsd,
    cpmMaximumBidUsd || 100.0,
    cptMaximumBidUsd || 100.0,
    coreRegionFloorPriceUsd || 0.2,
    strategicRegionFloorPriceUsd || 0.2,
    opportunisticRegionFloorPriceUsd || 0.03,
    mixedRegionFloorPriceUsd || 0.1,
    coreRegionCodeList || [],
    strategicRegionCodeList || [],
    opportunisticRegionCodeList || [],
    coreCountryOverrideCodeList || [],
    timeZone,
    cpcFloorPriceUsd || 0.1,
    cpcCeilingPriceUsd || 100.0,
    universesCanAccess,
    { videoMinBidMappingsMicroUsd },
  );

  // This converts formik values into request object and send to backend for
  // creating campaign or adset or ad and show error or success modal based on
  // the server response
  const sendCreationRequestToServer = (values: any, actions: any) => {
    setSubmitting(true);
    if (handleSubmitBodyFn) {
      handleSubmitBodyFn(values, actions)
        .then((res: any) => {
          if (res.status === 200) {
            res.json().then((successResponse: any) => {
              showSuccessfulCampaignCreationModal(successResponse.campaign_id, values);
            });
          } else {
            res.json().then((obj: AMAErrorResponseType) => {
              const errorMessage = obj.error?.message;
              try {
                unifiedLogger.logImpressionEvent({
                  eventName: EventName.SubmitCampaignError,
                  parameters: {
                    adAccountId: adAccountId || '',
                    errorMessage,
                    formValues: JSON.stringify(values) || '',
                    responseStatusCode: res.status.toString(),
                  },
                });
              } catch (e) {
                CaptureException(e as Error);
              }
              openEntitySubmitErrorDialog(obj, { editMode: false });
            });
          }
        })
        .catch(() => {
          setSubmitting(false);
          try {
            unifiedLogger.logImpressionEvent({
              eventName: EventName.SubmitCampaignError,
              parameters: {
                adAccountId: adAccountId || '',
                errorMessage: 'handleSubmitBodyFn error while submitting campaign',
                formValues: JSON.stringify(values) || '',
              },
            });
          } catch (logError) {
            CaptureException(logError as Error);
          }
          openErrorDialog();
        })
        .finally(() => {
          setSubmitting(false);
        });
    } else {
      const campaignDataToSubmit = ClientToServer.convertFormikDataToCampaignForSubmittingV2(
        values,
        isBusinessOrganization,
        idempotencyKey,
        accountIsManaged || accountIsInternal,
        timeZone,
      );

      createCampaignV2(campaignDataToSubmit)
        .then((res) => {
          if (res.status === 200) {
            res.json().then((successResponse: any) => {
              showSuccessfulCampaignCreationModal(successResponse.campaign_id, values);
            });
          } else {
            res.json().then((obj: AMAErrorResponseType) => {
              const errorMessage = obj.error?.message;
              try {
                unifiedLogger.logImpressionEvent({
                  eventName: EventName.SubmitCampaignError,
                  parameters: {
                    adAccountId: adAccountId || '',
                    errorMessage,
                    formValues: JSON.stringify(values) || '',
                    responseStatusCode: res.status.toString(),
                  },
                });
              } catch (e) {
                CaptureException(e as Error);
              }
              openEntitySubmitErrorDialog(obj, { editMode: false });
            });
          }
        })
        .catch(() => {
          try {
            unifiedLogger.logImpressionEvent({
              eventName: EventName.SubmitCampaignError,
              parameters: {
                adAccountId: adAccountId || '',
                errorMessage: 'createCampaign error while submitting campaign',
                formValues: JSON.stringify(values) || '',
              },
            });
          } catch (logError) {
            CaptureException(logError as Error);
          }
          openErrorDialog();
        })
        .finally(() => {
          setSubmitting(false);
        });
    }
  };

  const showPrechargeConfirmationModal = (values: any, actions: any) => {
    const onSubmit = () => {
      setModalOpen(false);
      sendCreationRequestToServer(values, actions);
    };
    setSubmitting(true);

    setModalConfigData({
      // @ts-ignore
      dialogActions: (
        <>
          <Button
            onClick={() => {
              setModalOpen(false);
              setSubmitting(false);
            }}
            variant='outlined'>
            Go back
          </Button>
          <Button onClick={() => onSubmit()} variant='contained'>
            Proceed
          </Button>
        </>
      ),
      dialogContent: `${prechargeAmountValue} will be deducted from your card. This amount will go toward your first billing. Any unused balance will be refunded to your card on the same billing cycle.`,
      handleClose: (_: any, reason: string) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          return;
        }

        setModalOpen(false);
      },
      title: 'Precharge Required',
    });
    setModalOpen(true);
  };

  const handleSubmit = (values: any, actions: any) => {
    try {
      unifiedLogger.logClickEvent({
        eventName: EventName.SubmitCampaignButtonClicked,
        parameters: {
          adAccountId: adAccountId || '',
          adCreditBalance: MicroUsdToUsd(adCreditBalance || 0).toString(),
          cloningAdId: JSON.stringify(router.query.adIdToClone),
          cloningAdSetId: JSON.stringify(router.query.adSetIdToClone),
          cloningCampaignId: JSON.stringify(router.query.campaignIdToClone),
          formValues: JSON.stringify(values) || '',
        },
      });
    } catch (e) {
      CaptureException(e as Error);
    }
    if (isLastStep()) {
      // TODO: find a reliable way to determine if this is a new campaign
      const isNewCampaign = router.pathname === Routes.CREATE_CAMPAIGN;
      if (
        isNewCampaign &&
        values.campaignPaymentMethod === PaymentMethodType.CARD &&
        isCreditCardPrechargeForAccountRequired
      ) {
        showPrechargeConfirmationModal(values, actions);
      } else {
        sendCreationRequestToServer(values, actions);
      }
    }
  };

  return (
    <AdsManagerPageBaseLayout isLoading={createCampaignPageIsLoading}>
      <div>
        <Formik
          enableReinitialize={shouldShowOneTimeCloningTreatment}
          initialValues={formikInitialValues}
          onSubmit={handleSubmit}
          validateOnMount={shouldShowOneTimeCloningTreatment}
          validationSchema={currentValidationSchema}>
          {(formik) => {
            const stepIsValid0 = () => {
              // TODO: Use type below
              const isDailyType = formik.values.campaignBudgetType === BudgetType.DAILY;
              const endInfoSet = formik.values.campaignEndTime && formik.values.campaignEndDate;
              const visitsObjectiveSelected =
                formik.values.campaignObjective === CampaignObjectiveType.VISITS;

              let validAdvertiserName;
              if (isBusinessOrganization) {
                validAdvertiserName = formik.values.campaignAdvertiserNameError === '';
              } else {
                validAdvertiserName = true;
              }

              const validIgnoringEndDate =
                formik.values.campaignObjective &&
                formik.values.campaignName &&
                formik.values.campaignBudgetType &&
                formik.values.campaignBudgetCapUsd &&
                formik.values.campaignStartTimestampMs &&
                formik.values.campaignStartTime &&
                formik.values.campaignStartDate &&
                !(formik as any).errors[
                  createCampaignWizardModel.formField.campaignObjective.name
                ] &&
                !(formik as any).errors[createCampaignWizardModel.formField.campaignName.name] &&
                !(formik as any).errors[
                  createCampaignWizardModel.formField.campaignBudgetType.name
                ] &&
                !(formik as any).errors[
                  createCampaignWizardModel.formField.campaignBudgetCapUsd.name
                ] &&
                !(formik as any).errors[
                  createCampaignWizardModel.formField.campaignStartTimestampMs.name
                ] &&
                !(formik as any).errors[
                  createCampaignWizardModel.formField.campaignStartTime.name
                ] &&
                !(formik as any).errors[createCampaignWizardModel.formField.campaignEndTime.name] &&
                !(formik as any).errors[createCampaignWizardModel.formField.campaignEndDate.name] &&
                !(formik as any).errors[createCampaignWizardModel.formField.campaignStartDate.name];

              let universeSelectionValid = true;

              if (visitsObjectiveSelected) {
                universeSelectionValid = Boolean(
                  formik?.values?.adPortalDestinationPlaceId &&
                  !(formik as any).errors[
                    createCampaignWizardModel.formField.adPortalDestinationPlaceId.name
                  ],
                );
              }

              if (isDailyType) {
                // Don't care about end date
                return Boolean(
                  validIgnoringEndDate && validAdvertiserName && universeSelectionValid,
                );
              }
              return Boolean(
                validIgnoringEndDate && endInfoSet && validAdvertiserName && universeSelectionValid,
              );
            };

            const stepIsValid1 = () => {
              const validExperienceTypesSelection =
                !(formik as any).errors[createCampaignWizardModel.formField.adSetPaidAccess.name] &&
                !(formik as any).errors[
                  createCampaignWizardModel.formField.adSetRestrictedMaturity.name
                ];

              const validAgeBucketTargeting =
                formik?.values?.adSetAgeBucketTargeting?.ageBuckets?.length &&
                !(formik as any).errors[
                  createCampaignWizardModel.formField.adSetAgeBucketTargeting.name
                ];

              const validRegionTargeting =
                (formik?.values?.adSetMixedRegionAndCountryTargeting?.regions?.length ||
                  formik?.values?.adSetMixedRegionAndCountryTargeting?.countries?.length) &&
                !(formik as any).errors[
                  createCampaignWizardModel.formField.adSetMixedRegionAndCountryTargeting.name
                ];

              const validBrandSuitability =
                formik?.values?.adSetBrandSuitabilityType &&
                !(formik as any).errors[
                  createCampaignWizardModel.formField.adSetBrandSuitabilityType.name
                ];

              const validGenreTargeting =
                formik?.values?.adSetGenreTargeting?.genres?.length &&
                !(formik as any).errors[
                  createCampaignWizardModel.formField.adSetGenreTargeting.name
                ];

              const validIgnoringLocationAndAge =
                formik?.values?.adSetName &&
                formik?.values?.adSetBidType &&
                formik?.values?.adSetLanguageTargeting?.languages?.length &&
                formik?.values?.adSetLanguageTargeting?.languages?.length <= 10 &&
                formik?.values?.adSetGenderTargeting?.gender &&
                formik?.values?.adSetDeviceTargeting?.devices?.length &&
                formik?.values?.adSetBidValueUsd &&
                !(formik as any).errors[createCampaignWizardModel.formField.adSetName.name] &&
                !(formik as any).errors[createCampaignWizardModel.formField.adSetBidType.name] &&
                !(formik as any).errors[
                  createCampaignWizardModel.formField.adSetLanguageTargeting.name
                ] &&
                !(formik as any).errors[
                  createCampaignWizardModel.formField.adSetGenderTargeting.name
                ] &&
                !(formik as any).errors[
                  createCampaignWizardModel.formField.adSetDeviceTargeting.name
                ] &&
                !(formik as any).errors[
                  createCampaignWizardModel.formField.adSetBidValueUsd.name
                ] &&
                !(formik as any).errors[
                  createCampaignWizardModel.formField.adSetFrequencyCapValue.name
                ];

              return Boolean(
                validExperienceTypesSelection &&
                validBrandSuitability &&
                validIgnoringLocationAndAge &&
                validRegionTargeting &&
                validAgeBucketTargeting &&
                validGenreTargeting,
              );
            };

            const stepIsValid2 = () => {
              if (formik.values.campaignObjective === CampaignObjectiveType.VISITS) {
                const validAdWithoutAssetId = Boolean(
                  formik?.values?.adName &&
                  formik?.values?.adType &&
                  formik?.values?.adPortalDestinationPlaceId &&
                  !(formik as any).errors[createCampaignWizardModel.formField.adName.name] &&
                  !(formik as any).errors[createCampaignWizardModel.formField.adType.name] &&
                  !(formik as any).errors[
                    createCampaignWizardModel.formField.adPortalDestinationPlaceId.name
                  ],
                );

                if (
                  formik?.values?.adType === AdFormatType.TILE ||
                  formik?.values?.adType === AdFormatType.SEARCH
                ) {
                  return validAdWithoutAssetId;
                }

                return Boolean(
                  validAdWithoutAssetId &&
                  formik?.values?.adAssetId &&
                  !(formik as any).errors[createCampaignWizardModel.formField.adAssetId.name],
                );
              }

              if (formik?.values?.adType === AdFormatType.VIDEO) {
                return Boolean(
                  formik?.values?.adName &&
                  formik?.values?.adType &&
                  formik?.values?.adVideoAssetId &&
                  !(formik as any).errors[createCampaignWizardModel.formField.adName.name] &&
                  !(formik as any).errors[createCampaignWizardModel.formField.adType.name] &&
                  !(formik as any).errors[createCampaignWizardModel.formField.adVideoAssetId.name],
                );
              }

              return Boolean(
                formik?.values?.adName &&
                formik?.values?.adType &&
                formik?.values?.adAssetId &&
                !(formik as any).errors[createCampaignWizardModel.formField.adName.name] &&
                !(formik as any).errors[createCampaignWizardModel.formField.adType.name] &&
                !(formik as any).errors[createCampaignWizardModel.formField.adAssetId.name],
              );
            };

            const isNextDisabled = () => {
              if (activeStep === 0) {
                return !stepIsValid0();
              }

              if (activeStep === 1) {
                return !stepIsValid1();
              }

              if (activeStep === 2) {
                return !stepIsValid2();
              }

              return false;
            };

            const formReadyForSubmit = () => {
              let allBaseFieldsFilledOut = Boolean(
                formik?.values?.campaignObjective &&
                formik?.values?.campaignName &&
                formik?.values?.campaignBudgetType &&
                formik?.values?.campaignBudgetCapUsd &&
                formik?.values?.campaignStartTimestampMs &&
                formik?.values?.adSetName &&
                formik?.values?.adSetBidType &&
                formik?.values?.adSetBidValueUsd,
              );
              // TODO: Check if this exists if it's a portal ad:
              // formik?.values?.adPortalDestinationPlaceId
              const formValid = formik?.isValid;

              if (formik.values.adType !== AdFormatType.SEARCH) {
                allBaseFieldsFilledOut =
                  allBaseFieldsFilledOut &&
                  Boolean(
                    formik?.values?.adSetLanguageTargeting?.languages?.length &&
                    formik?.values?.adSetGenderTargeting?.gender &&
                    formik?.values?.adSetDeviceTargeting?.devices?.length &&
                    formik?.values?.adSetAgeBucketTargeting?.ageBuckets?.length,
                  );

                allBaseFieldsFilledOut =
                  allBaseFieldsFilledOut &&
                  Boolean(
                    formik?.values?.adSetMixedRegionAndCountryTargeting?.regions?.length ||
                    formik?.values?.adSetMixedRegionAndCountryTargeting?.countries?.length,
                  );
              }

              if (formik?.values?.adType === AdFormatType.TILE) {
                return (
                  allBaseFieldsFilledOut && formValid && formik?.values?.adDestinationUniverseId
                );
              }

              if (formik.values?.adType === AdFormatType.VIDEO) {
                return (
                  allBaseFieldsFilledOut &&
                  formValid &&
                  formik?.values?.adSetGenreTargeting?.genres?.length &&
                  formik?.values?.adVideoAssetId
                );
              }
              return (
                allBaseFieldsFilledOut &&
                formValid &&
                formik?.values?.adSetGenreTargeting?.genres?.length &&
                formik?.values?.adAssetId
              );
            };

            const canSelectStep = (stepNumber?: number) => {
              if (stepNumber === 0) {
                return true;
              }

              if (stepNumber === 1) {
                return stepIsValid0();
              }

              if (stepNumber === 2) {
                return stepIsValid0() && stepIsValid1();
              }

              return true;
            };

            return (
              <div className={createCampaignColumns}>
                <div className={createCampaignContainerContents}>
                  <h1> {isLastStep() ? wizardHeaderFinalStep : wizardHeader}</h1>
                  {!isLastStep() && (
                    <>
                      {!isCampaignFormDisabled && activeStep !== 1 && (
                        <CampaignWizardBanner
                          textAfterLink='.'
                          textBeforeLink='Create ads faster with AI optimization and custom thumbnails in the new '
                        />
                      )}
                      {activeStep === 1 &&
                        formik.values.campaignObjective === CampaignObjectiveType.VISITS && (
                          <CampaignWizardBanner
                            textAfterLink='.'
                            textBeforeLink={
                              CLASSIC_DISABLED_SPONSORED_AND_SEARCH_BANNER_TEXT_BEFORE_LINK
                            }
                          />
                        )}
                      <CreateCampaignStepper
                        canSelectStep={canSelectStep}
                        orientation='horizontal'
                      />
                    </>
                  )}

                  <form id={formId}>
                    {activeStep === 0 && (
                      <CreateCampaignConfigurationForm
                        disableInputs={isCampaignFormDisabled}
                        formikInfo={formik}
                        isInCloneMode={isInCloneMode}
                        shouldShowOneTimeCloningTreatment={shouldShowOneTimeCloningTreatment}
                      />
                    )}
                    {activeStep === 1 && (
                      <CreateAdSetConfigurationForm
                        campaignToPopulate={campaignToPopulate}
                        disableInputs={isAdSetFormDisabled}
                        formikInfo={formik}
                        isAdAccountInternal={accountIsInternal}
                        isAdAccountManaged={accountIsManaged}
                        setEstimate={setEstimate}
                      />
                    )}
                    {activeStep === 2 && (
                      <CreateAdConfigurationForm
                        adSetToPopulate={adSetToPopulate}
                        campaignToPopulate={campaignToPopulate}
                        disableInputs={isAdFormDisabled}
                        formikInfo={formik}
                      />
                    )}

                    {isLastStep() ? (
                      <div>
                        <CampaignConfigurationSummary
                          formikInfo={formik}
                          onEditAdClick={() => {
                            unifiedLogger.logClickEvent({
                              eventName: EventName.EditAdButtonClicked,
                              parameters: { adAccountId },
                            });
                            setActiveStep(steps!.indexOf('Ad'));
                          }}
                          onEditAdSetClick={() => {
                            unifiedLogger.logClickEvent({
                              eventName: EventName.EditAdSetButtonClicked,
                              parameters: { adAccountId },
                            });
                            setActiveStep(steps!.indexOf('Ad Set'));
                          }}
                          onEditCampaignClick={() => {
                            unifiedLogger.logClickEvent({
                              eventName: EventName.EditCampaignButtonClicked,
                              parameters: { adAccountId },
                            });
                            setActiveStep(steps!.indexOf('Campaign'));
                          }}
                          shouldShowOneTimeCloningTreatment={shouldShowOneTimeCloningTreatment}
                          showSummaryAdSetEditButton={showSummaryAdSetEditButton}
                          showSummaryCampaignEditButton={showSummaryCampaignEditButton}
                        />

                        <Grid classes={{ root: stepperButtonsContainer }}>
                          <div>
                            <Button
                              classes={{ root: stepperButton }}
                              color='primary'
                              disabled={activeStep === 0}
                              onClick={handleBack}
                              variant='outlined'>
                              Back
                            </Button>
                            <Button
                              classes={{ root: stepperButton }}
                              color='primaryBrand'
                              disabled={!formReadyForSubmit() || submitting}
                              onClick={() => {
                                formik.handleSubmit();
                              }}
                              variant='contained'>
                              Submit
                            </Button>
                          </div>
                        </Grid>
                      </div>
                    ) : (
                      <div className={stepperNavigationControlsContainer}>
                        <Divider />
                        <Grid classes={{ root: stepperButtonsContainer }}>
                          <div>
                            <Button
                              classes={{ root: stepperButton }}
                              color='primary'
                              onClick={() => {
                                handleBack(formik);
                              }}
                              variant='outlined'>
                              {activeStep === 0 ? 'Cancel' : 'Back'}
                            </Button>
                            <Button
                              classes={{ root: stepperButton }}
                              color='primaryBrand'
                              data-testid='next-button'
                              disabled={isNextDisabled()}
                              onClick={() => {
                                handleNext();
                                if (shouldShowOneTimeCloningTreatment) {
                                  setShouldShowOneTimeCloningTreatment(false);
                                }
                              }}
                              variant='contained'>
                              Next
                            </Button>
                          </div>

                          {isInCloneMode && activeStep !== 2 && (
                            <Button
                              classes={{ root: stepperButton }}
                              color='primary'
                              disabled={!(stepIsValid0() && stepIsValid1() && stepIsValid2())}
                              onClick={() => {
                                setActiveStep(3);
                                if (shouldShowOneTimeCloningTreatment) {
                                  setShouldShowOneTimeCloningTreatment(false);
                                }
                              }}
                              variant='outlined'>
                              Review Campaign
                            </Button>
                          )}
                        </Grid>
                      </div>
                    )}
                  </form>
                </div>

                {Boolean(showAudienceEstimate) && activeStep === 1 && (
                  <div className={campaignInformationContainer}>
                    <CreateAudienceEstimate estimate={estimate} />
                  </div>
                )}
              </div>
            );
          }}
        </Formik>
      </div>
    </AdsManagerPageBaseLayout>
  );
};

export const NewCampaignWizardPageNonNextJs = (props = NewCampaignWizardDefaults) => {
  return (
    <CreateCampaignMetadataContextProvider>
      <NewCampaignWizard {...props} />
    </CreateCampaignMetadataContextProvider>
  );
};

export const NewCampaignWizardPage = () => {
  return (
    <CreateCampaignMetadataContextProvider>
      <NewCampaignWizard />
    </CreateCampaignMetadataContextProvider>
  );
};

const getPageLayout = (page: ReactNode) => {
  return getCreatorHubPageLayout(page, {
    header: <CampaignBreadcrumbs classic />,
  });
};
NewCampaignWizardPage.getPageLayout = getPageLayout;

export default NewCampaignWizardPage;
