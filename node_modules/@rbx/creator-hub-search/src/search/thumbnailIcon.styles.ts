import { makeStyles } from '@rbx/ui';

// Shared styles for result-row thumbnail icons (experience game icons, store
// asset thumbnails). They fill the 28×28 icon column defined by `iconContainer`
// in SearchListItem.styles.
const ICON_SIZE = 28;

const useThumbnailIconStyles = makeStyles()((theme) => ({
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

export default useThumbnailIconStyles;
