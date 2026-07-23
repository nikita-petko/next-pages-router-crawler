import { makeStyles } from '@rbx/ui';

const useOperationMenuStyles = makeStyles<{ visible: boolean }>()((theme, { visible }) => ({
  operationIcon: {
    [theme.breakpoints.down('Medium')]: {
      visibility: 'visible',
    },
    visibility: visible ? 'visible' : 'hidden',
  },
}));

export default useOperationMenuStyles;
