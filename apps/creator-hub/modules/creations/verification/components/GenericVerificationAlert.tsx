import React, { FunctionComponent, ReactNode, useState } from 'react';
import { Alert, AlertTitle, Button, CloseIcon, IconButton } from '@rbx/ui';
import useVerificationStyles from './Verification.styles';

export interface GenericVerificationAlertProps {
  alertTitle: string | undefined;
  alertDescription: string | ReactNode | undefined;
  severity: 'info' | 'warning' | 'error';
  externalLink: string | undefined;
  linkLabel: string | undefined;
  allowCloseDialog: boolean;
  onDismiss?: () => void;
}

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
  const {
    classes: { alertStyle },
  } = useVerificationStyles();
  const [showAlert, setShowAlert] = useState<boolean>(true);

  const handleClose = () => {
    onDismiss?.();
    setShowAlert(false);
  };

  if (showAlert) {
    return (
      <Alert
        severity={severity}
        onClose={undefined}
        className={alertStyle}
        action={
          <React.Fragment>
            <Button color='inherit' size='small' href={externalLink}>
              {linkLabel}
            </Button>
            {allowCloseDialog && (
              <IconButton aria-label='Close' color='inherit' size='small' onClick={handleClose}>
                <CloseIcon fontSize='small' />
              </IconButton>
            )}
          </React.Fragment>
        }>
        <AlertTitle>{alertTitle}</AlertTitle>
        {alertDescription}
      </Alert>
    );
  }
  return null;
};

export default GenericVerificationAlert;
