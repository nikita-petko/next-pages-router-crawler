import { makeStyles } from '@rbx/ui';

const useRegenerateApiKeyFormStyles = makeStyles()((theme) => ({
  secretKeyString: {
    overflowWrap: 'break-word',
  },

  regenerateBtnWrapper: {
    [theme.breakpoints.up('Medium')]: {
      float: 'right',
    },
    [theme.breakpoints.down('Large')]: {
      marginTop: 8,
    },
  },
}));

export default useRegenerateApiKeyFormStyles;
