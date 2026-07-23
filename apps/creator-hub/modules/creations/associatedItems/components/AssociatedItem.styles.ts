import { makeStyles } from '@rbx/ui';

const useAssociatedItemStyles = makeStyles()(() => ({
  itemImageStyles: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
}));

export default useAssociatedItemStyles;
