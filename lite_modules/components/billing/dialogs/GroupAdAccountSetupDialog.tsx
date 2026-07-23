import { Button } from '@rbx/foundation-ui';
import { AxiosError } from 'axios';
import { type ReactElement, useState } from 'react';

import { EventName, logNativeImpressionEvent } from '@clients/unifiedLogger';
import AccountInfoStep from '@components/account/AccountInfoStep';
import { openDialog } from '@components/common/dialog/actions';
import BaseDialog from '@components/common/dialog/BaseDialog';
import { openErrorDialogWithMessage } from '@components/common/dialog/errorDialog';
import type { BaseInjectedDialogProps } from '@components/common/dialog/types';
import { FormFields } from '@constants/account';
import { OrganizationType } from '@constants/app';
import ErrorCodes from '@constants/errorCodes';
import { TranslationNamespace } from '@constants/localization';
import useAccountForm from '@hooks/account/useAccountForm';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import useTimezones from '@hooks/useTimezones';
import { createAdAccount } from '@services/ads/adAccountService';
import { useAppStore } from '@stores/appStoreProvider';
import { CaptureException } from '@utils/error';
import { GetDefaultCountryValue } from '@utils/localization';

interface GroupAdAccountSetupDialogProps extends BaseInjectedDialogProps {
  entryPoint: string;
  groupId: number;
  groupName: string;
  onComplete: () => Promise<void> | void;
}

const GroupAdAccountSetupDialog = ({
  entryPoint,
  groupId,
  groupName,
  onClose,
  onComplete,
  setDismissible,
}: GroupAdAccountSetupDialogProps): ReactElement => {
  const { translate: translateAccount } = useNamespacedTranslation(TranslationNamespace.Account);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const { localizedDefaultTimeZone, localizedTimezones } = useTimezones();
  const getAdvertiser = useAppStore((state) => state.getAdvertiser);
  const getAdCredit = useAppStore((state) => state.getAdCredit);
  const [isCreatingAccount, setIsCreatingAccount] = useState<boolean>(false);

  const { form, handleTimeZoneChange } = useAccountForm({
    defaultValues: {
      [FormFields.BUSINESS_NAME]: '',
      [FormFields.COUNTRY]: GetDefaultCountryValue(),
      [FormFields.FIRST_NAME]: '',
      [FormFields.LAST_NAME]: '',
      [FormFields.NICKNAME]: groupName,
      [FormFields.TAX_ID]: '',
      [FormFields.TERMS_CHECKBOX]: false,
      [FormFields.TIME_ZONE]: localizedDefaultTimeZone,
      [FormFields.TYPE]: OrganizationType.ORGANIZATION_TYPE_INDIVIDUAL,
    },
    isAdAccountAutoCreateEnabled: true,
  });

  const { handleSubmit: handleFormSubmit } = form;
  const {
    formState: { isValid: formIsValid },
  } = form;

  const onCreateAccount = async (): Promise<void> => {
    setIsCreatingAccount(true);
    setDismissible(false);
    let shouldComplete = false;
    try {
      await handleFormSubmit(async (data) => {
        try {
          await createAdAccount(
            {
              ad_account: { name: data[FormFields.NICKNAME]?.trim() },
              organization: {
                address: { country: data[FormFields.COUNTRY].value },
                individual_name: { first_name: '', last_name: '' },
                tax_id: '',
                time_zone: data[FormFields.TIME_ZONE].value,
                type: OrganizationType.ORGANIZATION_TYPE_INDIVIDUAL,
              },
              signed_terms_of_service: data[FormFields.TERMS_CHECKBOX],
            },
            { groupId },
          );

          logNativeImpressionEvent(EventName.GroupAdAccountCreateSuccess, {
            accountScope: 'group',
            entryPoint,
            groupId: String(groupId),
          });
          await Promise.all([getAdvertiser(true, groupId), getAdCredit(groupId)]);
          shouldComplete = true;
          onClose();
        } catch (error) {
          const isAxiosError = error instanceof AxiosError;
          logNativeImpressionEvent(EventName.GroupAdAccountCreateFailed, {
            accountScope: 'group',
            entryPoint,
            errorCode: isAxiosError ? error.response?.data?.error?.code : undefined,
            errorStatus: isAxiosError ? String(error.response?.status ?? '') : undefined,
            groupId: String(groupId),
          });
          CaptureException(isAxiosError ? error.response : (error as Error));
          const message =
            isAxiosError &&
            error.response?.data?.error?.code === ErrorCodes.VALIDATE_DISPLAY_NAME_FAILED
              ? translateAccount('Message.BusinessNameNotValid')
              : translateMisc('Message.GenericError');

          openErrorDialogWithMessage(message);
        }
      })();
      if (shouldComplete) {
        try {
          await onComplete();
        } catch (error) {
          CaptureException(error as Error);
        }
      }
    } finally {
      setIsCreatingAccount(false);
      setDismissible(true);
    }
  };

  return (
    <BaseDialog
      dialogBody={
        <div className='padding-top-small'>
          <AccountInfoStep
            form={form}
            handleTimeZoneChange={handleTimeZoneChange}
            isCompactTermsLabel
            isCompleted={false}
            isCreatingAccount={isCreatingAccount}
            isUnlocked
            localizedTimezones={localizedTimezones}
            onCreateAccount={onCreateAccount}
            shouldRenderSubmitButton={false}
          />
        </div>
      }
      dialogDescription={translateAccount('Description.GroupAccountTimezoneSetup')}
      dialogFooter={
        <>
          <Button
            isDisabled={!formIsValid || isCreatingAccount}
            isLoading={isCreatingAccount}
            onClick={onCreateAccount}
            size='Medium'
            variant='Emphasis'>
            {translateMisc('Action.Save')}
          </Button>
          <Button isDisabled={isCreatingAccount} onClick={onClose} size='Medium' variant='Standard'>
            {translateMisc('Action.Cancel')}
          </Button>
        </>
      }
      dialogTitle={translateAccount('Heading.GroupAccountSetup')}
    />
  );
};

export const openGroupAdAccountSetupDialog = ({
  entryPoint,
  groupId,
  groupName,
  onComplete,
}: {
  entryPoint: string;
  groupId: number;
  groupName: string;
  onComplete: () => Promise<void> | void;
}): void => {
  openDialog({
    component: GroupAdAccountSetupDialog,
    options: { hasCloseAffordance: true },
    props: { entryPoint, groupId, groupName, onComplete },
  });
};

export default GroupAdAccountSetupDialog;
