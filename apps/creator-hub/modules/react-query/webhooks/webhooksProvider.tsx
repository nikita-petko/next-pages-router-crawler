import React, { FunctionComponent, createContext, useCallback, useContext, useMemo } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { QueryObserverResult, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { WebhookConfiguration } from '@rbx/clients/webhookConfigurationGateway';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

import { useAuthentication } from '@modules/authentication/providers';
import {
  Webhook,
  fetchWebhooks,
  createWebhook,
  deleteWebhook,
  updateWebhook,
  triggerWebhook,
} from './webhooksRequests';
import extractWebhooksErrorCode from './extractWebhooksErrorCode';

type WebhooksProviderProps = {
  showSnackbarMessage: (severity: 'success' | 'error', msg: string) => void;
};

export type TriggerWebhook = (webhookConfiguration: WebhookConfiguration) => Promise<void>;
export type RefetchWebhooks = () => Promise<QueryObserverResult<Webhook[], unknown>>;
export type DeleteWebhook = (webhookConfigurationId: string) => Promise<void>;
export type ToggleWebhook = (id: string) => Promise<void>;
export type UpdateWebhook = (updateWebhook: {
  webhookId: string;
  webhookConfiguration: WebhookConfiguration;
}) => Promise<Webhook>;
export type CreateWebhook = (createWebhook: {
  userId: number;
  webhookConfiguration: WebhookConfiguration;
}) => Promise<Webhook>;

type WebhooksContext = {
  webhooks: Webhook[];
  isError: boolean;
  isPending: boolean;
  isDeleting: boolean;
  isUpdating: boolean;
  isCreating: boolean;
  createWebhook: CreateWebhook;
  updateWebhook: UpdateWebhook;
  triggerWebhook: TriggerWebhook;
  refetchWebhooks: RefetchWebhooks;
  deleteWebhook: DeleteWebhook;
  toggleWebhook: ToggleWebhook;
};

const WebhooksContext = createContext<WebhooksContext | null>(null);

const WebhooksProvider: FunctionComponent<React.PropsWithChildren<WebhooksProviderProps>> = ({
  showSnackbarMessage,
  children,
}) => {
  const { user } = useAuthentication();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const { translate, ready: translateReady } = useTranslation();
  const queryKey = useMemo(() => ['webhooks', userId], [userId]);

  const {
    data: webhooks,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => {
      if (userId === undefined) {
        return Promise.reject(new Error('Invalid user id'));
      }

      return fetchWebhooks({ userId });
    },
    enabled: Boolean(userId) && translateReady,
    throwOnError: () => {
      showSnackbarMessage('error', translate('Error.GettingWebhooks'));
      return false;
    },
  });

  const { mutateAsync: createWebhookAsync, isPending: isCreating } = useMutation({
    mutationFn: createWebhook,
    onError: async (error) => {
      let defaultError = translate('Error.SavingCreatorSettingsV1');
      const errorCode = await extractWebhooksErrorCode(error);
      if (errorCode !== undefined) {
        defaultError = translate('Error.SavingWithErrorCode', {
          errorCode,
        });
      }
      showSnackbarMessage('error', defaultError);
    },
    onSuccess: (webhook) => {
      queryClient.setQueryData<Webhook[]>(
        queryKey,
        (prevWebhooks) => prevWebhooks && [...prevWebhooks, webhook],
      );
      showSnackbarMessage('success', translate('Description.SuccessfullySavedSettings'));
    },
  });

  const { mutateAsync: deleteWebhookAsync, isPending: isDeleting } = useMutation({
    mutationFn: deleteWebhook,
    onError: () => {
      showSnackbarMessage('error', translate('Error.SavingCreatorSettingsV1'));
    },
    onSuccess: (_, webhookId) => {
      queryClient.setQueryData<Webhook[]>(
        queryKey,
        (prevWebhooks) =>
          prevWebhooks && prevWebhooks.filter((webhook) => webhook.id !== webhookId),
      );
      showSnackbarMessage('success', translate('Description.SuccessfullySavedSettings'));
    },
  });

  const { mutateAsync: updateWebhookAsync, isPending: isUpdating } = useMutation({
    mutationFn: updateWebhook,
    onSuccess: (webhook) => {
      queryClient.setQueryData<Webhook[]>(queryKey, (prevWebhooks) => {
        if (!prevWebhooks) {
          return prevWebhooks;
        }
        return [
          ...prevWebhooks.map((prevWebhook) => {
            if (webhook.id !== prevWebhook.id) {
              return prevWebhook;
            }
            return webhook;
          }),
        ];
      });
      showSnackbarMessage('success', translate('Description.SuccessfullySavedSettings'));
    },
    onError: async (error) => {
      let defaultError = translate('Error.SavingCreatorSettingsV1');
      const errorCode = await extractWebhooksErrorCode(error);
      if (errorCode !== undefined) {
        defaultError = translate('Error.SavingWithErrorCode', {
          errorCode,
        });
      }

      showSnackbarMessage('error', defaultError);
    },
  });

  const toggleWebhook = useCallback(
    async (id: string) => {
      const webhook = webhooks?.find((wh) => wh.id === id);
      if (webhook) {
        return updateWebhookAsync({
          webhookId: webhook.id,
          webhookConfiguration: {
            eventTypes: webhook.eventTypes,
            webhookConfigurationParameters: {
              ...webhook.webhookConfigurationParameters,
              isEnabled: !webhook.webhookConfigurationParameters.isEnabled,
            },
          },
        });
      }
      return undefined;
    },
    [updateWebhookAsync, webhooks],
  );

  const { mutateAsync: triggerWebhookAsync } = useMutation({
    mutationFn: triggerWebhook,
    onSuccess: (_, webhookConfig) => {
      showSnackbarMessage(
        'success',
        translate('Description.TestWebhookSuccessful', {
          url: webhookConfig.webhookConfigurationParameters.webhookUrl,
        }),
      );
    },
    onError: async (error) => {
      let defaultError = translate('Error.TestWebhook');
      const errorCode = await extractWebhooksErrorCode(error);
      if (errorCode !== undefined) {
        defaultError = translate('Error.TestWebhookWithCode', {
          errorCode,
        });
      }

      showSnackbarMessage('error', defaultError);
    },
  });

  const value = useMemo(
    () =>
      ({
        webhooks: webhooks || [],
        isPending,
        isError,
        isDeleting,
        isUpdating,
        isCreating,
        createWebhook: createWebhookAsync,
        updateWebhook: updateWebhookAsync,
        triggerWebhook: triggerWebhookAsync,
        refetchWebhooks: refetch,
        deleteWebhook: deleteWebhookAsync,
        toggleWebhook,
      }) as WebhooksContext,
    [
      webhooks,
      isPending,
      isError,
      isDeleting,
      isUpdating,
      isCreating,
      createWebhookAsync,
      triggerWebhookAsync,
      deleteWebhookAsync,
      updateWebhookAsync,
      toggleWebhook,
      refetch,
    ],
  );

  return <WebhooksContext.Provider value={value}>{children}</WebhooksContext.Provider>;
};

export default withTranslation(WebhooksProvider, [
  TranslationNamespace.Notifications,
  TranslationNamespace.Settings,
  TranslationNamespace.SendrNotificationPreferences,
]);

export function useWebhooks(): WebhooksContext {
  const context = useContext(WebhooksContext);
  if (context === null) {
    throw new Error('useWebhooks must be used within a WebhooksProvider');
  }
  return context;
}
