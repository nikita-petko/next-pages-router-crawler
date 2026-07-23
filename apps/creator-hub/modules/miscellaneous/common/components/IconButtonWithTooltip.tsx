import { IconButton, Tooltip } from '@rbx/ui';
import React, { FunctionComponent } from 'react';

export interface IconButtonWithTooltipProps {
  className?: string;
  tooltipMsg: string;
  icon: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

const IconButtonWithTooltip: FunctionComponent<
  React.PropsWithChildren<IconButtonWithTooltipProps>
> = ({ className, tooltipMsg, icon, onClick }) => {
  return (
    <Tooltip title={tooltipMsg} placement='right' enterDelay={200}>
      <IconButton
        aria-label={tooltipMsg}
        classes={{ root: className }}
        onClick={onClick}
        size='small'
        color='secondary'>
        {icon}
      </IconButton>
    </Tooltip>
  );
};
export default IconButtonWithTooltip;
