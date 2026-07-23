import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FunctionComponent } from 'react';
import React, { createContext, useCallback, useContext, useMemo } from 'react';
import type { WebhookConfiguration } from '@rbx/client-webhook-configuration-gateway/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import extractWebhooksErrorCode from './extractWebhooksErrorCode';
import {
  fetchUniverseWebhooks,
  createUniverseWebhook,
  updateUniverseWebhook,
  deleteUniverseWebhook,
} from './universeWebhooksRequests';
import type {
  CreateWebhook,
  UpdateWebhook,
  TriggerWebhook as TriggerWebhookFn,
  RefetchWebhooks,
  DeleteWebhook,
  ToggleWebhook,
} from './webhooksProvider';
import type { Webhook } from './webhooksRequests';
import { triggerWebhook } from './webhooksRequests';

type UniverseWebhooksProviderProps = {
  universeId: number;
  showSnackbarMessage: (severity: 'success' | 'error', msg: string) => void;
};

type UniverseWebhooksContext = {
  webhooks: Webhook[];
  isError: boolean;
  isPending: boolean;
  isDeleting: boolean;
  isUpdating: boolean;
  isCreating: boolean;
  createWebhook: CreateWebhook;
  updateWebhook: UpdateWebhook;
  triggerWebhook: TriggerWebhookFn;
  refetchWebhooks: RefetchWebhooks;
  deleteWebhook: DeleteWebhook;
  toggleWebhook: ToggleWebhook;
};

const UniverseWebhooksContext = createContext<UniverseWebhooksContext | null>(null);

const UniverseWebhooksProvider: FunctionComponent<
  React.PropsWithChildren<UniverseWebhooksProviderProps>
> = ({ universeId, showSnackbarMessage, children }) => {
  const queryClient = useQueryClient();
  const { translate, ready: translateReady } = useTranslation();
  const queryKey = useMemo(() => ['universeWebhooks', universeId], [universeId]);

  const {
    data: webhooks,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchUniverseWebhooks({ universeId }),
    enabled: Boolean(universeId) && translateReady,
    throwOnError: () => {
      showSnackbarMessage('error', translate('Error.GettingWebhooks'));
      return false;
    },
  });

  const { mutateAsync: createWebhookAsync, isPending: isCreating } = useMutation({
    mutationFn: createUniverseWebhook,
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

  const createWebhookAdapted: CreateWebhook = useCallback(
    async ({
      webhookConfiguration,
    }: {
      userId: number;
      webhookConfiguration: WebhookConfiguration;
    }) => createWebhookAsync({ universeId, webhookConfiguration }),
    [createWebhookAsync, universeId],
  );

  const { mutateAsync: deleteWebhookAsync, isPending: isDeleting } = useMutation({
    mutationFn: deleteUniverseWebhook,
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
    mutationFn: updateUniverseWebhook,
    onSuccess: (webhook) => {
      queryClient.setQueryData<Webhook[]>(queryKey, (prevWebhooks) => {
        if (!prevWebhooks) {
          return prevWebhooks;
        }
        return prevWebhooks.map((prevWebhook) => {
          if (webhook.id !== prevWebhook.id) {
            return prevWebhook;
          }
          return webhook;
        });
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

  const toggleWebhookFn = useCallback(
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
      return;
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
        createWebhook: createWebhookAdapted,
        updateWebhook: updateWebhookAsync,
        triggerWebhook: triggerWebhookAsync,
        refetchWebhooks: refetch,
        deleteWebhook: deleteWebhookAsync,
        toggleWebhook: toggleWebhookFn,
      }) as UniverseWebhooksContext,
    [
      webhooks,
      isPending,
      isError,
      isDeleting,
      isUpdating,
      isCreating,
      createWebhookAdapted,
      triggerWebhookAsync,
      deleteWebhookAsync,
      updateWebhookAsync,
      toggleWebhookFn,
      refetch,
    ],
  );

  return (
    <UniverseWebhooksContext.Provider value={value}>{children}</UniverseWebhooksContext.Provider>
  );
};

export default withTranslation(UniverseWebhooksProvider, [
  TranslationNamespace.Notifications,
  TranslationNamespace.Settings,
  TranslationNamespace.SendrNotificationPreferences,
]);

export function useUniverseWebhooks(): UniverseWebhooksContext {
  const context = useContext(UniverseWebhooksContext);
  if (context === null) {
    throw new Error('useUniverseWebhooks must be used within a UniverseWebhooksProvider');
  }
  return context;
}
