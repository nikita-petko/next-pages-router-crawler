import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import type { CreatorNotificationCategory } from '@rbx/client-creator-settings/v1';
import { ContentType } from '@rbx/client-webhook-configuration-gateway/v1';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useTranslation } from '@rbx/intl';
import { Button, Divider, Grid, PlayArrowIcon, Typography } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { FormMode } from '@modules/miscellaneous/common';
import { Link } from '@modules/miscellaneous/components';
import type {
  CreateWebhook,
  TriggerWebhook,
  Webhook,
  UpdateWebhook,
} from '@modules/react-query/webhooks';
import useWebhooksConfigureFormStyles from './WebhooksConfigureForm.styles';
import type { WebhookFormType } from './webhooksFieldMetadata';
import WebhooksTextFieldRenderer from './WebhooksTextFieldRenderer';
import WebhooksToggledSecret from './WebhooksToggledSecret';
import WebhooksTriggersForm from './WebhooksTriggersForm';

const webhooksConfigureFormDefaultValues: WebhookFormType = {
  webhookUrl: '',
  name: '',
  contentType: ContentType.Json,
  secret: '',
  secretToggled: false,
  triggers: {},
};

type WebhooksConfigureFormProps = {
  previousWebhook?: Webhook;
  triggers: CreatorNotificationCategory[];
  isUpdating: boolean;
  isDeleting: boolean;
  returnToListView: (reloadWebhooks?: boolean) => void;
  createWebhook: CreateWebhook;
  triggerWebhook: TriggerWebhook;
  updateWebhook: UpdateWebhook;
  readOnlyTriggers?: boolean;
  experienceId?: number;
};

const buildAllOnTriggersValue = (
  categories: CreatorNotificationCategory[],
): WebhookFormType['triggers'] => {
  const result: WebhookFormType['triggers'] = {};
  categories.forEach((category) => {
    category.notifications?.forEach((notification) => {
      if (notification.notificationType) {
        result[notification.notificationType] = true;
      }
    });
  });
  return result;
};

const WebhooksConfigureForm: FunctionComponent<
  React.PropsWithChildren<WebhooksConfigureFormProps>
> = ({
  previousWebhook,
  triggers,
  returnToListView,
  createWebhook,
  updateWebhook,
  triggerWebhook,
  readOnlyTriggers = false,
  experienceId,
}) => {
  const { classes: styles } = useWebhooksConfigureFormStyles();
  const { translate, translateHTML } = useTranslation();
  const { user } = useAuthentication();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSendingTestResponse, setIsSendingTestResponse] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timerRef.current != null) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  const methods = useForm<WebhookFormType>({
    mode: FormMode.All,
    reValidateMode: FormMode.OnChange,
    defaultValues: previousWebhook
      ? {
          webhookUrl: previousWebhook.webhookConfigurationParameters.webhookUrl,
          name: previousWebhook.webhookConfigurationParameters.name,
          contentType: previousWebhook.webhookConfigurationParameters.contentType,
          secret: previousWebhook.webhookConfigurationParameters.sharedSecret ?? '',
          secretToggled: !!previousWebhook.webhookConfigurationParameters.sharedSecret,
          triggers: readOnlyTriggers
            ? buildAllOnTriggersValue(triggers)
            : previousWebhook.eventTypes
              ? Object.fromEntries(previousWebhook.eventTypes.map((eventType) => [eventType, true]))
              : {},
        }
      : {
          ...webhooksConfigureFormDefaultValues,
          triggers: readOnlyTriggers
            ? buildAllOnTriggersValue(triggers)
            : webhooksConfigureFormDefaultValues.triggers,
        },
    shouldUnregister: true,
  });

  const { control, formState, handleSubmit } = methods;
  const { isValid } = formState;

  const handleFormCancel = () => {
    returnToListView(false);
  };

  const handleFormSubmit: SubmitHandler<WebhookFormType> = useCallback(
    async (formPayload: WebhookFormType) => {
      if (!user?.id) {
        return;
      }

      setIsUpdating(true);
      const webhookConfigPayload = {
        webhookConfigurationParameters: {
          webhookUrl: formPayload.webhookUrl,
          contentType: formPayload.contentType,
          isEnabled: previousWebhook
            ? previousWebhook.webhookConfigurationParameters.isEnabled
            : true,
          name: formPayload.name,
          sharedSecret: formPayload.secretToggled ? formPayload.secret : '',
        },
        eventTypes: Object.keys(formPayload.triggers).filter(
          (trigger) => formPayload.triggers[trigger],
        ),
      };

      if (previousWebhook) {
        await updateWebhook({
          webhookId: previousWebhook.id,
          webhookConfiguration: {
            ...webhookConfigPayload,
          },
        });
      } else {
        await createWebhook({
          userId: user?.id,
          webhookConfiguration: {
            ...webhookConfigPayload,
          },
        });
      }

      returnToListView(true);

      setIsUpdating(false);
    },
    [user?.id, previousWebhook, returnToListView, updateWebhook, createWebhook],
  );

  const handleViewWebhookResponseFormat = useCallback(() => {
    window.open(
      `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/reference/cloud/webhook-notifications#payload-schema`,
      '_blank',
    );
  }, []);

  const handleTestWebhookResponse = useCallback(async () => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
    }

    setIsSendingTestResponse(true);
    const webhookConfig = {
      contentType: methods.getValues('contentType'),
      webhookUrl: methods.getValues('webhookUrl'),
      name: methods.getValues('name'),
      sharedSecret: methods.getValues('secretToggled') ? methods.getValues('secret') : '',
      isEnabled: true,
    };

    await triggerWebhook({
      // NOTE (mbae 3/31/23): The types defined in the swagger.json
      // aren't correct. We should only need to send webhookUrl
      // and contentType.
      webhookConfigurationParameters: webhookConfig,
    });
    setIsSendingTestResponse(false);

    const waitPeriod = 5;
    setSecondsRemaining(waitPeriod);
    const interval = window.setInterval(() => {
      setSecondsRemaining((t) => {
        const newTime = t - 1;
        if (newTime <= 0) {
          window.clearInterval(timerRef.current);
        }

        return newTime;
      });
    }, 1000);

    timerRef.current = interval;
  }, [methods, triggerWebhook]);

  const triggerFormValidation = useCallback(() => {
    void methods.trigger();
  }, [methods]);

  const triggerUrlValidation = useCallback(() => {
    void methods.trigger('webhookUrl');
  }, [methods]);

  return (
    <FormProvider {...methods}>
      <Grid className={styles.grid} container direction='column'>
        <Grid className={styles.titleGap} item container direction='column'>
          <Grid item>
            <Typography variant='captionBody'>
              {translateHTML('Description.WebhookConfiguration', [
                {
                  opening: 'setupLinkStart',
                  closing: 'setupLinkEnd',
                  content(chunks) {
                    return (
                      <Link
                        href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/reference/cloud/webhook-notifications#configuring-webhooks-on-creator-dashboard`}
                        target='_blank'>
                        {chunks}
                      </Link>
                    );
                  },
                },
              ])}
            </Typography>
          </Grid>
        </Grid>
        <Grid item container direction='column' className={styles.textFieldGrid}>
          <WebhooksTextFieldRenderer methods={methods} />
          <WebhooksToggledSecret methods={methods} />
        </Grid>
        <Grid item>
          <Divider />
        </Grid>
        <Grid className={styles.titleGap} item container direction='column'>
          <Grid item>
            <Typography variant='h2'>{translate('Title.Triggers')}</Typography>
          </Grid>
          <Grid item>
            <Typography variant='body1'>{translate('Description.WebhookTrigger')}</Typography>
          </Grid>
          <Grid item>
            <Controller
              name='triggers'
              control={control}
              rules={{
                validate: (triggersToValidate) => {
                  const isChecked = Object.keys(triggersToValidate).some(
                    (triggerType) => triggersToValidate[triggerType],
                  );

                  if (!isChecked) {
                    return translate('Hint.RequiredTriggers');
                  }

                  return true;
                },
              }}
              render={({ field, fieldState }) => (
                <WebhooksTriggersForm
                  onChange={(panel, type, checked) => {
                    field.onChange({ ...field.value, [type]: checked });
                    field.onBlur(); // Triggers validation
                  }}
                  value={field.value}
                  triggers={triggers}
                  errorText={fieldState.error?.message}
                  readOnly={readOnlyTriggers}
                  experienceId={experienceId}
                />
              )}
            />
          </Grid>
        </Grid>
        <Grid className={styles.fieldGap} item container direction='column'>
          <Grid item>
            <Divider />
          </Grid>
          <Grid item container wrap='nowrap'>
            <Grid className={`${styles.buttonGap} ${styles.leftButtons}`} item container>
              <Grid item>
                <Button
                  variant='outlined'
                  color='primary'
                  className={styles.buttonFormat}
                  onClick={handleFormCancel}>
                  {translate('Action.Cancel')}
                </Button>
              </Grid>
              <Grid item onClick={triggerFormValidation}>
                <Button
                  variant='contained'
                  className={`${styles.buttonFormat} ${styles.saveChangesButton}`}
                  disabled={!isValid}
                  onClick={handleSubmit(handleFormSubmit)}
                  loading={isUpdating}>
                  {translate('Action.SaveChanges')}
                </Button>
              </Grid>
            </Grid>
            <Grid
              className={`${styles.buttonGap} ${styles.rightButtons}`}
              justifyContent='flex-end'
              item
              container
              direction='row'>
              <Grid item>
                <Button
                  variant='outlined'
                  color='primary'
                  className={styles.buttonFormat}
                  onClick={handleViewWebhookResponseFormat}>
                  {translate('Action.ViewWebhookResponseFormat')}
                </Button>
              </Grid>
              <Grid item className={styles.testResponse} onClick={triggerUrlValidation}>
                <Button
                  variant='outlined'
                  color='primary'
                  className={styles.buttonFormat}
                  disabled={
                    secondsRemaining > 0 ||
                    methods.getValues('webhookUrl') === '' ||
                    control.getFieldState('webhookUrl').invalid
                  }
                  loading={isSendingTestResponse}
                  startIcon={<PlayArrowIcon />}
                  onClick={handleTestWebhookResponse}>
                  {translate('Action.TestWebhookResponse')}
                </Button>
                <Typography
                  style={{
                    paddingRight: 8,
                    visibility: secondsRemaining > 0 ? 'visible' : 'hidden',
                  }}
                  variant='smallLabel2'>
                  {translate('Label.TestWebhookTimer', { timeRemaining: `${secondsRemaining}s` })}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </FormProvider>
  );
};

export default WebhooksConfigureForm;
