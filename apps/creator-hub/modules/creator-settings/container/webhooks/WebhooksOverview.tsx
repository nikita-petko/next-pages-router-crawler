import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import type { CreatorNotificationCategory } from '@rbx/client-creator-settings/v1';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useTranslation } from '@rbx/intl';
import { Button, Dialog, DialogTemplate, Grid, Typography } from '@rbx/ui';
import { Link } from '@modules/miscellaneous/components';
import type { DeleteWebhook, ToggleWebhook, Webhook } from '@modules/react-query/webhooks';
import useWebhooksOverviewStyles from './WebhooksOverview.styles';
import WebhooksTable from './WebhooksTable';

type WebhooksOverviewProps = {
  webhooks: Webhook[];
  triggers: CreatorNotificationCategory[];
  isDeleting: boolean;
  configureWebhook: (existingWebhook?: Webhook) => void;
  deleteWebhook: DeleteWebhook;
  toggleWebhook: ToggleWebhook;
};

const WebhooksOverview: FunctionComponent<React.PropsWithChildren<WebhooksOverviewProps>> = ({
  webhooks,
  triggers,
  isDeleting,
  configureWebhook,
  deleteWebhook,
  toggleWebhook,
}) => {
  const { translate, translateHTML } = useTranslation();
  const { classes: styles } = useWebhooksOverviewStyles();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [togglingWebhookId, setTogglingWebhookId] = useState<string>();
  const [webhookToDelete, setWebhookToDelete] = useState<Webhook>();

  const onDialogCancel = () => {
    setIsDialogOpen(false);
  };

  const onDialogConfirm = useCallback(async () => {
    if (!webhookToDelete) {
      return;
    }

    await deleteWebhook(webhookToDelete.id);
    setIsDialogOpen(false);
  }, [deleteWebhook, webhookToDelete]);

  const handleAddWebhook = () => {
    configureWebhook();
  };

  const handleToggleWebhook = useCallback(
    async (webhook: Webhook) => {
      setTogglingWebhookId(webhook.id);
      await toggleWebhook(webhook.id);
      setTogglingWebhookId(undefined);
    },
    [toggleWebhook],
  );

  const handleEditWebhook = async (webhook: Webhook) => {
    configureWebhook(webhook);
  };

  const handleDeleteWebhook = async (webhook: Webhook) => {
    setWebhookToDelete(webhook);
    setIsDialogOpen(true);
  };

  return (
    <>
      <Grid className={styles.grid} item container direction='column'>
        <Grid className={styles.descriptionGrid} item container direction='column'>
          <Grid item>
            <Typography variant='body1'>
              {translateHTML('Description.WebhooksUnpluralized', [
                {
                  opening: 'setupLinkStart',
                  closing: 'setupLinkEnd',
                  content(chunks) {
                    return (
                      <Link
                        href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/reference/cloud/webhook-notifications`}
                        target='_blank'>
                        {chunks}
                      </Link>
                    );
                  },
                },
                {
                  opening: 'useWebhookLinkStart',
                  closing: 'useWebhookLinkEnd',
                  content(chunks) {
                    return (
                      <Link
                        href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/reference/cloud/webhook-notifications#webhook-workflow`}
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
        <Grid className={styles.buttonGrid} item container direction='column'>
          <Grid item>
            <Button
              variant='contained'
              color='primaryBrand'
              onClick={handleAddWebhook}
              disabled={webhooks.length >= 5}>
              {translate('Action.AddWebhook')}
            </Button>
          </Grid>
          {webhooks.length >= 5 && (
            <Grid item>
              <Typography variant='caption' color='secondary'>
                {translate('Description.WebhookMaximumLimitReachedUnpluralized')}
              </Typography>
            </Grid>
          )}
        </Grid>
        <Grid item container direction='column'>
          <WebhooksTable
            webhooks={webhooks}
            togglingWebhookId={togglingWebhookId}
            onToggle={handleToggleWebhook}
            onEdit={handleEditWebhook}
            onDelete={handleDeleteWebhook}
            triggers={triggers}
          />
        </Grid>
      </Grid>
      <Dialog maxWidth='Medium' open={isDialogOpen} onClose={onDialogCancel}>
        <DialogTemplate
          title={translate('Title.DeleteWebhook')}
          cancelText={translate('Action.Close')}
          confirmText={translate('Action.DeleteWebhook')}
          onCancel={onDialogCancel}
          onConfirm={onDialogConfirm}
          loading={isDeleting}
          color='destructive'
          content={
            <Typography align='center' variant='body1'>
              {translateHTML(
                'Description.DeleteWebhookStylized',
                [
                  {
                    opening: 'webhookNameStart',
                    closing: 'webhookNameEnd',
                    content(chunks) {
                      return <strong>{chunks}</strong>;
                    },
                  },
                  {
                    opening: 'webhookPayloadUrlStart',
                    closing: 'webhookPayloadUrlEnd',
                    content(chunks) {
                      return <strong>{chunks}</strong>;
                    },
                  },
                ],
                {
                  webhookName: webhookToDelete?.webhookConfigurationParameters.name ?? '',
                  webhookPayloadUrl:
                    webhookToDelete?.webhookConfigurationParameters.webhookUrl ?? '',
                },
              )}
            </Typography>
          }
        />
      </Dialog>
    </>
  );
};

export default WebhooksOverview;
