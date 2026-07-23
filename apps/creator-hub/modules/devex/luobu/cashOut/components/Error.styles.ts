import { makeStyles } from '@rbx/ui';

const useErrorStyles = makeStyles()((theme) => ({
  errorStyle: {
    margin: theme.spacing(0.5, 0),
    height: '16px',
  },
}));

export default useErrorStyles;
