import React, {
  type FunctionComponent,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
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
import { useTranslation } from '@rbx/intl';
import { CreatorNotificationCategory } from '@rbx/clients/creatorSettings';
import { WebhookFormType } from './webhooksFieldMetadata';
import useWebhooksTriggerFormStyles from './WebhooksTriggerForm.style';

type WebhooksTriggersFormProps = {
  value: WebhookFormType['triggers'];
  triggers: CreatorNotificationCategory[];
  onChange: (panel: string, label: string, checked: boolean) => void;
  errorText?: string;
};

const WebhooksTriggersForm: FunctionComponent<
  React.PropsWithChildren<WebhooksTriggersFormProps>
> = ({ value, triggers, onChange, errorText }) => {
  const { translate } = useTranslation();
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
                {category.notifications?.map((notification) => {
                  if (!notification?.notificationType) {
                    return <React.Fragment key='fragment' />;
                  }

                  return (
                    <Grid item key={`${panelName}${notification.notificationType}`}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            color='secondary'
                            checked={value[notification.notificationType] ?? false}
                            aria-label={`checkbox for trigger ${notification.notificationType}`}
                          />
                        }
                        label={`${translate(
                          `Label.NotificationType${notification.notificationType}`,
                        )}: ${translate(
                          `Description.NotificationType${notification.notificationType}`,
                        )}`}
                        onChange={handleCheckboxChange(panelName, notification.notificationType)}
                        value={value[notification.notificationType]}
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
  }, [expanded, handleCheckboxChange, styles.accordion, translate, triggers, value]);

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
