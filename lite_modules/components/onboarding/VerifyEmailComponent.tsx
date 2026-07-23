import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@rbx/foundation-ui';
import { TextField, Typography } from '@rbx/ui';
import { memo, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';

import { EventName, unifiedLogger } from '@clients/unifiedLogger';
import useVerifyEmailComponentStyles from '@components/onboarding/VerifyEmailComponent.styles';
import { TranslationNamespace } from '@constants/localization';
import useSendVerificationEmail from '@hooks/account/useSendVerificationEmail';
import useVerifyEmailSchema, {
  VERIFY_EMAIL_FIELD,
  type VerifyEmailFieldValues,
} from '@hooks/account/useVerifyEmailSchema';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { GetLocalStorage, StorageKeys } from '@utils/localStorage';

const VerifyEmailComponent = memo(() => {
  const { translate: translateAccount } = useNamespacedTranslation(TranslationNamespace.Account);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const {
    classes: { mainContainer, textInput, title, verifyButton },
  } = useVerifyEmailComponentStyles();
  const { sendVerificationEmail } = useSendVerificationEmail();

  const [emailAddress, setEmailAddress] = useState<string>('');
  const [emailSent, setEmailSent] = useState<boolean>(false);

  const { adAccountId = GetLocalStorage(StorageKeys.AD_ACCOUNT_ID) } = useAppStore(
    (state: AppStoreType) => state.appData,
  );

  const verifyEmailSchema = useVerifyEmailSchema();

  // React Hook Form setup
  const {
    formState: { errors, isDirty, isValid },
    handleSubmit,
    register,
    watch,
  } = useForm<VerifyEmailFieldValues>({
    defaultValues: {
      [VERIFY_EMAIL_FIELD]: '',
    },
    mode: 'onChange',
    resolver: zodResolver(verifyEmailSchema),
  });

  const currentEmailValue = watch(VERIFY_EMAIL_FIELD);

  const sendEmailRequest = useCallback(
    async (values: VerifyEmailFieldValues) => {
      const ok = await sendVerificationEmail(values[VERIFY_EMAIL_FIELD]);
      if (ok) {
        setEmailSent(true);
        setEmailAddress(values[VERIFY_EMAIL_FIELD]);
      }
    },
    [sendVerificationEmail],
  );

  const onSubmit = useCallback(
    async (data: VerifyEmailFieldValues) => {
      await sendEmailRequest(data);
    },
    [sendEmailRequest],
  );

  const onVerifyClick = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: EventName.VerifyEmailAttempted,
      parameters: { adAccountId },
    });
  }, [adAccountId]);

  return (
    <form className={mainContainer} onSubmit={handleSubmit(onSubmit)}>
      <Typography className={title} variant='h4'>
        {emailSent
          ? translateAccount('Heading.CheckInboxVerifyEmail')
          : translateAccount('Heading.VerifyEmail')}
      </Typography>
      <Typography variant='body1'>
        {emailSent
          ? translateAccount('Description.CheckEmailForVerification', { emailAddress })
          : translateAccount('Description.VerifyEmailRequired')}
      </Typography>
      <Typography variant='body1'>
        {emailSent
          ? translateAccount('Description.UpdateEmailForAdAccount')
          : translateAccount('Description.ChangeEmailAtRoblox')}
      </Typography>
      <TextField
        className={textInput}
        error={Boolean(errors[VERIFY_EMAIL_FIELD])}
        helperText={errors[VERIFY_EMAIL_FIELD]?.message}
        id='email'
        label={translateAccount('Label.Email')}
        {...register(VERIFY_EMAIL_FIELD)}
      />
      <Button
        className={verifyButton}
        isDisabled={!(isDirty && isValid) || currentEmailValue === emailAddress}
        onClick={onVerifyClick}
        size='Medium'
        type='submit'
        variant='Emphasis'>
        {translateMisc('Action.Verify')}
      </Button>
    </form>
  );
});

export default VerifyEmailComponent;
