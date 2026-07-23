import { makeStyles } from '@rbx/ui';

const useOverviewDescriptionStyles = makeStyles()((theme) => ({
  background: {
    padding: theme.spacing(1),
  },

  description: {
    marginTop: theme.spacing(0.5),
    whiteSpace: 'break-spaces',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
}));

export default useOverviewDescriptionStyles;
