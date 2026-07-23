import { Button, TButtonProps, Tooltip } from '@rbx/ui';
import React, { FunctionComponent, useMemo, CSSProperties } from 'react';

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
