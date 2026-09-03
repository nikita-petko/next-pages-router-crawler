import { makeStyles } from '@rbx/ui';

const useCopyToClipboardStyles = makeStyles()((theme) => ({
  apiKeySecretString: {
    [theme.breakpoints.down('Large')]: {
      overflowX: 'clip',
      textOverflow: 'ellipsis',
    },
    overflowWrap: 'break-word',
  },

  copyApiKeyBtnWrapper: {
    [theme.breakpoints.up('Medium')]: {
      float: 'right',
    },
    [theme.breakpoints.down('Large')]: {
      marginTop: 8,
    },
  },
}));

export default useCopyToClipboardStyles;
