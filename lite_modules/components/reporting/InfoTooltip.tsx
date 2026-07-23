import { Icon } from '@rbx/foundation-ui';
import { Tooltip } from '@rbx/ui';

import useInfoTooltipStyles from '@components/reporting/InfoTooltip.styles';
import { InfoTooltipProps } from '@type/genericManagementTable';

const InfoTooltip = ({
  disableHoverListener = false,
  placement = 'bottom',
  text,
}: InfoTooltipProps) => {
  const {
    classes: { tooltip },
  } = useInfoTooltipStyles();
  return (
    <Tooltip arrow disableHoverListener={disableHoverListener} placement={placement} title={text}>
      <Icon className={tooltip} name='icon-regular-circle-i' size='Small' />
    </Tooltip>
  );
};

export default InfoTooltip;
