import React from 'react';

type LoadingStateProps = {
  itemCount?: number;
};

export const LoadingState: React.FC<LoadingStateProps> = ({ itemCount = 4 }) => {
  return (
    <div className='flex flex-col gap-small' data-testid='loading-state'>
      {Array.from({ length: itemCount }).map((_, index) => (
        <div
          // eslint-disable-next-line react/no-array-index-key -- loading skeletons do not require stable keys
          key={index}
          className={[
            'bg-shift-200',
            'radius-medium',
            'height-700',
            'width-full',
            'small:height-800',
          ].join(' ')}
        />
      ))}
    </div>
  );
};

export default LoadingState;
