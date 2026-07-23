import type { FunctionComponent, CSSProperties } from 'react';
import React, { useMemo } from 'react';
import type { TButtonProps } from '@rbx/ui';
import { Button, Tooltip } from '@rbx/ui';

export declare type ButtonWithDisabledTooltipProps = TButtonProps & {
  tooltipTitle: string;
  disabledButtonStyle?: CSSProperties;
};

const ButtonWithDisabledTooltip: FunctionComponent<
  React.PropsWithChildren<ButtonWithDisabledTooltipProps>
> = ({ disabled, tooltipTitle, disabledButtonStyle, ...rest }) => {
  const buttonComponent = useMemo(
    () => (
      <Button disabled={disabled} style={disabled ? disabledButtonStyle : undefined} {...rest} />
    ),
    [disabled, rest, disabledButtonStyle],
  );
  if (!disabled) {
    return buttonComponent;
  }

  // NOTE(dlevine,10/27/22): To support tooltips on disabled buttons, we need to wrap them in a span
  return (
    <Tooltip title={tooltipTitle}>
      <span>{buttonComponent}</span>
    </Tooltip>
  );
};

export default ButtonWithDisabledTooltip;
