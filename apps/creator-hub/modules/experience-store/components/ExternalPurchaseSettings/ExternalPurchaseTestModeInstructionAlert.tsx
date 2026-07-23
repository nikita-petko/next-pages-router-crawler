import { useTranslation } from '@rbx/intl';
import { Alert, Grid, Typography } from '@rbx/ui';

function ExternalPurchaseTestModeInstructionAlert() {
  const { translate } = useTranslation();
  return (
    <Alert severity='warning' variant='outlined'>
      <Grid container direction='row' className='alert-container-grid'>
        <Grid container item direction='column'>
          <Typography variant='body2'>
            {translate('Description.TestModeInstructionWarning')}
          </Typography>
        </Grid>
      </Grid>
    </Alert>
  );
}

export default ExternalPurchaseTestModeInstructionAlert;
