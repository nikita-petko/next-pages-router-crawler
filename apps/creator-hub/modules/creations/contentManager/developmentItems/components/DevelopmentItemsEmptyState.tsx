import type { FunctionComponent, ReactNode } from 'react';
import { Button } from '@rbx/foundation-ui';
import type { EmptyStateIllustrationKey } from '@modules/miscellaneous/components/EmptyState/EmptyState';
import { EmptyStateIllustration } from '@modules/miscellaneous/components/EmptyState/EmptyState';

export type DevelopmentItemsEmptyStateProps = {
  actionLabel?: string;
  /** Rendered below the copy, for asset-type affordances such as the Open Studio fallback. */
  children?: ReactNode;
  description: ReactNode;
  illustration?: EmptyStateIllustrationKey;
  onAction?: () => void;
  title: string;
};

const DevelopmentItemsEmptyState: FunctionComponent<DevelopmentItemsEmptyStateProps> = ({
  actionLabel,
  children,
  description,
  illustration,
  onAction,
  title,
}) => (
  <div className='flex flex-col items-center text-align-x-center gap-small padding-y-xxlarge'>
    {illustration != null && <EmptyStateIllustration illustration={illustration} />}
    <h2 className='text-heading-medium content-emphasis margin-none'>{title}</h2>
    <p className='text-body-medium content-default margin-none'>{description}</p>
    {actionLabel != null && onAction != null && (
      <Button as='button' onClick={onAction} size='Medium' variant='Standard'>
        {actionLabel}
      </Button>
    )}
    {children}
  </div>
);

export default DevelopmentItemsEmptyState;
