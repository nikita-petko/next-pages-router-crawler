import { useTranslation } from '@rbx/intl';
import { Alert, AlertTitle, Grid, Link, Typography } from '@rbx/ui';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';

const DOCUMENTATION_LINK = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/monetization/developer-products`;

function ExternalPurchaseTestModeAlert() {
  const { translate, translateHTML } = useTranslation();
  return (
    <Alert severity='warning' variant='outlined'>
      <Grid container direction='row' className='alert-container-grid'>
        <Grid container item direction='column' gap='8px'>
          <AlertTitle> {translate('Heading.ValidateInTestMode')}</AlertTitle>
          <Typography variant='body2'>
            {translateHTML(
              'Description.ValidateInTestModeAlertText',
              [
                {
                  opening: 'linkStart',
                  closing: 'linkEnd',
                  content: (chunks) => (
                    <Link
                      href={DOCUMENTATION_LINK}
                      className='link-no-bold'
                      underline='always'
                      target='_blank'>
                      {chunks}
                    </Link>
                  ),
                },
              ],
              { lineBreak: <br /> },
            )}
          </Typography>
        </Grid>
      </Grid>
    </Alert>
  );
}

export default ExternalPurchaseTestModeAlert;
