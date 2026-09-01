import type { FunctionComponent } from 'react';
import { Icon } from '@rbx/foundation-ui';

type RevShareManagingGroupIconProps = {
  ariaLabel: string;
};

/** `aria-label` for AT; native `title` for hover (avoids Tooltip aria-describedby doubling the name). */
export const RevShareManagingGroupIcon: FunctionComponent<RevShareManagingGroupIconProps> = ({
  ariaLabel,
}) => (
  <Icon
    name='icon-regular-three-people'
    size='Small'
    className='content-muted'
    aria-label={ariaLabel}
    title={ariaLabel}
  />
);
