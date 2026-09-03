import type { FunctionComponent } from 'react';
import React from 'react';
import { Button, Tooltip } from '@rbx/ui';

export interface ToolTipButtonProps {
  tooltipOnDisableMsg?: string;
  disabled?: boolean;
  btnMsg?: string;
  onClick?: () => void;
  className?: string;
}
const TooltipButton: FunctionComponent<React.PropsWithChildren<ToolTipButtonProps>> = ({
  className,
  tooltipOnDisableMsg,
  disabled,
  btnMsg,
  onClick,
}) => {
  let tooltipBtn = (
    <Button className={className} variant='contained' disabled={disabled} onClick={onClick}>
      {btnMsg}
    </Button>
  );

  if (tooltipOnDisableMsg !== undefined && disabled) {
    tooltipBtn = (
      <Tooltip data-testid='button-toolTip' title={tooltipOnDisableMsg} arrow>
        <span>{tooltipBtn}</span>
      </Tooltip>
    );
  }

  return tooltipBtn;
};
export default TooltipButton;
