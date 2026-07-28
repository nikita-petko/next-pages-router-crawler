import { makeStyles } from '@rbx/ui';

const useIconItemStyles = makeStyles()(() => {
  const sharedIconStyles = {
    backgroundColor: '#2B2D33',
    height: 32,
    overflow: 'hidden',
    width: 32,
  };

  return {
    assetIcon: {
      ...sharedIconStyles,
      borderRadius: 8,
    },
    creatorIcon: {
      ...sharedIconStyles,
      borderRadius: 16,
    },
  };
});

export default useIconItemStyles;
