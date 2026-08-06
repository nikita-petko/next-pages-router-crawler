import { Icon } from '@rbx/foundation-ui';

import AppTooltip from '@components/common/AppTooltip';
import useInfoTooltipStyles from '@components/reporting/InfoTooltip.styles';
import { InfoTooltipProps } from '@type/genericManagementTable';

const InfoTooltip = ({ placement = 'bottom', text }: InfoTooltipProps) => {
  const {
    classes: { tooltip },
  } = useInfoTooltipStyles();
  return (
    <AppTooltip position={`${placement}-center`} title={text}>
      <Icon className={tooltip} name='icon-regular-circle-i' size='Small' />
    </AppTooltip>
  );
};

export default InfoTooltip;
