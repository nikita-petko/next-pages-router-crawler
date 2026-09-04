import { makeStyles } from '@rbx/ui';

const thumbnailSize = 48;

const useImageEntryListStyles = makeStyles()((theme) => ({
  thumbnail: {
    width: thumbnailSize,
    height: thumbnailSize,
    objectFit: 'cover',
    borderRadius: theme.shape.borderRadius,
  },

  avatar: {
    marginRight: theme.spacing(2),
    minWidth: thumbnailSize,
  },
}));

export default useImageEntryListStyles;
