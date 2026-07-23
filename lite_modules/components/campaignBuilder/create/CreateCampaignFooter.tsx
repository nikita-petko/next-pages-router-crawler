import { Button } from '@rbx/foundation-ui';
import { useRouter } from 'next/router';
import { useRef } from 'react';
import { useFormContext, UseFormReturn, useFormState, useWatch } from 'react-hook-form';

import { EventName, logNativeClickEvent, logNativeImpressionEvent } from '@clients/unifiedLogger';
import useCampaignBuilderLayoutStyles from '@components/campaignBuilder/common/CampaignBuilderLayout.styles';
import { openDiscardCampaignConfirmDialog } from '@components/campaignBuilder/dialogs/DiscardCampaignConfirmDialog';
import { openPublishCampaignConfirmDialog } from '@components/campaignBuilder/dialogs/PublishCampaignConfirmDialog';
import { closeDialog } from '@components/common/dialog/actions';
import { openEntitySubmitErrorDialog } from '@components/common/dialog/entitySubmitErrorDialog';
import { openImpersonationErrorDialog } from '@components/common/dialog/impersonationErrorDialog';
import { isAdCreditPaymentType, ServerPaymentType } from '@constants/campaign';
import { FormField } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import type { FormType as AdvancedTargetingFormType } from '@hooks/campaignBuilder/advancedTargetingFormSchema';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import useNeedsPaymentSetup from '@hooks/campaignBuilder/useNeedsPaymentSetup';
import { useTransformFormToCampaign } from '@hooks/campaignBuilder/useTransformFormToCampaign';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { createSimplifiedCampaign } from '@services/ads/campaignBuilderService';
import { useAiCreateSessionStore } from '@stores/aiCreateSessionStoreProvider';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { useToastStore } from '@stores/toastStoreProvider';
import { IsAdvancedTargetingAllowed } from '@utils/campaignBuilder';
import { IsImpersonationError } from '@utils/error';

interface Props {
  advancedTargetingFormMethods: UseFormReturn<AdvancedTargetingFormType>;
}

const CreateCampaignFooter = ({ advancedTargetingFormMethods }: Props) => {
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const paymentType = useWatch<FormType, typeof FormField.PAYMENT_TYPE>({
    name: FormField.PAYMENT_TYPE,
  });
  const isAutoReloadEnabled = useWatch<FormType, typeof FormField.IS_AUTO_RELOAD_ENABLED>({
    name: FormField.IS_AUTO_RELOAD_ENABLED,
  });
  const {
    formState: { isDirty, isSubmitting },
    getValues,
    handleSubmit,
  } = useFormContext<FormType>();
  const router = useRouter();

  // useAppStore
  const hasNewFlowCampaign = useAppStore((state: AppStoreType) => state.hasNewFlowCampaign.data);
  const shouldShowPrechargeModalForCreditCard = useAppStore(
    (state) => state.advertiserState.data?.is_credit_card_precharge_for_account_required,
  );

  const isAdAccountAutoCreateEnabled = useAppStore(
    (state: AppStoreType) => state.appMetadataState?.data?.isAdAccountAutoCreateEnabled ?? false,
  );
  const needsPaymentSetup = useNeedsPaymentSetup();
  const hasLoggedDrawerOpened = useRef<boolean>(false);
  const resetAiCreateCampaignScope = useAiCreateSessionStore(
    (state) => state.resetAiCreateCampaignScope,
  );

  // useCampaignBuilderStore
  const { flowType, isVideoUploadInProgress } = useCampaignBuilderStore();
  const setPaymentMethodDrawerOpen = useCampaignBuilderStore(
    (state) => state.setPaymentMethodDrawerOpen,
  );

  // useToastStore
  const { setShowCreateSuccessful } = useToastStore((state) => state);

  const {
    classes: { footer },
  } = useCampaignBuilderLayoutStyles();
  const { isValid } = useFormState<FormType>();

  const { transformFormToCampaignCreation, transformFormToCampaignCreationLoggingParams } =
    useTransformFormToCampaign({
      advancedTargetingFormMethods,
    });

  const isFirstCampaignInNewFlow = isAdAccountAutoCreateEnabled && !hasNewFlowCampaign;

  const onCreateCampaign = async () => {
    await handleSubmit(async (data) => {
      const campaignToSubmit = transformFormToCampaignCreation(data);
      const loggingParams = transformFormToCampaignCreationLoggingParams(data);
      logNativeClickEvent(EventName.SubmitCampaignButtonClicked, loggingParams);
      if (isFirstCampaignInNewFlow) {
        logNativeClickEvent(EventName.NewUserFlowFirstCampaignPublishClicked, loggingParams);
      }

      const response = await createSimplifiedCampaign(
        campaignToSubmit,
        data[FormField.IDEMPOTENCY_KEY],
      );
      logNativeImpressionEvent(EventName.SubmitCampaignSuccessModal, {
        ...loggingParams,
        campaignId: response?.campaign_id || '',
      });
      if (isFirstCampaignInNewFlow) {
        logNativeImpressionEvent(EventName.NewUserFlowFirstCampaignPublishSuccess, {
          campaignId: response?.campaign_id || '',
        });
      }
      resetAiCreateCampaignScope();
      await router.push({
        pathname: Routes.MANAGE,
        query: hasNewFlowCampaign ? {} : { firstCampaign: 'true' },
      });
      closeDialog();
      setShowCreateSuccessful(true);
    })().catch((error) => {
      if (IsImpersonationError(error)) {
        openImpersonationErrorDialog();
      } else {
        logNativeImpressionEvent(EventName.SubmitCampaignError, {
          flowType,
        });
        openEntitySubmitErrorDialog(error?.response?.data, { editMode: false });
      }
    });
  };

  const onClickPublish = () => {
    if (needsPaymentSetup) {
      if (!hasLoggedDrawerOpened.current) {
        hasLoggedDrawerOpened.current = true;
        logNativeImpressionEvent(EventName.NewUserFlowSetupDrawerOpened);
      }
      setPaymentMethodDrawerOpen(true);
      return;
    }

    const contentKeys: string[] = ['Description.CampaignGoLive'];
    if (
      paymentType === ServerPaymentType.PAYMENT_TYPE_CARD &&
      shouldShowPrechargeModalForCreditCard
    ) {
      contentKeys.push('Description.CardDeduction', 'Description.UnusedBalanceRefund');
    }
    if (isAutoReloadEnabled && isAdCreditPaymentType(paymentType)) {
      contentKeys.push('Description.AutoReloadEnabled');
    }

    openPublishCampaignConfirmDialog(contentKeys, onCreateCampaign);
  };

  const onClickCancel = () => {
    logNativeClickEvent(EventName.CampaignFormCancelButtonClicked, {
      cloningCampaignId: JSON.stringify(router.query.campaignId) || '',
    });
    if (isDirty || advancedTargetingFormMethods.formState.isDirty) {
      openDiscardCampaignConfirmDialog(() => {
        resetAiCreateCampaignScope();
        router.push(Routes.MANAGE);
      });
    } else {
      resetAiCreateCampaignScope();
      router.push(Routes.MANAGE);
    }
  };

  const isImageUploadInProgress = useCampaignBuilderStore((state) => state.isImageUploadInProgress);
  const isCreativeLibraryRegistrationInProgress = useCampaignBuilderStore(
    (state) => state.isCreativeLibraryRegistrationInProgress,
  );
  const { maxAllowedCreatives, maxAllowedVideos } = useAppStore((state) => ({
    maxAllowedCreatives: state.appMetadataState.data?.maximumAdsPerTrafficDrivingCampaignCount,
    maxAllowedVideos: state.appMetadataState.data?.offPlatformRequestMaximumRawVideos,
  }));

  const formInvalid = !isValid;
  const advancedTargetingInvalid =
    IsAdvancedTargetingAllowed(
      getValues(FormField.GOAL),
      getValues(FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED),
    ) && !advancedTargetingFormMethods.formState.isValid;
  const imageUploadBlocking =
    isImageUploadInProgress && getValues(FormField.THUMBNAILS).length < maxAllowedCreatives;
  const videoUploadBlocking =
    isVideoUploadInProgress && getValues(FormField.VIDEOS).length < maxAllowedVideos;

  const isPublishDisabled =
    formInvalid ||
    advancedTargetingInvalid ||
    imageUploadBlocking ||
    videoUploadBlocking ||
    isCreativeLibraryRegistrationInProgress;

  return (
    <div className={`text-body-large ${footer}`}>
      <Button
        isDisabled={isPublishDisabled || isSubmitting}
        isLoading={isSubmitting}
        onClick={onClickPublish}
        size='Medium'
        variant='Emphasis'>
        {translateCampaign('Action.PublishCampaign')}
      </Button>
      <Button onClick={onClickCancel} size='Medium' variant='Standard'>
        {translateMisc('Action.Cancel')}
      </Button>
    </div>
  );
};

export default CreateCampaignFooter;
