import type { FunctionComponent } from 'react';
import React from 'react';
import { Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { getStatusIndicatorClass } from '../utils/serverStatus';

export type ServerStatusIndicatorProps = {
  status: string;
  label: string;
  description: string;
};

const ServerStatusIndicator: FunctionComponent<ServerStatusIndicatorProps> = ({
  status,
  label,
  description,
}) => {
  return (
    <Tooltip
      title={label}
      description={description}
      position='right-start'
      contentClassName='text-wrap text-truncate-none no-clip text-align-x-left'>
      <TooltipTrigger asChild>
        <button
          type='button'
          className='inline-flex items-center gap-xsmall width-fit bg-none stroke-none padding-none padding-left-small padding-right-medium cursor-help'
          aria-label={label}
          onClick={(event) => event.stopPropagation()}>
          <span
            className={`size-200 radius-circle shrink-0 ${getStatusIndicatorClass(status)}`}
            aria-hidden
          />
          <span className='text-caption-medium content-emphasis'>{label}</span>
        </button>
      </TooltipTrigger>
    </Tooltip>
  );
};

export default ServerStatusIndicator;
