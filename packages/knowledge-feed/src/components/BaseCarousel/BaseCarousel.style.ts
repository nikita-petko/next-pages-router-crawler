import { makeStyles } from '@rbx/ui';

const useBaseCarouselStyles = makeStyles<{ isStartOfCarousel: boolean }>()(
  (theme, { isStartOfCarousel }) => ({
    wrapper: {
      position: 'relative',
    },
    carousel: {
      overflowX: 'scroll',
      display: 'flex',
      flexDirection: 'row',
      gap: 16,

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
    bumper: {
      display: 'flex',
      alignItems: 'center',
      zIndex: theme.zIndex.speedDial,
      position: 'absolute',
      height: '100%',
    },
    leftBumper: {
      top: 0,
      left: 6,
      pointerEvents: isStartOfCarousel ? 'none' : 'auto',
    },
    rightBumper: {
      top: 0,
      right: 6,
      pointerEvents: 'none',
    },
    hidden: {
      opacity: 0,
      pointerEvents: 'none',
      cursor: 'default',
    },
    bumperWrapper: {
      display: 'flex',
      height: '50%',
      justifyContent: 'center',
      pointerEvents: 'auto',
    },
    hiddenBumper: {
      pointerEvents: 'none',
    },
    iconButton: {
      opacity: 1,
      alignSelf: 'center',
      backgroundColor: 'var(--color-surface-0)',
      backgroundImage: 'linear-gradient(var(--color-shift-200), var(--color-shift-200))',
    },
  }),
);

export default useBaseCarouselStyles;
