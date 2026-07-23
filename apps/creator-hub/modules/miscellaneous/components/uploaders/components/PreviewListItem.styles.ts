import { makeStyles } from '@rbx/ui';

const imageHeight = 48;
// The proportion of the image is expected
const WidthHeightProportion = 16 / 9;
const imageWidth = 48 * WidthHeightProportion;

const usePreviewListItemStyles = makeStyles()((themes) => ({
  imageStyle: {
    height: `${imageHeight}px`,
    width: `${imageWidth}px`,
    marginRight: `${themes.spacing(1)}`,
  },

  listItemStyle: {
    margin: themes.spacing(1, 0),
    borderRadius: `${themes.shape.borderRadius}px`,
    cursor: 'move',
  },
}));

export default usePreviewListItemStyles;
