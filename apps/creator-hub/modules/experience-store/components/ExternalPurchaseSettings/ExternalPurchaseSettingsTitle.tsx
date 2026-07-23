import { useTranslation } from '@rbx/intl';
import { Grid, makeStyles, Typography } from '@rbx/ui';

const useStyles = makeStyles()((theme) => ({
  descriptionText: {
    marginTop: 16,
    overflow: 'auto',
    color: theme.palette.content.muted,
  },
}));

function ExternalPurchaseSettingsTitle() {
  const { classes } = useStyles();
  const { translate } = useTranslation();

  return (
    <Grid item XSmall={12} XLarge={8} classes={{ root: classes.descriptionText }}>
      <Typography variant='body1'>
        {translate('Description.ExternalPurchaseSettingsSubtitle')}
      </Typography>
    </Grid>
  );
}

export default ExternalPurchaseSettingsTitle;
