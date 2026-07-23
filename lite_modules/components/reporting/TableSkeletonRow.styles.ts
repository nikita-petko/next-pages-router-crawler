import { makeStyles } from '@rbx/ui';

const useTableSkeletonRowStyles = makeStyles()(() => {
  // Define the shared base style
  const flexBase = {
    display: 'flex',
  };

  return {
    center: {
      ...flexBase,
      justifyContent: 'center',
    },
    end: {
      ...flexBase,
      justifyContent: 'flex-end',
    },
    start: {
      ...flexBase,
      justifyContent: 'flex-start',
    },
  };
});

export default useTableSkeletonRowStyles;
