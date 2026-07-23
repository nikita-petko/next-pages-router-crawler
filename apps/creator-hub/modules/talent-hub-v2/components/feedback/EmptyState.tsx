import React from 'react';

type EmptyStateProps = {
  title: string;
  description?: string;
};

const EmptyState: React.FC<EmptyStateProps> = ({ title, description }) => {
  return (
    <div
      className='flex flex-col gap-xsmall padding-medium small:padding-large text-align-x-center'
      data-testid='empty-state'>
      <div className='text-heading-small'>{title}</div>
      {description ? <div className='text-body-medium content-muted'>{description}</div> : null}
    </div>
  );
};

export default EmptyState;
