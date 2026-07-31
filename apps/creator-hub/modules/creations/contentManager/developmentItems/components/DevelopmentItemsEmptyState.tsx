import type { FunctionComponent } from 'react';
import { Button } from '@rbx/foundation-ui';

export type DevelopmentItemsEmptyStateProps = {
  actionLabel?: string;
  description: string;
  onAction?: () => void;
  title: string;
};

const DevelopmentItemsEmptyState: FunctionComponent<DevelopmentItemsEmptyStateProps> = ({
  actionLabel,
  description,
  onAction,
  title,
}) => (
  <div className='flex flex-col items-center text-align-x-center gap-small padding-y-xxlarge'>
    <h2 className='text-heading-medium content-emphasis margin-none'>{title}</h2>
    <p className='text-body-medium content-default margin-none'>{description}</p>
    {actionLabel != null && onAction != null && (
      <Button as='button' onClick={onAction} size='Medium' variant='Standard'>
        {actionLabel}
      </Button>
    )}
  </div>
);

export default DevelopmentItemsEmptyState;
