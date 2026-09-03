import { useCallback, useState } from 'react';
import { AgreementCandidateType } from '@rbx/client-content-licensing-api/v1';
import { useFlag } from '@rbx/flags';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, makeStyles, Tab, Tabs, Tooltip, Typography } from '@rbx/ui';
import { isAvatarItemLicensingEnabled as isAvatarItemLicensingEnabledFlag } from '@generated/flags/contentLicensing';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { GridListView } from '@modules/licenses/components/GridListViewToggle';
import { PageLoading } from '@modules/miscellaneous/components';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../utils/logger';
import IphManualMatchRequestDialog from './components/IphManualMatchRequestDialog';
import ManualMatchesTable from './components/ManualMatchesTable';
import Matches from './components/Matches';
import { useManualMatchesQuery } from './hooks/useManualMatchesQuery';

const useStyles = makeStyles()((theme) => ({
  descriptionContainer: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  button: {
    marginLeft: theme.spacing(2),
  },
  requestMatchButton: {
    whiteSpace: 'nowrap',
  },
  tabsMargin: {
    marginBottom: theme.spacing(2),
  },
}));

enum MatchesTabs {
  MyMatches = 'MyMatches',
  MyRequests = 'MyRequests',
  AvatarItems = 'AvatarItems',
}

/**
 * Tabbed view
 * - Experiences (fka My Matches when avatar item licensing is disabled)
 * - Avatar items
 * - My Requests
 */
const MatchesContainer = () => {
  const { classes } = useStyles();
  const translation = useTranslation();
  const { translate } = translation;
  const { tPendingTranslation } = useTranslationWrapper(translation);
  const { logEvent } = useLicenseManagerLogger();
  const { ready: isAvatarItemLicensingFlagReady, value: isAvatarItemLicensingEnabled } = useFlag(
    isAvatarItemLicensingEnabledFlag,
  );
  const [isManualMatchRequestDialogOpen, setIsManualMatchRequestDialogOpen] = useState(false);
  const [collectibleMatchesView, setCollectibleMatchesView] = useState<GridListView>('grid');

  const [queryParams, setQueryParams] = useQueryParams(['tab']);
  const handleTabChange = useCallback(
    (event: unknown, newTabValue: string) => {
      logEvent(LicenseManagerClickEvent.MatchesTableSelectTabClickEvent, {
        selectedTab: newTabValue,
      });
      setQueryParams({ tab: newTabValue });
    },
    [logEvent, setQueryParams],
  );

  // Determine whether user has already hit manual scan daily limit on page-load
  const manualScanCandidatesQuery = useManualMatchesQuery({
    pageSize: 1,
  });
  const numRequestsSubmittedToday =
    manualScanCandidatesQuery.data?.pages?.[0]?.manualCandidatesSubmittedToday ?? 0;
  const maxDailyLimit = manualScanCandidatesQuery.data?.pages?.[0]?.maxDailyLimit ?? 0;

  const shouldDisableManualScan =
    !manualScanCandidatesQuery.isPending && numRequestsSubmittedToday >= maxDailyLimit;

  const defaultTab = MatchesTabs.MyMatches;
  const tabParam = queryParams.tab;
  const shouldShowAvatarItemsTab = isAvatarItemLicensingFlagReady && isAvatarItemLicensingEnabled;
  const activeTab =
    tabParam === MatchesTabs.MyMatches ||
    tabParam === MatchesTabs.MyRequests ||
    (shouldShowAvatarItemsTab && tabParam === MatchesTabs.AvatarItems)
      ? tabParam
      : defaultTab;

  const handleOpenManualMatchRequestDialog = async () => {
    logEvent(LicenseManagerClickEvent.MatchesTableOpenManualScanRequestModalClickEvent);
    setIsManualMatchRequestDialogOpen(true);
  };

  const handleCloseManualMatchRequestDialog = async () => {
    logEvent(LicenseManagerClickEvent.MatchesTableCloseManualScanRequestModalClickEvent);
    setIsManualMatchRequestDialogOpen(false);
  };

  let content = null;
  if (activeTab === MatchesTabs.MyMatches) {
    content = (
      <Matches
        key={AgreementCandidateType.Universe}
        openDialog={shouldDisableManualScan ? undefined : handleOpenManualMatchRequestDialog}
        maxManualRequestsLimit={maxDailyLimit}
        candidateType={AgreementCandidateType.Universe}
      />
    );
  } else if (activeTab === MatchesTabs.MyRequests) {
    content = (
      <ManualMatchesTable
        openDialog={shouldDisableManualScan ? undefined : handleOpenManualMatchRequestDialog}
      />
    );
  } else if (shouldShowAvatarItemsTab && activeTab === MatchesTabs.AvatarItems) {
    content = (
      <Matches
        key={AgreementCandidateType.Collectible}
        candidateType={AgreementCandidateType.Collectible}
        collectibleMatchesView={collectibleMatchesView}
        onCollectibleMatchesViewChange={setCollectibleMatchesView}
      />
    );
  }

  if (manualScanCandidatesQuery.isPending) {
    return <PageLoading />;
  }

  return (
    <>
      <div className={classes.descriptionContainer}>
        <Typography variant='body1' component='div' color='secondary' gutterBottom>
          {shouldShowAvatarItemsTab
            ? tPendingTranslation(
                'Matches are creations that Roblox systems have indicated make significant use of content similar to your IP Library. It is your responsibility to verify that matches are using your IP before sending out a license offer.',
                'Body text shown at the top of the page when the rights holder visits their licensing matches table.',
                translationKey(
                  'Description.MatchesLanding',
                  TranslationNamespace.AgreementsManager,
                ),
              )
            : translate('Description.MatchesLanding')}
        </Typography>
        <div className={classes.button}>
          <Tooltip
            title={translate('Label.DailyLimitReached', {
              maxLimit: String(maxDailyLimit),
            })}
            arrow
            placement='left'
            disableHoverListener={!shouldDisableManualScan}
            disableFocusListener={!shouldDisableManualScan}
            disableTouchListener={!shouldDisableManualScan}>
            <div>
              <Button
                size='medium'
                variant='contained'
                color='secondary'
                className={classes.requestMatchButton}
                onClick={handleOpenManualMatchRequestDialog}
                disabled={shouldDisableManualScan}>
                {translate('Action.RequestMatch')}
              </Button>
            </div>
          </Tooltip>
        </div>
      </div>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        className={classes.tabsMargin}
        capitalize={false}>
        <Tab
          label={translate(shouldShowAvatarItemsTab ? 'Label.Experiences' : 'Label.MyMatches')}
          value={MatchesTabs.MyMatches}
        />
        {shouldShowAvatarItemsTab && (
          <Tab label={translate('Label.AvatarItems')} value={MatchesTabs.AvatarItems} />
        )}
        <Tab label={translate('Label.MyRequests')} value={MatchesTabs.MyRequests} />
      </Tabs>
      {content}
      {isManualMatchRequestDialogOpen ? (
        <IphManualMatchRequestDialog
          isOpen
          onClose={handleCloseManualMatchRequestDialog}
          onConfirm={handleCloseManualMatchRequestDialog}
          numRequestsSubmittedToday={numRequestsSubmittedToday}
          maxDailyLimit={maxDailyLimit}
        />
      ) : null}
    </>
  );
};

export default withTranslation(MatchesContainer, [
  TranslationNamespace.Navigation,
  TranslationNamespace.AgreementsManager,
  TranslationNamespace.Creations,
  TranslationNamespace.Controls,
]);
