import type { FunctionComponent, ReactNode } from 'react';
import React, { useState } from 'react';
import { Alert } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';

export interface GenericVerificationAlertProps {
  alertTitle: string | undefined;
  alertDescription: string | ReactNode | undefined;
  severity: 'info' | 'warning' | 'error';
  externalLink: string | undefined;
  linkLabel: string | undefined;
  allowCloseDialog: boolean;
  onDismiss?: () => void;
}

const SEVERITY_MAP = {
  info: 'Info',
  warning: 'Warning',
  error: 'Error',
} as const;

const GenericVerificationAlert: FunctionComponent<
  React.PropsWithChildren<GenericVerificationAlertProps>
> = ({
  alertTitle,
  alertDescription,
  severity,
  externalLink,
  linkLabel,
  allowCloseDialog,
  onDismiss,
}) => {
  const { translate } = useTranslation();
  const [showAlert, setShowAlert] = useState<boolean>(true);

  const handleClose = () => {
    onDismiss?.();
    setShowAlert(false);
  };

  if (!showAlert) {
    return null;
  }

  const dismissProps = allowCloseDialog
    ? ({ closeLabel: translate('Action.Close'), onDismiss: handleClose } as const)
    : ({ hasCloseAffordance: false } as const);

  return (
    <Alert
      severity={SEVERITY_MAP[severity]}
      variant='Feedback'
      className='width-full'
      primaryActionLabel={linkLabel}
      primaryActionHref={externalLink}
      {...dismissProps}>
      <div className='flex flex-col gap-xsmall'>
        {alertTitle && <span className='text-label-medium content-emphasis'>{alertTitle}</span>}
        <span className='text-body-medium text-truncate-split content-default width-full'>
          {alertDescription}
        </span>
      </div>
    </Alert>
  );
};

export default GenericVerificationAlert;
