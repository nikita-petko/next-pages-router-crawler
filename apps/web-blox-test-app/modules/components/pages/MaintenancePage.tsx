import { Grid, Typography, UIThemeProvider } from '@rbx/ui';
import useMaintenancePageStyles from './MaintenancePage.styles';
import Link from '../Link'

const PageNotFound = () => {
  const {
    classes: { background, text },
  } = useMaintenancePageStyles();

  return (
    // Force dark theme.
    <UIThemeProvider theme='dark'> 
      <Grid container classes={{ root: background }} direction='column' alignItems='center'>
        <Grid classes={{ root: text }} container item direction='column' justifyContent='center'>
          <Typography variant='h6' align='center'>
            We’ll be back soon!
          </Typography>
          <Typography color='secondary' align='center'>
            Thanks for your patience. We're working to get back online as soon as possible. Please visit our <Link href={`https://status.${process.env.robloxSiteDomain}`}>status page</Link> for more information.
          </Typography>
        </Grid>
      </Grid>
    </UIThemeProvider>
  );
};

export default PageNotFound;
