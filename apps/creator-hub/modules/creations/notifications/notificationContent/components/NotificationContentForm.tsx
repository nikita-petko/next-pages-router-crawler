import { useAuthentication } from '@modules/authentication/providers';
import { notificationsClient } from '@modules/clients/notifications';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { FormMode, HttpStatusCodes, Link, toastDurationTime } from '@modules/miscellaneous/common';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { useTranslation } from '@rbx/intl';
import {
  Alert,
  Button,
  Divider,
  FormHelperText,
  Grid,
  TextField,
  useMediaQuery,
  useSnackbar,
} from '@rbx/ui';
import { useRouter } from 'next/router';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { getResponseFromError } from '@modules/clients/utils';
import {
  NotificationContentFormRegisterOptions,
  NotificationContentFormTypes,
} from '../../constants/notificationContentForm';
import {
  createNotificationContentEventModel,
  createNotificationContentFailedEventModel,
  createNotificationContentSuccessEventModel,
  editNotificationContentEventModel,
  editNotificationContentFailedEventModel,
  editNotificationContentLoaded,
  editNotificationContentSuccessEventModel,
} from '../../constants/notificationEventConstants';
import {
  NotificationContentFormType,
  NotificationContentFormTypesType,
} from '../../types/notificationContentForm';
import useNotificationContentFormStyles from '../styles/notificationContentForm';
import NotificationContentFormDescription from './NotificationContentFormDescription';
import NotificationContentFormPlaceholderDescription from './NotificationContentFormPlaceholderDescription';

export interface NotificationContentFormProps {
  type: NotificationContentFormTypesType;
  universeId: number;
  contentId?: string;
  defaultFormValue: NotificationContentFormType;
}

enum NotificationErrorTypes {
  invalidContent = 'invalidContent',
  missingPlaceholder = 'missingPlaceholder',
  tooManyPlaceholders = 'tooManyPlaceholders',
  invalidPlaceholder = 'invalidPlaceholder',
}

const NotificationContentForm: FunctionComponent<
  React.PropsWithChildren<NotificationContentFormProps>
> = ({ type, universeId, defaultFormValue, contentId }) => {
  const { trackerClient } = useEventTrackerProvider();
  const { translate } = useTranslation();
  const router = useRouter();
  const { enqueue } = useSnackbar();
  const { user } = useAuthentication();
  const currentGroup = useCurrentGroup();
  const isGroup = (currentGroup?.id ?? 0) !== 0;
  const {
    classes: {
      cancelButton,
      cancelLink,
      createButton,
      containerPadding,
      dividerMargin,
      formWrapper,
      formInputPadding,
      errorMessageStyles,
    },

    cx,
  } = useNotificationContentFormStyles();
  const [notificationContentErrorMsg, setNotificationContentErrorMsg] = useState('');
  const [lastSubmittedFormValue, setLastSubmittedFormValue] = useState(defaultFormValue);
  const { handleSubmit, control, formState, getValues } = useForm<NotificationContentFormType>({
    mode: FormMode.OnChange,
    reValidateMode: FormMode.OnChange,
    defaultValues: defaultFormValue,
    shouldUnregister: true,
  });
  const { isSubmitting, errors, isValid, isValidating } = formState;
  const isUpdateFlow = type === NotificationContentFormTypes.update && !!contentId;
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const getTextLengthMessage = (max: number, current: number) => {
    if (current === 0) {
      return translate('Message.CharacterLimit', { limit: String(max) });
    }
    return translate('Message.ProgressiveCharacterLimit', { count: String(max - current) });
  };

  const extractError = async (error: unknown) => {
    const resErr = getResponseFromError(error);
    try {
      if (resErr?.status === HttpStatusCodes.UNPROCESSABLE_ENTITY) {
        const data: string = await resErr?.json();
        const [errorType, ...messageArray] = data.split(':');
        const errorMsg = messageArray.join(':').trim();
        if (errorType === NotificationErrorTypes.missingPlaceholder) {
          return translate('Message.NotificationContentCreateFailedMissingPlaceholder', {
            placeholder: errorMsg,
          });
        }
        if (errorType === NotificationErrorTypes.invalidContent && messageArray.length) {
          return translate('Message.NotificationContentCreateFailedInvalidContent', {
            invalidContent: errorMsg,
          });
        }
        if (errorType === NotificationErrorTypes.tooManyPlaceholders && messageArray.length) {
          return translate('Message.NotificationContentCreateFailedTooManyPlaceholders', {
            placeholder: errorMsg,
          });
        }
        if (errorType === NotificationErrorTypes.invalidPlaceholder && messageArray.length) {
          return translate('Message.NotificationContentCreateFailedInvalidPlaceholder', {
            placeholder: errorMsg,
          });
        }
      }
      if (resErr?.status === HttpStatusCodes.DUPLICATE_ENTRY) {
        return translate('Message.NotificationContentCreateFailedDuplicateLabel');
      }
      return translate(
        type === NotificationContentFormTypes.create
          ? 'Message.NotificationContentCreateFailedGeneric'
          : 'Message.NotificationContentUpdateFailedGeneric',
      );
    } catch {
      return translate(
        type === NotificationContentFormTypes.create
          ? 'Message.NotificationContentCreateFailedGeneric'
          : 'Message.NotificationContentUpdateFailedGeneric',
      );
    }
  };

  const createNotificationContent = async (data: NotificationContentFormType) => {
    trackerClient.sendEvent(createNotificationContentEventModel(user?.id, universeId, isGroup));
    const { id: cid } = await notificationsClient.createNotificationContent({
      ...data,
      universeId,
    });
    trackerClient.sendEvent(
      createNotificationContentSuccessEventModel(user?.id, universeId, cid ?? undefined, isGroup),
    );
  };

  const updateNotificationContent = async (data: NotificationContentFormType) => {
    const updateData = { ...data, id: contentId || '' };
    trackerClient.sendEvent(
      editNotificationContentEventModel(user?.id, universeId, contentId, isGroup),
    );
    await notificationsClient.updateNotificationContent(updateData);
    trackerClient.sendEvent(
      editNotificationContentSuccessEventModel(user?.id, universeId, contentId, isGroup),
    );
  };

  const sanitizeInputData = (data: NotificationContentFormType) => {
    return {
      name: data.name.trim(),
      content: data.content.trim(),
    };
  };

  const handleFormSubmit: SubmitHandler<NotificationContentFormType> = async (data) => {
    setNotificationContentErrorMsg('');
    try {
      const sanitizedData = sanitizeInputData(data);
      if (isUpdateFlow) {
        if (
          sanitizedData.name !== lastSubmittedFormValue.name ||
          sanitizedData.content !== lastSubmittedFormValue.content
        ) {
          await updateNotificationContent(sanitizedData);
        }
        setLastSubmittedFormValue(sanitizedData);
      } else {
        await createNotificationContent(sanitizedData);
      }
      await router.push(`/dashboard/creations/experiences/${universeId}/notifications`);
      const successMsg = translate(
        type === NotificationContentFormTypes.create
          ? 'Message.NotificationContentCreateSuccess'
          : 'Message.NotificationContentUpdateSuccess',
      );
      enqueue(
        {
          children: <Alert severity='success'>{successMsg}</Alert>,
          autoHide: true,
          autoHideDuration: toastDurationTime,
        },
        (reason) => reason === 'timeout',
      );
    } catch (e) {
      if (isUpdateFlow) {
        trackerClient.sendEvent(
          editNotificationContentFailedEventModel(user?.id, universeId, contentId, isGroup),
        );
      } else {
        trackerClient.sendEvent(
          createNotificationContentFailedEventModel(user?.id, universeId, isGroup),
        );
      }
      const errorMsg = await extractError(e);
      setNotificationContentErrorMsg(errorMsg);
    }
  };

  const cancelRedirectUrl = `/dashboard/creations/experiences/${universeId}/notifications`;

  const handlePrimaryButtonClick = useCallback(() => {
    handleSubmit(handleFormSubmit)();
    /* eslint-disable-next-line react-hooks/exhaustive-deps -- NOTE
(jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
responsible for triaging issue. */
  }, [translate]);

  useEffect(() => {
    if (isUpdateFlow) {
      trackerClient.sendEvent(editNotificationContentLoaded(user?.id, universeId, contentId));
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps -- NOTE
(jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
responsible for triaging issue. */
  }, [trackerClient]);

  return (
    <Grid container item XSmall={12} XLarge={6} classes={{ root: containerPadding }}>
      <NotificationContentFormDescription />
      <Grid container className={formWrapper}>
        <Grid item XSmall={12} className={formInputPadding}>
          <Controller
            name='name'
            control={control}
            rules={NotificationContentFormRegisterOptions.name}
            render={({ field }) => (
              <TextField
                {...field}
                error={!!errors.name}
                fullWidth
                multiline
                required
                id='name'
                label={translate('Label.NotificationContentStringName')}
                FormHelperTextProps={{ 'aria-live': 'polite' }}
                helperText={
                  errors.name && errors.name.message
                    ? translate(errors.name.message)
                    : getTextLengthMessage(50, getValues('name').length)
                }
              />
            )}
          />
        </Grid>
        <Grid item XSmall={12} className={formInputPadding}>
          <Controller
            name='content'
            control={control}
            rules={NotificationContentFormRegisterOptions.content}
            render={({ field }) => (
              <TextField
                {...field}
                error={!!errors.content}
                fullWidth
                multiline
                required
                minRows={6}
                id='content'
                label={translate('Label.NotificationString')}
                placeholder={translate(
                  'Placeholder.NotificationStringContentExperienceNotification',
                )}
                FormHelperTextProps={{ 'aria-live': 'polite' }}
                helperText={
                  errors.content && errors.content.message
                    ? translate(errors.content.message)
                    : getTextLengthMessage(99, getValues('content').length)
                }
              />
            )}
          />
        </Grid>
        <Grid item XSmall={12} className={formInputPadding}>
          <NotificationContentFormPlaceholderDescription />
        </Grid>
        <Grid item XSmall={12} className={cx(dividerMargin, formInputPadding)}>
          <Divider />
        </Grid>
        <Grid item XSmall={12}>
          <Grid container direction={isCompactView ? 'column' : 'row'}>
            <Link href={cancelRedirectUrl} underline='none' className={cancelLink}>
              <Button
                variant='outlined'
                data-testid='cancel-notification-content-button'
                color='primary'
                size='large'
                disabled={isSubmitting}
                className={cancelButton}>
                {translate('Action.Cancel')}
              </Button>
            </Link>
            <Button
              className={createButton}
              data-testid='create-notification-content-button'
              variant='contained'
              size='large'
              disabled={!isValidating && !isValid}
              onClick={handlePrimaryButtonClick}
              loading={isSubmitting}>
              {type === NotificationContentFormTypes.create
                ? translate('Action.CreateNotification')
                : translate('Action.UpdateNotification')}
            </Button>
            {notificationContentErrorMsg && (
              <FormHelperText className={errorMessageStyles} error>
                {notificationContentErrorMsg}
              </FormHelperText>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default NotificationContentForm;
