import React, {
  type FunctionComponent,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  CreatorNotification,
  CreatorNotificationCategory,
} from '@rbx/client-creator-settings/v1';
import { useTranslation } from '@rbx/intl';
import {
  Accordion,
  AccordionSummary,
  ExpandMoreIcon,
  Typography,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  Grid,
} from '@rbx/ui';
import { Link } from '@modules/miscellaneous/components';
import { ExperienceWebhookNotificationType } from './experienceWebhookTriggersConstants';
import type { WebhookFormType } from './webhooksFieldMetadata';
import useWebhooksTriggerFormStyles from './WebhooksTriggerForm.style';

type WebhooksTriggersFormProps = {
  value: WebhookFormType['triggers'];
  triggers: CreatorNotificationCategory[];
  onChange: (panel: string, label: string, checked: boolean) => void;
  errorText?: string;
  readOnly?: boolean;
  experienceId?: number;
};

const WebhooksTriggersForm: FunctionComponent<
  React.PropsWithChildren<WebhooksTriggersFormProps>
> = ({ value, triggers, onChange, errorText, readOnly = false, experienceId }) => {
  const { translate, translateHTML } = useTranslation();
  const { classes: styles } = useWebhooksTriggerFormStyles();
  const [expanded, setExpanded] = useState<string>();

  const handleAccordionPanelChange =
    (panel: string) => (_event: SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : '');
    };

  const handleCheckboxChange = useCallback(
    (panel: string, type: string) => (_event: SyntheticEvent, checked: boolean) => {
      onChange(panel, type, checked);
    },
    [onChange],
  );

  useEffect(() => {
    if (triggers && triggers.length > 0) {
      setExpanded(triggers[0].notificationCategoryName);
    }
  }, [triggers]);

  const accordions = useMemo(() => {
    return triggers.map((category, index) => {
      const panelName = category.notificationCategoryName;
      if (!panelName) {
        return <React.Fragment key='fragment' />;
      }

      return (
        <Grid className={styles.accordion} key={panelName}>
          <Accordion
            expanded={expanded === panelName}
            defaultExpanded={index === 0}
            onChange={handleAccordionPanelChange(panelName)}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant='h4'>
                {translate(`Label.Category${category.notificationCategoryName}`)}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container direction='column'>
                {category.notifications?.map((notification: CreatorNotification) => {
                  if (!notification?.notificationType) {
                    return <React.Fragment key='fragment' />;
                  }

                  const isChecked = readOnly
                    ? true
                    : (value[notification.notificationType] ?? false);

                  const isAnalyticsAlert =
                    notification.notificationType === ExperienceWebhookNotificationType;

                  const labelNode = isAnalyticsAlert
                    ? translateHTML('Description.NotificationTypeAnalyticsAlert', [
                        {
                          opening: 'linkStart',
                          closing: 'linkEnd',
                          content(chunks) {
                            return experienceId != null ? (
                              <Link
                                href={`/dashboard/creations/experiences/${experienceId}/alerts`}>
                                {chunks}
                              </Link>
                            ) : (
                              <>{chunks}</>
                            );
                          },
                        },
                      ])
                    : `${translate(
                        `Label.NotificationType${notification.notificationType}`,
                      )}: ${translate(
                        `Description.NotificationType${notification.notificationType}`,
                      )}`;

                  return (
                    <Grid item key={`${panelName}${notification.notificationType}`}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            color='secondary'
                            checked={isChecked}
                            disabled={readOnly}
                            aria-label={`checkbox for trigger ${notification.notificationType}`}
                          />
                        }
                        label={labelNode}
                        onChange={
                          readOnly
                            ? undefined
                            : handleCheckboxChange(panelName, notification.notificationType)
                        }
                      />
                    </Grid>
                  );
                })}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>
      );
    });
  }, [
    expanded,
    experienceId,
    handleCheckboxChange,
    readOnly,
    styles.accordion,
    translate,
    translateHTML,
    triggers,
    value,
  ]);

  return (
    <Grid className={styles.container} container direction='column'>
      <Grid item>
        <Typography color='error'>{errorText}</Typography>
      </Grid>
      <Grid item>{accordions}</Grid>
    </Grid>
  );
};

export default WebhooksTriggersForm;
