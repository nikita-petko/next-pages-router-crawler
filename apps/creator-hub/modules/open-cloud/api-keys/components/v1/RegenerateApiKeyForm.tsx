import { useTranslation } from '@rbx/intl';
import { Grid, Typography, Button } from '@rbx/ui';
import useRegenerateApiKeyFormStyles from './RegenerateApiKeyForm.styles';

interface RegenerateApiKeyFormProps {
  apiKeyPreview?: string; // the api key secret preview (i.e. cloud auth id turned into byte array and serialized in base 64 string)
  onRegenerate?: () => void;
  className?: string;
}

const RegenerateApiKeyForm = ({
  apiKeyPreview,
  onRegenerate,
  className,
}: RegenerateApiKeyFormProps) => {
  const { translate } = useTranslation();
  const {
    classes: { regenerateBtnWrapper },
  } = useRegenerateApiKeyFormStyles();

  return (
    <Grid className={className} container justifyContent='space-between' alignItems='center'>
      <Grid item Medium={6}>
        <Typography variant='h6' component='h6'>
          {translate('Label.Key')}
        </Typography>
        <Typography variant='body1' color='primary'>
          {apiKeyPreview ? `${apiKeyPreview}...` : translate('Label.APIKey')}
        </Typography>
      </Grid>
      <Grid>
        <div className={regenerateBtnWrapper}>
          <Button size='small' variant='contained' color='primary' onClick={onRegenerate}>
            {translate('Button.Regenerate')}
          </Button>
        </div>
      </Grid>
    </Grid>
  );
};

export default RegenerateApiKeyForm;
