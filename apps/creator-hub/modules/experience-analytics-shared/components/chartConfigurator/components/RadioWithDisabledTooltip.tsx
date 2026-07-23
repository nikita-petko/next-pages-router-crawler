import type { FC } from 'react';
import { Radio, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';

type RadioWithDisabledTooltipProps = {
  value: string;
  label: string;
  isDisabled?: boolean;
  tooltipText?: string;
};

/**
 * Radio option that shows an explanatory tooltip when disabled, so users see
 * a control in a predictable position instead of it quietly disappearing.
 *
 * Anchors the tooltip beak to the radio circle (`top-start`) and keeps the
 * trigger span at its intrinsic width (`self-start`) so the beak lines up
 * with the radio rather than floating over the label text.
 */
const RadioWithDisabledTooltip: FC<RadioWithDisabledTooltipProps> = ({
  value,
  label,
  isDisabled,
  tooltipText,
}) => {
  const radio = <Radio value={value} label={label} isDisabled={isDisabled} />;
  if (!isDisabled || !tooltipText) {
    return radio;
  }
  return (
    <Tooltip title={tooltipText} position='top-start'>
      <TooltipTrigger asChild>
        <span className='self-start'>{radio}</span>
      </TooltipTrigger>
    </Tooltip>
  );
};

export default RadioWithDisabledTooltip;
