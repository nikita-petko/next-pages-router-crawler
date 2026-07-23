import { useCallback, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, makeStyles, Tab, Tabs, Tooltip, Typography } from '@rbx/ui';
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
}

/**
 * Tabbed view
 * - My Matches
 * - My Requests
 */
const MatchesContainer = () => {
  const { classes } = useStyles();
  const { translate } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();
  const [isManualMatchRequestDialogOpen, setIsManualMatchRequestDialogOpen] = useState(false);

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
  const activeTab =
    tabParam === MatchesTabs.MyMatches || tabParam === MatchesTabs.MyRequests
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

  let content;
  if (activeTab === MatchesTabs.MyMatches) {
    content = (
      <Matches
        openDialog={shouldDisableManualScan ? undefined : handleOpenManualMatchRequestDialog}
        maxManualRequestsLimit={maxDailyLimit}
      />
    );
  } else {
    content = (
      <ManualMatchesTable
        openDialog={shouldDisableManualScan ? undefined : handleOpenManualMatchRequestDialog}
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
          {translate('Description.MatchesLanding')}
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
        <Tab label={translate('Label.MyMatches')} value={MatchesTabs.MyMatches} />
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
]);
