import type { FunctionComponent } from 'react';
import type { TButtonProps } from '@rbx/foundation-ui';
import { Button, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import type { FormattedText } from '@modules/analytics-translations/types';

export type AnalyticsPageActionProps = {
  text: FormattedText;
  /**
   * When provided, the action is wrapped in a Tooltip. The consumer decides
   * when a tooltip is appropriate (e.g. only while `isDisabled` is true to
   * explain why the action is unavailable) and simply omits this prop
   * otherwise so the button renders bare.
   */
  tooltip?: FormattedText;
} & TButtonProps;

export const AnalyticsPageAction: FunctionComponent<AnalyticsPageActionProps> = ({
  text,
  tooltip,
  ...props
}) => {
  const button = <Button {...props}>{text}</Button>;
  if (tooltip == null) {
    return button;
  }
  return (
    <Tooltip title={String(tooltip)} position='bottom-center'>
      <TooltipTrigger asChild>
        <span>{button}</span>
      </TooltipTrigger>
    </Tooltip>
  );
};
