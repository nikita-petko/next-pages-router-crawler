import type { FunctionComponent } from 'react';
import { useMemo } from 'react';
import { HubMeta, SiteName, buildTitle } from '@rbx/creator-hub-history';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Typography, Link, makeStyles } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import ToolboxServiceApiProvider from '@modules/toolboxService/ToolboxServiceApiProvider';
import GridListViewToggle from '../components/GridListViewToggle';
import ListingsGrid from '../components/ListingsGrid';
import PublicLicensesTable from '../components/PublicLicensesTable';
import { useExploreLicensesBrowseView } from '../hooks/useExploreLicensesBrowseView';
import { Sorts, useListIPListings } from '../hooks/useListIPListings';
import { ROBLOX_EXPLORE_LICENSES_HREF } from '../urls';
import { EXPLORE_LICENSES_ACTION_GAP_PX } from '../utils/constants';

const BASE_URL = getProductionCreatorHubUrl(process.env.buildTarget);
const LICENSES_CANONICAL = `${BASE_URL}/explore/licenses`;

const useStyles = makeStyles()((theme) => ({
  root: {
    boxSizing: 'border-box',
    width: '100%',
  },
  content: {
    boxSizing: 'border-box',
    rowGap: EXPLORE_LICENSES_ACTION_GAP_PX,
    width: '100%',
    paddingLeft: 0,
    paddingRight: 0,
    [theme.breakpoints.down('Medium')]: {
      paddingLeft: theme.spacing(1),
      paddingRight: theme.spacing(1),
    },
  },
}));

const LicensesContainer: FunctionComponent = () => {
  const { translate, translateHTML } = useTranslation();
  const { classes } = useStyles();
  const { isFetched: isAuthenticationFetched } = useAuthentication();
  const { isFetched: isSettingsFetched } = useSettings();
  const { view, setView } = useExploreLicensesBrowseView();

  const {
    data: listingsProbeData,
    isPending: isListingsProbePending,
    isError: isListingsProbeError,
  } = useListIPListings({
    limit: 30,
    pageToken: '',
    filter: '',
    selectedSort: Sorts.MostRecentlyCreated,
  });

  const hasPublicListings =
    !isListingsProbePending &&
    !isListingsProbeError &&
    (listingsProbeData?.listings?.length ?? 0) > 0;

  const showBrowseViewToggle = hasPublicListings;
  const showListView = view === 'list' && hasPublicListings;

  const browseViewToolbarEndSlot = useMemo(
    () =>
      showBrowseViewToggle ? <GridListViewToggle value={view} onChange={setView} /> : undefined,
    [showBrowseViewToggle, view, setView],
  );

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
    <>
      <HubMeta
        title={translate('Heading.Licenses')}
        seoTitle={buildTitle(SiteName.CreatorHub, translate('Label.Licenses'))}
        description={translate('Description.BrowseListings')}
        canonical={LICENSES_CANONICAL}
        ogUrl={LICENSES_CANONICAL}
        ogType='website'
        type='licensing'
      />
      <Grid item className={classes.root}>
        <Grid container direction='column' className={classes.content}>
          <Grid item container direction='column'>
            <Grid item>
              <Typography
                variant='body1'
                color='primary'
                data-testid='explore-licenses-description'
                component='div'>
                {browseListingsDescription}
              </Typography>
            </Grid>
          </Grid>
          {showListView ? (
            <ToolboxServiceApiProvider>
              <PublicLicensesTable browseViewToolbarEndSlot={browseViewToolbarEndSlot} />
            </ToolboxServiceApiProvider>
          ) : (
            <ListingsGrid browseViewToolbarEndSlot={browseViewToolbarEndSlot} />
          )}
        </Grid>
      </Grid>
    </>
  );
};

export default withTranslation(LicensesContainer, [
  TranslationNamespace.Error,
  TranslationNamespace.Licenses,
]);
