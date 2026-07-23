import { Button } from '@rbx/ui';
import React, { FC } from 'react';

export type Action = {
  buttonLabel: string;
  onAction: () => void;
  optionLabel?: string;
  variant?: 'outlined' | 'contained';
  isDisabled?: boolean;
  dataTestId?: string;
};

type ActionButtonProps = {
  action: Action;
};
const ActionButton: FC<ActionButtonProps> = ({ action }) => {
  const { buttonLabel, onAction, variant, isDisabled, dataTestId } = action;
  return (
    <Button
      onClick={onAction}
      variant={variant}
      color='secondary'
      fullWidth={false}
      disabled={isDisabled}
      data-testid={dataTestId}>
      {buttonLabel}
    </Button>
  );
};

export default ActionButton;
