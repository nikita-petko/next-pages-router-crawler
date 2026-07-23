import { makeStyles } from '@rbx/ui';

const ICON_SIZE = 28;

const useExperienceIconStyles = makeStyles()((theme) => ({
  container: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
    flexShrink: 0,
  },
  image: {
    display: 'block',
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
}));

export default useExperienceIconStyles;
