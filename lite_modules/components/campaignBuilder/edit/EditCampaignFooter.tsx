import { Button } from '@rbx/foundation-ui';
import { useRouter } from 'next/router';
import { useFormContext, useFormState } from 'react-hook-form';

import { EventName, logNativeClickEvent, logNativeImpressionEvent } from '@clients/unifiedLogger';
import useCampaignBuilderLayoutStyles from '@components/campaignBuilder/common/CampaignBuilderLayout.styles';
import { openUpdateCampaignConfirmDialog } from '@components/campaignBuilder/dialogs/UpdateCampaignConfirmDialog';
import { openEntitySubmitErrorDialog } from '@components/common/dialog/entitySubmitErrorDialog';
import { openImpersonationErrorDialog } from '@components/common/dialog/impersonationErrorDialog';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import { useTransformFormToCampaign } from '@hooks/campaignBuilder/useTransformFormToCampaign';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { editSimplifiedCampaign } from '@services/ads/campaignBuilderService';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { useToastStore } from '@stores/toastStoreProvider';
import { EditCampaignType } from '@type/campaignBuilder';
import { IsEditCampaignDisabled } from '@utils/campaignBuilder';
import { IsImpersonationError } from '@utils/error';
import { GetSessionStorage, SessionStorageKeys } from '@utils/sessionStorage';

const EditCampaignFooter = () => {
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const {
    formState: { dirtyFields, isDirty, isSubmitting },
    handleSubmit,
  } = useFormContext<FormType>();
  const {
    classes: { footer },
  } = useCampaignBuilderLayoutStyles();
  const { isValid } = useFormState<FormType>();
  const shouldGoBackOnCta = GetSessionStorage(SessionStorageKeys.PREVIOUS_PAGE) === Routes.MANAGE;

  // useCampaignBuilderStore
  const campaignStatus = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.display_status,
  );
  const simplifiedCampaign = useCampaignBuilderStore((state) => state.simplifiedCampaign?.data);
  const flowType = useCampaignBuilderStore((state) => state.flowType);

  // useToastStore
  const { setShowEditSuccessful } = useToastStore((state) => state);

  const router = useRouter();

  const { transformFormToCampaignEdit, transformFormToCampaignEditLoggingParams } =
    useTransformFormToCampaign({});

  const redirectOnClick = () => {
    if (shouldGoBackOnCta) {
      router.back();
    } else {
      router.push(Routes.MANAGE);
    }
  };

  const onEditCampaign = async () => {
    await handleSubmit(async (data) => {
      const simplifiedCampaignId = simplifiedCampaign?.id;
      if (!simplifiedCampaignId) {
        throw new Error('simplifiedCampaignId is required for edit');
      }

      const campaignToSubmit: EditCampaignType = {
        ...transformFormToCampaignEdit(data, dirtyFields),
        id: simplifiedCampaignId,
        off_platform_request_id: simplifiedCampaign?.off_platform_request_id,
      };
      const loggingParams = transformFormToCampaignEditLoggingParams(data, dirtyFields);

      logNativeClickEvent(EventName.SubmitEditButtonClicked, loggingParams);

      await editSimplifiedCampaign(campaignToSubmit);
      logNativeImpressionEvent(EventName.SubmitCampaignSuccessModal, loggingParams);
      redirectOnClick();
      setShowEditSuccessful(true);
    })().catch((error) => {
      if (IsImpersonationError(error)) {
        openImpersonationErrorDialog();
      } else {
        logNativeImpressionEvent(EventName.SubmitCampaignError, { flowType });
        openEntitySubmitErrorDialog(error?.response?.data, { editMode: true });
      }
    });
  };

  const onClickPublish = () => {
    openUpdateCampaignConfirmDialog(onEditCampaign);
  };

  return (
    <div className={`text-body-large ${footer}`}>
      <Button
        isDisabled={
          !!IsEditCampaignDisabled(flowType, campaignStatus) || !isValid || !isDirty || isSubmitting
        }
        isLoading={isSubmitting}
        onClick={onClickPublish}
        size='Medium'
        variant='Emphasis'>
        {translateCampaign('Action.Update')}
      </Button>
      <Button onClick={redirectOnClick} size='Medium' variant='Standard'>
        {translateMisc('Action.Cancel')}
      </Button>
    </div>
  );
};

export default EditCampaignFooter;
