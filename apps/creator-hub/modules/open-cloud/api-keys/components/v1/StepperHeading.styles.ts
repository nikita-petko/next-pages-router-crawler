import { makeStyles } from '@rbx/ui';

const useStepperHeadingStyles = makeStyles()((theme) => ({
  avatar: {
    backgroundColor: theme.palette.common.white,
    color: theme.palette.content.inverse,
    width: 30,
    height: 30,
    marginRight: 8,
  },
}));

export default useStepperHeadingStyles;
