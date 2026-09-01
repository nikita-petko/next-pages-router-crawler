import type { FunctionComponent } from 'react';
import { Icon } from '@rbx/foundation-ui';

type RevShareMeIconProps = {
  ariaLabel: string;
};

/** `aria-label` for AT; native `title` for hover (avoids Tooltip aria-describedby doubling the name). */
export const RevShareMeIcon: FunctionComponent<RevShareMeIconProps> = ({ ariaLabel }) => (
  <Icon
    name='icon-regular-person'
    size='Small'
    className='content-muted'
    aria-label={ariaLabel}
    title={ariaLabel}
  />
);
