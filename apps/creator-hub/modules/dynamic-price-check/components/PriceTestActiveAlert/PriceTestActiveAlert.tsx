import { useState } from 'react';
import { Alert, AlertTitle, CloseIcon, IconButton } from '@rbx/ui';

interface PriceTestActiveAlertProps {
  alertTitleText?: string;
  alertDescriptionText?: string;
  isTestActive: boolean;
}

const PriceTestActiveAlert = ({
  alertTitleText,
  alertDescriptionText,
  isTestActive,
}: PriceTestActiveAlertProps) => {
  const [isAlertOpen, setIsAlertOpen] = useState<boolean>(true);

  const isAlertVisible = isAlertOpen && isTestActive;

  if (!isAlertVisible) {
    return null;
  }

  return (
    <Alert
      severity='warning'
      action={
        <IconButton aria-label='Close' color='secondary' onClick={() => setIsAlertOpen(false)}>
          <CloseIcon />
        </IconButton>
      }>
      <AlertTitle>{alertTitleText}</AlertTitle>
      {alertDescriptionText}
    </Alert>
  );
};

export default PriceTestActiveAlert;
