import { useTranslation } from '@rbx/intl';
import { Button, Grid, Typography } from '@rbx/ui';
import useSnackbar from '../../../common/hooks/useSnackbar';
import useCopyToClipboardStyles from './CopySecretToClipboard.styles';

interface CopySecretToKeyboardProps {
  apiKeySecret: string; // the api key that will also be copied to clipboard
  copyButtonSize?: 'small'; // create has a bigger 'copy to clipboard' button than edit
  // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
  // responsible for triaging issue.
  breakMsgContent?: boolean; // create a break between the key preview and the warning (create has a line break, edit doesn't)
  showKeyLabel?: boolean; // only required when in edit mode
}

const CopySecretToKeyboard = ({
  apiKeySecret,
  copyButtonSize,
  showKeyLabel,
}: CopySecretToKeyboardProps) => {
  const {
    classes: { apiKeySecretString, copyApiKeyBtnWrapper },
  } = useCopyToClipboardStyles();
  const { translate, translateHTML } = useTranslation();
  const { showSnackbar } = useSnackbar();

  const copySecretToClipboard = () => {
    navigator.clipboard.writeText(apiKeySecret);
    showSnackbar('success', '', translate('Message.CopyKeyToClipboardSuccess'));
  };

  return (
    <Grid container justifyContent='space-between' spacing={2}>
      <Grid item XSmall={12} Medium={7}>
        {showKeyLabel && (
          <Typography variant='h6' component='h6'>
            {translate('Label.Key')}
          </Typography>
        )}
        <Typography className={apiKeySecretString} color='secondary'>
          {apiKeySecret}
        </Typography>

        <br />

        <Typography color='warning' variant='body1'>
          {
            /**
             * {boldStart} Note! {boldEnd} Copy the Api Key before closing the page and
             * save it to a secure place. The system will NOT store the key for security reasons.
             */
            translateHTML('Message.CopyKeyWarning', [
              {
                opening: 'boldStart',
                closing: 'boldEnd',
                // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
                // responsible for triaging issue.
                content(chunks) {
                  return <strong>{chunks}</strong>;
                },
              },
            ])
          }
        </Typography>
      </Grid>
      <Grid item XSmall={12} Medium={5}>
        <div className={copyApiKeyBtnWrapper}>
          <Button
            onClick={copySecretToClipboard}
            variant='contained'
            color='primary'
            size={copyButtonSize}>
            {translate('Button.CopyKeyToClipboard')}
          </Button>
        </div>
      </Grid>
    </Grid>
  );
};

export default CopySecretToKeyboard;
