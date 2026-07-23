/* istanbul ignore file */

import { makeStyles } from '@rbx/ui';

const useAvatarCreationTokenStyles = makeStyles()((theme) => ({
  inputForm: {
    width: '100%',
    '& > *:not(:last-child)': {
      paddingBottom: 24,
    },
  },

  submitButton: {
    margin: '0 12px',
    [theme.breakpoints.down('Large')]: {
      margin: '12px 0',
    },
  },

  tooltip: {
    margin: '0 24px',
  },

  labelText: {
    color: theme.palette.content.muted,
  },
}));

export default useAvatarCreationTokenStyles;
