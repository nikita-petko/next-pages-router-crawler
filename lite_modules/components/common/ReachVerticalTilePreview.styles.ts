import { makeStyles } from '@rbx/ui';

const useReachVerticalTilePreviewStyles = makeStyles()(() => ({
  /** Square brand icon in the expanded player's attribution bar. */
  attributionCreative: {
    height: '100%',
    objectFit: 'cover' as const,
    width: '100%',
  },
  backgroundCreative: {
    height: '100%',
    objectFit: 'cover' as const,
    width: '100%',
  },
  logoCreative: {
    height: '100%',
    objectFit: 'contain' as const,
    width: '100%',
  },
  /** OneByTwoTile uses height-full; parent must define height or % height resolves to 0. */
  root: {
    height: '100%',
    width: '100%',
  },
}));

export default useReachVerticalTilePreviewStyles;
