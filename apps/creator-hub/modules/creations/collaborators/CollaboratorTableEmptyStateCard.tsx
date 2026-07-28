import type { FC } from 'react';
import { Icon } from '@rbx/foundation-ui';

export const CollaboratorTableEmptyStateCard: FC<{
  heading: string;
  description: string;
}> = ({ heading, description }) => (
  <div className='padding-y-xlarge flex flex-col items-center gap-medium margin-top-small'>
    <div className='flex radius-circle bg-shift-200 padding-xxlarge size-2100 items-center justify-center'>
      <Icon name='icon-filled-person' className='!size-1100' />
    </div>
    <div className='flex flex-col items-center gap-small'>
      <h1 className='text-heading-medium margin-none'>{heading}</h1>
      <p className='text-body-medium margin-none content-muted'>{description}</p>
    </div>
  </div>
);
