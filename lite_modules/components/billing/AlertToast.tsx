import { Alert, TAlertSeverity } from '@rbx/foundation-ui';
import { ReactNode, useState } from 'react';

import Collapse from '@components/common/Collapse';
import { TranslationNamespace } from '@constants/localization';
import { AlertToastLevel } from '@constants/toastConstants';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

// AlertToastLevel keeps the lowercase wire values that StringToAlertToastLevel
// parses out of backend status banners; Foundation severities are capitalized.
const AlertSeverityByLevel: Record<AlertToastLevel, TAlertSeverity> = {
  [AlertToastLevel.Error]: 'Error',
  [AlertToastLevel.Info]: 'Info',
  [AlertToastLevel.Warning]: 'Warning',
};

// Alert models the dismiss affordance as a discriminated union: onDismiss is
// required when the affordance is shown and forbidden when it is not, so the
// two shapes have to be built separately rather than toggled with a boolean.
type AlertCloseProps =
  | { closeLabel: string; hasCloseAffordance: true; onDismiss: () => void }
  | { hasCloseAffordance: false };

interface AlertToastProps {
  alwaysShowCloseButton?: boolean;
  header?: ReactNode;
  level: AlertToastLevel;
  onCloseButtonClick?: () => void;
  onPrimaryButtonClick?: () => void;
  onSecondaryButtonClick?: () => void;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  text?: ReactNode;
}

// Base toast that is reused and customized for different banners.
// Can have 0-2 buttons
const AlertToast = ({
  alwaysShowCloseButton = false,
  header,
  level,
  onCloseButtonClick = () => {},
  onPrimaryButtonClick,
  onSecondaryButtonClick,
  primaryButtonText = '',
  secondaryButtonText = '',
  text,
}: AlertToastProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);

  const [hideToast, setHideToast] = useState<boolean>(false);

  const hasActions = Boolean(primaryButtonText || secondaryButtonText);
  const closeProps: AlertCloseProps =
    !hasActions || alwaysShowCloseButton
      ? {
          closeLabel: translate('Description.CloseButton'),
          hasCloseAffordance: true,
          onDismiss: () => {
            setHideToast(true);
            onCloseButtonClick();
          },
        }
      : { hasCloseAffordance: false };

  return (
    <Collapse in={!hideToast} unmountOnExit>
      <Alert
        {...closeProps}
        data-testid='toastContainer'
        onPrimaryAction={onPrimaryButtonClick}
        onSecondaryAction={onSecondaryButtonClick}
        primaryActionLabel={primaryButtonText}
        secondaryActionLabel={secondaryButtonText}
        severity={AlertSeverityByLevel[level]}
        variant='Feedback'>
        {/* Foundation Alert has no title slot and lays its message out as `flex
            items-center`, so the header is stacked above the body here. */}
        <div className='flex flex-col gap-xsmall'>
          {header ? (
            <span className='text-title-small' data-testid='toastHeader'>
              {header}
            </span>
          ) : null}
          {text}
        </div>
      </Alert>
    </Collapse>
  );
};

export default AlertToast;
