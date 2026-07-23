import React, { FunctionComponent, useMemo } from 'react';
import { makeStyles } from '@rbx/ui';
import { device, Platform } from '@rbx/core';
import { alpha } from '../utils';

const { getCurrentPlatform } = device;
const useStyles = makeStyles()((theme) => ({
  wrapper: {
    position: 'relative',
  },
  carousel: {
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'row',
    gap: 10,

    '&::-webkit-scrollbar': {
      display: 'none',
    },
    msOverflowStyle: 'none',
    scrollbarWidth: 'none',

    '& > *': {
      flexShrink: 0,
      flexGrow: 0,
    },
  },
  rightBumper: {
    zIndex: theme.zIndex.speedDial,
    position: 'absolute',
    height: '100%',
    top: 0,
    right: -1,
    backgroundImage: `linear-gradient(to left, ${alpha(theme.palette.surface[0], 255)}, ${alpha(
      theme.palette.surface[0],
      0,
    )})`,
  },
  bumperWrapper: {
    display: 'flex',
    width: 100,
    height: '100%',
    justifyContent: 'center',
  },
}));

const LoadingCarousel: FunctionComponent<React.PropsWithChildren<unknown>> = ({ children }) => {
  const {
    classes: { wrapper, carousel, rightBumper, bumperWrapper },
  } = useStyles();
  const currentPlatform = getCurrentPlatform();
  const isMobile = useMemo(
    () => currentPlatform === Platform.iOS || currentPlatform === Platform.Android,
    [currentPlatform],
  );

  return (
    <div className={wrapper}>
      <div className={carousel}>{children}</div>
      {!isMobile && (
        <div className={rightBumper}>
          <div className={bumperWrapper} />
        </div>
      )}
    </div>
  );
};
export default LoadingCarousel;
