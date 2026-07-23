import type { FunctionComponent } from 'react';
import { Icon, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';

type RevShareManagingGroupIconProps = {
  ariaLabel: string;
};

export const RevShareManagingGroupIcon: FunctionComponent<RevShareManagingGroupIconProps> = ({
  ariaLabel,
}) => (
  <Tooltip position='top-center' title={ariaLabel}>
    <TooltipTrigger asChild>
      <Icon
        name='icon-regular-three-people'
        size='Small'
        className='content-muted'
        aria-label={ariaLabel}
      />
    </TooltipTrigger>
  </Tooltip>
);
