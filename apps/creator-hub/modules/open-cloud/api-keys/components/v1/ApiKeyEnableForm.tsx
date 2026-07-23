import { Fragment } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, Switch, Typography, InputLabel } from '@rbx/ui';
import useApiEnableFormStyles from './ApiKeyEnableForm.styles';

interface ApiKeyStatusFormProps {
  className?: string;
  enabled?: boolean;
  onChecked?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ApiKeyStatusForm = ({ enabled, onChecked, className }: ApiKeyStatusFormProps) => {
  const { translate } = useTranslation();
  const {
    classes: { status, label },
  } = useApiEnableFormStyles();

  return (
    <>
      <InputLabel classes={{ root: label }} htmlFor='api-key-isEnabled'>
        <Typography color='primary' variant='h6'>
          {translate('Label.EnableKey')}
        </Typography>
      </InputLabel>
      <Grid item classes={{ root: className }} container alignItems='center'>
        <Switch
          id='api-key-isEnabled'
          aria-label={translate('Label.EnableKey')}
          checked={enabled}
          onChange={onChecked}
        />
        <Typography
          classes={{ root: status }}
          color={enabled ? 'primary' : 'secondary'}
          variant='body1'>
          {enabled ? translate('Label.YesEnable') : translate('Label.NoEnable')}
        </Typography>
      </Grid>
    </>
  );
};

export default ApiKeyStatusForm;
