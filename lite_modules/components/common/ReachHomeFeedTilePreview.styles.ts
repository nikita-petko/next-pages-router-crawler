import { makeStyles } from '@rbx/ui';

const useReachHomeFeedTilePreviewStyles = makeStyles()(() => ({
  backgroundCreative: {
    height: '100%',
    objectFit: 'cover' as const,
    width: '100%',
  },
  logoCreative: {
    height: '100%',
    objectFit: 'contain' as const,
  },
  /** TwoByOneTile uses height-full; parent must define height or % height resolves to 0. */
  root: {
    height: '100%',
    width: '100%',
  },
}));

export default useReachHomeFeedTilePreviewStyles;
