/* istanbul ignore file */

import { makeStyles } from '@rbx/ui';

const useAvatarCreationTokenItemCardStyles = makeStyles()((theme) => ({
  thumbnailContainer: {
    height: 'auto',
    width: '100%',
    position: 'relative',
  },

  itemCardImg: {
    ...theme.border.radius.large,
    display: 'block',
  },

  img: {
    height: '100%',
    width: '100%',
  },

  imgWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.palette.states.focus,
    overflow: 'hidden',
    aspectRatio: '16 / 9',
    borderRadius: '12px',
  },

  privateEventContainer: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    zIndex: 10,
    backgroundColor: theme.palette.components.alert.noticeFill,
    borderRadius: 4,
  },
}));

export default useAvatarCreationTokenItemCardStyles;
