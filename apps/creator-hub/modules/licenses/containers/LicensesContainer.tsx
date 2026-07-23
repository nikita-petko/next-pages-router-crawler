import { FunctionComponent } from 'react';
import { Grid, Typography, Link, makeStyles } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { HubMeta, SiteName, buildTitle } from '@rbx/creator-hub-history';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { PageLoading } from '@modules/miscellaneous/common';
import { useAuthentication } from '@modules/authentication/providers';
import { useSettings } from '@modules/settings';

import GridListViewToggle from '../components/GridListViewToggle';
import ListingsGrid from '../components/ListingsGrid';
import PublicLicensesTable from '../components/PublicLicensesTable';
import { useExploreLicensesBrowseView } from '../hooks/useExploreLicensesBrowseView';
import { ROBLOX_EXPLORE_LICENSES_HREF } from '../urls';

const BASE_URL = getProductionCreatorHubUrl(process.env.buildTarget);
const LICENSES_CANONICAL = `${BASE_URL}/explore/licenses`;

const useStyles = makeStyles()((theme) => ({
  root: {
    paddingLeft: 24,
    paddingRight: 24,
    [theme.breakpoints.down('Medium')]: {
      paddingLeft: 20,
      paddingRight: 20,
    },
  },
  descriptionRow: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  descriptionText: {
    flex: 1,
    minWidth: 0,
  },
  browseViewToggleWrap: {
    flexShrink: 0,
    marginLeft: theme.spacing(2),
  },
}));

const LicensesContainer: FunctionComponent = () => {
  const { translate, translateHTML } = useTranslation();
  const { classes } = useStyles();
  const { isFetched: isAuthenticationFetched } = useAuthentication();
  const { settings, isFetched: isSettingsFetched } = useSettings();
  const { enableIpPlatformTimeboundLicenses } = settings;
  const { view, setView } = useExploreLicensesBrowseView();

  if (!isAuthenticationFetched || !isSettingsFetched) {
    return <PageLoading />;
  }

  const browseListingsDescription = translateHTML('Description.BrowseListings', [
    {
      opening: 'linkStart',
      closing: 'linkEnd',
      content(chunks) {
        return (
          <Link href={ROBLOX_EXPLORE_LICENSES_HREF} target='_blank'>
            {chunks}
          </Link>
        );
      },
    },
  ]);

  return (
    <Grid item container direction='column' className={classes.root} spacing={1}>
      <HubMeta
        title={translate('Heading.Licenses')}
        seoTitle={buildTitle(SiteName.CreatorHub, translate('Label.Licenses'))}
        description={translate('Description.BrowseListings')}
        canonical={LICENSES_CANONICAL}
        ogUrl={LICENSES_CANONICAL}
        ogType='website'
        type='licensing'
      />
      <Grid item container direction='column'>
        <Grid item>
          <Typography variant='h1' data-testid='explore-licenses-heading'>
            {translate('Heading.Licenses')}
          </Typography>
        </Grid>
        <Grid item>
          {enableIpPlatformTimeboundLicenses ? (
            <div className={classes.descriptionRow}>
              <Typography
                variant='body1'
                color='primary'
                data-testid='explore-licenses-description'
                component='div'
                className={classes.descriptionText}>
                {browseListingsDescription}
              </Typography>
              <div className={classes.browseViewToggleWrap}>
                <GridListViewToggle value={view} onChange={setView} />
              </div>
            </div>
          ) : (
            <Typography
              variant='body1'
              color='primary'
              data-testid='explore-licenses-description'
              component='div'>
              {browseListingsDescription}
            </Typography>
          )}
        </Grid>
      </Grid>
      {enableIpPlatformTimeboundLicenses && view === 'list' ? (
        <PublicLicensesTable />
      ) : (
        <ListingsGrid />
      )}
    </Grid>
  );
};

export default withTranslation(LicensesContainer, [
  TranslationNamespace.Error,
  TranslationNamespace.Licenses,
]);
