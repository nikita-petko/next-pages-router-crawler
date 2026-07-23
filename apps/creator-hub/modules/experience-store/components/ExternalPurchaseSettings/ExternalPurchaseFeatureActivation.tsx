import { useTranslation } from '@rbx/intl';
import { FormControlLabel, Grid, Switch, Tooltip, Typography, useMediaQuery } from '@rbx/ui';
import useExternalPurchaseSettingsStyles from './ExternalPurchaseSettings.styles';

type Props = {
  featureSwitchState: boolean;
  disabled: boolean;
  submitting: boolean;
  onClickFeatureSwitch: (event: React.ChangeEvent, checked: boolean) => void;
};

function ExternalPurchaseFeatureActivation({
  featureSwitchState,
  disabled,
  submitting,
  onClickFeatureSwitch,
}: Props) {
  const { classes } = useExternalPurchaseSettingsStyles();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Large'));
  const { translate } = useTranslation();

  return (
    <Grid container item classes={{ root: classes.pageSectionContainer }}>
      <Typography variant={isCompactView ? 'h3' : 'h2'}>
        {translate('Heading.FeatureActivation')}
      </Typography>
      <Tooltip
        title={disabled ? translate('Label.ExternalPurchasesInvalidTooltip') : null}
        placement='right'
        arrow>
        <Grid width='fit-content'>
          <FormControlLabel
            control={
              <Switch
                checked={featureSwitchState}
                onChange={onClickFeatureSwitch}
                disabled={submitting || disabled}
                aria-label={translate('Label.ExternalPurchases')}
              />
            }
            label={translate('Label.ExternalPurchases')}
          />
        </Grid>
      </Tooltip>
      <Typography variant='body2' className='description'>
        {translate('Description.ExternalPurchasesSwitchExplanation')}
      </Typography>
    </Grid>
  );
}

export default ExternalPurchaseFeatureActivation;
