import type { FunctionComponent } from 'react';
import React from 'react';
import { Icon, Link } from '@rbx/foundation-ui';

interface ContextBannerProps {
  description: string;
  linkLabel?: string;
  linkHref?: string;
}

const ContextBanner: FunctionComponent<ContextBannerProps> = ({
  description,
  linkLabel,
  linkHref,
}) => {
  return (
    <div className='flex items-center gap-small padding-medium radius-medium bg-surface-200'>
      <Icon name='icon-regular-circle-i' size='Medium' className='shrink-0' />
      <span className='text-body-medium content-default grow-1'>{description}</span>
      {linkLabel && linkHref && (
        <Link
          href={linkHref}
          target='_blank'
          color='Standard'
          isExternal={false}
          className='shrink-0'>
          {linkLabel}
        </Link>
      )}
    </div>
  );
};

export default ContextBanner;
