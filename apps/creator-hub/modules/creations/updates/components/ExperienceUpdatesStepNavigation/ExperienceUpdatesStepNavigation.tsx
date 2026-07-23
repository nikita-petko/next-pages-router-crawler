import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm, FormProvider } from 'react-hook-form';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { Typography, DialogTemplate, useDialog, useSnackbar } from '@rbx/ui';
import type { GameUpdateMessageModel } from '@modules/clients/gameUpdateNotifications';
import gameUpdateNotificationsClient from '@modules/clients/gameUpdateNotifications';
import { getResponseFromError } from '@modules/clients/utils';
import { getErrorCode } from '@modules/clients/utils/errorHelpers';
import { toastDurationTime, FormMode } from '@modules/miscellaneous/common';
import { dayToMs, getEnumKeyByValue } from '@modules/miscellaneous/utils';
import GameUpdateNotificationsErrorCodesV2 from '../../../enums/GameUpdateNotificationsErrorCodes';
import ExperienceUpdatesForm from '../ExperienceUpdatesForm/ExperienceUpdatesForm';
import ExperienceUpdatesHistory from '../ExperienceUpdatesHistory/ExperienceUpdatesHistory';
import type { ExperienceUpdatesFormType } from '../types';
import useExperienceUpdatesStepNavigationStyles from './ExperienceUpdatesStepNavigation.styles';

export type ExperienceUpdatesStepNavigationProps = {
  experienceName: string;
  experienceId: number;
  experienceUpdatesList: GameUpdateMessageModel[];
  onExperienceUpdatesListChange: (update: GameUpdateMessageModel) => void;
};

const TimeInterval = 3; // An update can only be sent every 3 days
const ExperienceUpdatesStepNavigation: FunctionComponent<
  React.PropsWithChildren<ExperienceUpdatesStepNavigationProps>
> = ({ experienceName, experienceId, experienceUpdatesList, onExperienceUpdatesListChange }) => {
  const {
    classes: { updateWarning },
  } = useExperienceUpdatesStepNavigationStyles();
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const { open, configure, close: closeDialog } = useDialog();
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const methods = useForm<ExperienceUpdatesFormType>({
    mode: FormMode.OnChange,
    reValidateMode: FormMode.OnChange,
    defaultValues: { update: '' },
  });
  const { reset, formState, handleSubmit, getValues, setValue, trigger } = methods;
  const [errorMsg, setErrorMsg] = useState<string>();
  const [isPreviewShown, setIsPreviewShown] = useState<boolean>(false);

  const timeIntervalTimestampValue = useMemo(() => {
    return dayToMs(TimeInterval);
  }, []);

  const parseErrorMsg = useCallback(
    (errCode: number) => {
      let errorMsgKey = 'Error.UnknownError';
      const nameOfError = getEnumKeyByValue(GameUpdateNotificationsErrorCodesV2, errCode);
      if (nameOfError) {
        errorMsgKey = `Error.${nameOfError}`;
      }
      setErrorMsg(translate(errorMsgKey));
    },
    [translate],
  );

  const handleSend: SubmitHandler<ExperienceUpdatesFormType> = useCallback(
    async (data) => {
      try {
        const response = await gameUpdateNotificationsClient.postGameUpdateNotifications({
          universeId: experienceId,
          body: data.update,
        });
        onExperienceUpdatesListChange(response);
        setIsPreviewShown(false);
        reset();
        enqueue({
          message: <span data-testid='success-message'>{translate('Message.UpdateSent')}</span>,
          anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
          autoHideDuration: toastDurationTime,
          autoHide: true,
          onClose: closeSnackbar,
        });
      } catch (err) {
        try {
          const errorResponse = getResponseFromError(err);
          const errorObject = await errorResponse?.json();
          parseErrorMsg(errorObject.errorCode as number);
        } catch {
          setErrorMsg(translate('Error.UnknownError'));
        }
      } finally {
        closeDialog();
      }
    },
    [
      onExperienceUpdatesListChange,
      reset,
      enqueue,
      translate,
      closeSnackbar,
      experienceId,
      parseErrorMsg,
      closeDialog,
    ],
  );

  const checkIsUpdateTextValid = useCallback(
    async (updateText: string): Promise<boolean> => {
      try {
        const response = await gameUpdateNotificationsClient.filterGameUpdateText({
          body: updateText,
        });
        const isTextFiltered = response.isFiltered;

        if (isTextFiltered) {
          setErrorMsg(translate('Error.UpdateTextBlocked'));
        }
        return !isTextFiltered;
      } catch (err) {
        parseErrorMsg(getErrorCode(err, 0));
        return false;
      }
    },
    [translate, parseErrorMsg],
  );

  const confirmSendUpdatesDialog = useMemo(
    () => (
      <DialogTemplate
        title={translate('Title.ConfirmSendUpdate')}
        content={translate('Message.ConfirmSendUpdate')}
        confirmText={translate('Action.Send')}
        cancelText={translate('Action.Cancel')}
        onConfirm={handleSubmit(handleSend)}
        onCancel={closeDialog}
        loading={formState.isSubmitting}
      />
    ),
    [translate, closeDialog, handleSubmit, handleSend, formState.isSubmitting],
  );

  const resetErrorMessage = useCallback(() => setErrorMsg(undefined), []);

  const trimInputText = useCallback(() => {
    setValue('update', getValues('update').trim(), { shouldValidate: true });
  }, [setValue, getValues]);

  const handlePreSubmitCheck = useCallback(() => {
    resetErrorMessage();
    trimInputText();
    return trigger();
  }, [resetErrorMessage, trimInputText, trigger]);

  const handleSecondaryButtonClick = useCallback(async () => {
    const isPreSubmitCheckPassed = await handlePreSubmitCheck();
    if (!isPreSubmitCheckPassed) {
      return;
    }
    if (isPreviewShown) {
      setIsPreviewShown(false);
    } else {
      const isTextValid = await checkIsUpdateTextValid(getValues('update'));
      if (isTextValid) {
        setIsPreviewShown(true);
      }
    }
  }, [getValues, isPreviewShown, checkIsUpdateTextValid, handlePreSubmitCheck]);

  const handleSendButtonClicked = useCallback(async () => {
    const isPreSubmitCheckPassed = await handlePreSubmitCheck();
    if (!isPreSubmitCheckPassed) {
      return;
    }
    configure(confirmSendUpdatesDialog);
    open();
  }, [open, confirmSendUpdatesDialog, configure, handlePreSubmitCheck]);

  const isLatestUpdateWithinTimeInterval = useMemo(() => {
    const latestUpdate = experienceUpdatesList[0];
    if (typeof latestUpdate?.createdOn !== 'undefined') {
      const currentTime = new Date(Date.now());
      return currentTime.valueOf() - latestUpdate.createdOn.valueOf() < timeIntervalTimestampValue;
    }
    return false;
  }, [experienceUpdatesList, timeIntervalTimestampValue]);

  const latestDateDisplay = useMemo(() => {
    const latestUpdate = experienceUpdatesList[0];
    if (typeof latestUpdate?.createdOn !== 'undefined') {
      return new Intl.DateTimeFormat(locale ?? Locale.English, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(latestUpdate.createdOn);
    }
    return '';
  }, [locale, experienceUpdatesList]);

  useEffect(() => {
    configure(confirmSendUpdatesDialog);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to submission state changes
  }, [formState.isSubmitting]);

  return (
    <FormProvider {...methods}>
      {isLatestUpdateWithinTimeInterval ? (
        <Typography
          variant='body1'
          classes={{ root: updateWarning }}
          data-testid='updated-within-time-interval-warning'>
          {translate('Message.UpdatesWithInTimeInterval', {
            experienceName,
            date: latestDateDisplay,
            timeInterval: TimeInterval.toString(),
          })}
        </Typography>
      ) : (
        <ExperienceUpdatesForm
          experienceName={experienceName}
          isPreviewShown={isPreviewShown}
          onSecondaryButtonClick={handleSecondaryButtonClick}
          onPrimaryButtonClick={handleSendButtonClicked}
          errorMsg={errorMsg}
        />
      )}
      {!isPreviewShown && (
        <ExperienceUpdatesHistory experienceUpdatesList={experienceUpdatesList} />
      )}
    </FormProvider>
  );
};

export default ExperienceUpdatesStepNavigation;
