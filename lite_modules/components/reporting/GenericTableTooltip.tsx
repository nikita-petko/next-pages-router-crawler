import InfoTooltip from '@components/reporting/InfoTooltip';
import { TooltipProps } from '@type/genericManagementTable';

const GeneralTableTooltip = ({ renderTooltip = false, tooltipText = '' }: TooltipProps) => {
  if (renderTooltip) {
    return <InfoTooltip text={tooltipText} />;
  }
  return null;
};

export default GeneralTableTooltip;
