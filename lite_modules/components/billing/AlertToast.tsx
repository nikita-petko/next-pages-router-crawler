import { Button, IconButton } from '@rbx/foundation-ui';
import { Alert, AlertTitle } from '@rbx/ui';
import { ReactNode, useState } from 'react';

import useAlertToastStyles from '@components/billing/AlertToast.styles';
import Collapse from '@components/common/Collapse';
import { TranslationNamespace } from '@constants/localization';
import { AlertToastLevel } from '@constants/toastConstants';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

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
  const {
    classes: { alertAction, alertRoot, secondaryButton },
  } = useAlertToastStyles();

  const [hideToast, setHideToast] = useState<boolean>(false);

  const buttons = [];
  if (secondaryButtonText) {
    buttons.push(
      <Button
        className={secondaryButton}
        data-testid='secondaryButton'
        key='secondaryButton'
        onClick={onSecondaryButtonClick}
        size='Medium'
        variant='Standard'>
        {secondaryButtonText}
      </Button>,
    );
  }
  if (primaryButtonText) {
    buttons.push(
      <Button
        data-testid='primaryButton'
        key='primaryButton'
        onClick={onPrimaryButtonClick}
        size='Medium'
        variant='Standard'>
        {primaryButtonText}
      </Button>,
    );
  }
  if ((!secondaryButtonText && !primaryButtonText) || alwaysShowCloseButton) {
    buttons.push(
      <IconButton
        ariaLabel={translate('Description.CloseButton')}
        data-testid='closeButton'
        icon='icon-regular-x'
        key='closeButton'
        onClick={() => {
          setHideToast(true);
          onCloseButtonClick();
        }}
        variant='Utility'
      />,
    );
  }

  return (
    <Collapse in={!hideToast} unmountOnExit>
      <Alert
        action={buttons}
        classes={{
          action: alertAction,
          root: alertRoot,
        }}
        data-testid='toastContainer'
        severity={level}>
        {header && <AlertTitle data-testid='toastHeader'>{header}</AlertTitle>}
        {text}
      </Alert>
    </Collapse>
  );
};

export default AlertToast;
