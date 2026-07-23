import React from 'react';
import { Button } from '@rbx/foundation-ui';

type ErrorStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div
      className={[
        'flex',
        'flex-col',
        'gap-small',
        'padding-medium',
        'small:padding-large',
        'text-align-x-center',
      ].join(' ')}
      data-testid='error-state'>
      <div className='text-title-small'>{title}</div>
      {description ? <div className='text-body-medium content-muted'>{description}</div> : null}
      {actionLabel && onAction ? (
        <div className='flex justify-center'>
          <Button variant='Standard' size='Small' onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default ErrorState;
