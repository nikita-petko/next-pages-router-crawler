import { IconButton, Tooltip } from '@rbx/ui';

interface IconButtonWithTooltipProps {
  className?: string;
  tooltipMsg: string;
  icon: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const IconButtonWithTooltip = ({
  className,
  tooltipMsg,
  icon,
  onClick,
}: IconButtonWithTooltipProps) => {
  return (
    <Tooltip title={tooltipMsg} enterDelay={200}>
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
