import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useGetCreatorSettings } from '@modules/react-query/creatorSettings';
import { useWebhooks } from '@modules/react-query/webhooks';
import type {
  CreateWebhook,
  UpdateWebhook,
  TriggerWebhook,
  DeleteWebhook,
  ToggleWebhook,
  RefetchWebhooks,
  Webhook,
} from '@modules/react-query/webhooks';
import { experienceWebhookTriggers } from './experienceWebhookTriggersConstants';
import WebhooksConfigureForm from './WebhooksConfigureForm';
import useWebhooksContainerStyles from './WebhooksContainer.styles';
import WebhooksOverview from './WebhooksOverview';

export type WebhooksDataSource = {
  webhooks: Webhook[];
  isPending: boolean;
  isError: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  createWebhook: CreateWebhook;
  updateWebhook: UpdateWebhook;
  triggerWebhook: TriggerWebhook;
  refetchWebhooks: RefetchWebhooks;
  deleteWebhook: DeleteWebhook;
  toggleWebhook: ToggleWebhook;
};

type WebhooksContainerProps = {
  basePath?: string;
  useWebhooksHook?: () => WebhooksDataSource;
  useHardcodedTriggers?: boolean;
  experienceId?: number;
};

const WebhooksContainer: FunctionComponent<React.PropsWithChildren<WebhooksContainerProps>> = ({
  basePath = '/settings/webhooks',
  useWebhooksHook = useWebhooks,
  useHardcodedTriggers = false,
  experienceId,
}) => {
  const { user } = useAuthentication();
  const {
    webhooks,
    isPending: isWebhooksLoading,
    isError: isWebhooksError,
    isUpdating,
    isDeleting,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    refetchWebhooks,
    toggleWebhook,
    triggerWebhook,
  } = useWebhooksHook();
  const {
    data: fetchedTriggers,
    isPending: isTriggersLoading,
    isError: isTriggersError,
  } = useGetCreatorSettings(useHardcodedTriggers ? undefined : user?.id, ['Webhook']);
  const triggers = useHardcodedTriggers ? experienceWebhookTriggers : fetchedTriggers;
  const { ready: translateReady } = useTranslation();
  const router = useRouter();
  const { classes: styles } = useWebhooksContainerStyles();
  const [existingWebhook, setExistingWebhook] = useState<Webhook | undefined>(undefined);
  const [configureWebhook, setConfigureWebhook] = useState(false);

  const handleConfigureWebhook = useCallback((webhook?: Webhook) => {
    setExistingWebhook(webhook);
    setConfigureWebhook(true);
  }, []);

  const handleListViewWebhook = useCallback(
    (reloadWebhooks?: boolean) => {
      if (reloadWebhooks) {
        void refetchWebhooks();
      }

      setConfigureWebhook(false);
      setExistingWebhook(undefined);
    },
    [refetchWebhooks],
  );

  useEffect(() => {
    const listenToWebhooksNavigation = (pathname: string) => {
      if (pathname?.endsWith(basePath)) {
        handleListViewWebhook(false);
      }
    };

    router.events.on('routeChangeStart', listenToWebhooksNavigation);

    return () => router.events.off('routeChangeStart', listenToWebhooksNavigation);
  }, [basePath, handleListViewWebhook, router.events]);

  if (
    (isWebhooksLoading && !isWebhooksError) ||
    (!useHardcodedTriggers && isTriggersLoading && !isTriggersError) ||
    !translateReady
  ) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  const webhookPage = configureWebhook ? (
    <WebhooksConfigureForm
      previousWebhook={existingWebhook}
      returnToListView={handleListViewWebhook}
      triggers={triggers ?? []}
      isUpdating={isUpdating}
      isDeleting={isDeleting}
      createWebhook={createWebhook}
      updateWebhook={updateWebhook}
      triggerWebhook={triggerWebhook}
      readOnlyTriggers={useHardcodedTriggers}
      experienceId={experienceId}
    />
  ) : (
    <WebhooksOverview
      webhooks={webhooks ?? []}
      triggers={triggers ?? []}
      isDeleting={isDeleting}
      configureWebhook={handleConfigureWebhook}
      deleteWebhook={deleteWebhook}
      toggleWebhook={toggleWebhook}
    />
  );

  return <div className={styles.container}>{webhookPage}</div>;
};

export default withTranslation(WebhooksContainer, [
  TranslationNamespace.Notifications,
  TranslationNamespace.Settings,
  TranslationNamespace.SendrNotificationPreferences,
]);
