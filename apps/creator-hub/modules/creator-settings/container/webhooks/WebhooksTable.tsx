import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import type { CreatorNotificationCategory } from '@rbx/client-creator-settings/v1';
import { useTranslation } from '@rbx/intl';
import {
  DeleteOutlinedIcon,
  Divider,
  EditOutlinedIcon,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Typography,
} from '@rbx/ui';
import type { Webhook } from '@modules/react-query/webhooks';
import useWebhooksTableStyles from './WebhooksTable.style';
import getTriggersForCategory from './webhookTriggersReducer';

type WebhooksTableProps = {
  webhooks: Webhook[];
  triggers: CreatorNotificationCategory[];
  togglingWebhookId?: string;
  onToggle: (webhook: Webhook) => void;
  onEdit: (webhook: Webhook) => void;
  onDelete: (webhook: Webhook) => void;
};

const WebhooksTable: FunctionComponent<React.PropsWithChildren<WebhooksTableProps>> = ({
  webhooks,
  triggers,
  togglingWebhookId,
  onToggle,
  onEdit,
  onDelete,
}) => {
  const { translate } = useTranslation();
  const { classes: styles } = useWebhooksTableStyles();

  const triggerToCategoryNameMap: Record<string, string> = useMemo(() => {
    return getTriggersForCategory(triggers, translate);
  }, [triggers, translate]);

  const handleToggle = (webhook: Webhook) => () => {
    onToggle(webhook);
  };

  const handleEdit = (webhook: Webhook) => () => {
    onEdit(webhook);
  };

  const handleDelete = (webhook: Webhook) => () => {
    onDelete(webhook);
  };

  const listItems = webhooks.map((webhook, index) => {
    const triggersToCategories = webhook.eventTypes?.map(
      (eventType) => triggerToCategoryNameMap[eventType],
    );
    const triggerToCategoriesDeduped = Array.from(new Set(triggersToCategories));
    // TODO: Get better translation setup to handle rendering "comma-separated" list of strings
    // in different locales
    const webhookSubtitle = triggerToCategoriesDeduped.join(', ');
    const isTogglingWebhook = togglingWebhookId === webhook.id;
    return (
      <React.Fragment key={webhook.id}>
        <ListItem>
          <ListItemIcon>
            <Switch
              checked={webhook.webhookConfigurationParameters.isEnabled}
              onChange={handleToggle(webhook)}
              aria-label={`Toggle ${webhook.webhookConfigurationParameters.name}`}
              loading={isTogglingWebhook}
              disabled={isTogglingWebhook}
            />
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography noWrap className={styles.listText} variant='h4' display='block'>
                {webhook.webhookConfigurationParameters.name}
              </Typography>
            }
            secondary={
              <Typography
                noWrap
                className={styles.listText}
                variant='body2'
                color='secondary'
                display='block'>
                {webhookSubtitle}
              </Typography>
            }
          />
          <IconButton
            onClick={handleEdit(webhook)}
            disabled={isTogglingWebhook}
            aria-label={`Edit ${webhook.webhookConfigurationParameters.name}`}
            size='large'>
            <EditOutlinedIcon color='secondary' />
          </IconButton>
          <IconButton
            onClick={handleDelete(webhook)}
            disabled={isTogglingWebhook}
            aria-label={`Delete ${webhook.webhookConfigurationParameters.name}`}
            size='large'>
            <DeleteOutlinedIcon color='error' />
          </IconButton>
        </ListItem>
        {index !== webhooks.length - 1 && <Divider className={styles.divider} />}
      </React.Fragment>
    );
  });

  return <List>{listItems}</List>;
};

export default WebhooksTable;
