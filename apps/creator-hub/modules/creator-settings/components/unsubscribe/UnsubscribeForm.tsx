import { useTranslation } from '@rbx/intl';
import { RadioGroup, FormControlLabel, Radio } from '@rbx/ui';
import React, { FunctionComponent, useCallback } from 'react';
import UnsubscribeScope from './UnsubscribeScope';

interface UnsubscribeFormProps {
  onChange: (unsubscribePreference: UnsubscribeScope) => void;
  unsubscribeScope: UnsubscribeScope;
  notificationType: string;
}

const UnsubscribeForm: FunctionComponent<React.PropsWithChildren<UnsubscribeFormProps>> = ({
  onChange,
  unsubscribeScope,
  notificationType,
}) => {
  const { translate } = useTranslation();
  const handleUnsubscribePreferenceChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newPreference = event.target.value as UnsubscribeScope;
      onChange(newPreference);
    },
    [onChange],
  );

  const unsubscribeEventLabel =
    translate(`Description.UnsubscribeFrom${notificationType}`) ||
    translate('Label.StopReceivingEmailNotificationsTypeV2', {
      eventType: translate(`Label.NotificationType${notificationType}`),
    });

  return (
    <RadioGroup value={unsubscribeScope} onChange={handleUnsubscribePreferenceChange}>
      <FormControlLabel
        value={UnsubscribeScope.Event}
        control={<Radio aria-label={unsubscribeEventLabel} />}
        label={unsubscribeEventLabel}
      />
      <FormControlLabel
        value={UnsubscribeScope.All}
        control={<Radio aria-label={translate('Label.StopReceivingAllEmailNotificationsV2')} />}
        label={translate('Label.StopReceivingAllEmailNotificationsV2')}
      />
    </RadioGroup>
  );
};

export default UnsubscribeForm;
