import { Fragment, useCallback, useState } from 'react';
import { Button, makeStyles, Tab, Tabs, Tooltip, Typography } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { PageLoading } from '@modules/miscellaneous/common';
import { useSettings } from '@modules/settings';

import Matches from './components/Matches';
import useManualMatchesQuery from './hooks/useManualMatchesQuery';
import ManualMatchesTable from './components/ManualMatchesTable';
import IphManualMatchRequestDialog from './components/IphManualMatchRequestDialog';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../utils/logger';

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
 * Tabbed view when enableIpPlatformManualMatchRequests is true
 * - My Matches
 * - My Requests
 */
const MatchesContainer = () => {
  const { classes } = useStyles();
  const { translate } = useTranslation();
  const { settings, isFetched: isSettingsFetched } = useSettings();
  const { logEvent } = useLicenseManagerLogger();
  const { enableIpPlatformManualMatchRequests } = settings;
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
    enableIpPlatformManualMatchRequests &&
    !manualScanCandidatesQuery.isPending &&
    numRequestsSubmittedToday >= maxDailyLimit;

  const defaultTab = MatchesTabs.MyMatches;
  const activeTab = MatchesTabs[queryParams.tab as keyof typeof MatchesTabs] || defaultTab;

  const handleOpenManualMatchRequestDialog = async () => {
    if (!enableIpPlatformManualMatchRequests) {
      return;
    }
    logEvent(LicenseManagerClickEvent.MatchesTableOpenManualScanRequestModalClickEvent);
    setIsManualMatchRequestDialogOpen(true);
  };

  const handleCloseManualMatchRequestDialog = async () => {
    if (!enableIpPlatformManualMatchRequests) {
      return;
    }
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

  if (manualScanCandidatesQuery.isPending || !isSettingsFetched) {
    return <PageLoading />;
  }

  return (
    <Fragment>
      <div className={classes.descriptionContainer}>
        <Typography variant='body1' component='div' color='secondary' gutterBottom>
          {translate('Description.MatchesLanding')}
        </Typography>
        {enableIpPlatformManualMatchRequests && (
          <div className={classes.button}>
            <Tooltip
              title={translate('Label.DailyLimitReached', {
                maxLimit: manualScanCandidatesQuery.maxDailyLimit!.toString(),
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
        )}
      </div>
      {enableIpPlatformManualMatchRequests && (
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          className={classes.tabsMargin}
          capitalize={false}>
          <Tab label={translate('Label.MyMatches')} value={MatchesTabs.MyMatches} />
          <Tab label={translate('Label.MyRequests')} value={MatchesTabs.MyRequests} />
        </Tabs>
      )}
      {enableIpPlatformManualMatchRequests ? content : <Matches />}
      {enableIpPlatformManualMatchRequests && (
        <IphManualMatchRequestDialog
          isOpen={isManualMatchRequestDialogOpen}
          onClose={handleCloseManualMatchRequestDialog}
          onConfirm={handleCloseManualMatchRequestDialog}
          numRequestsSubmittedToday={numRequestsSubmittedToday}
          maxDailyLimit={maxDailyLimit}
        />
      )}
    </Fragment>
  );
};

export default withTranslation(MatchesContainer, [
  TranslationNamespace.Navigation,
  TranslationNamespace.AgreementsManager,
]);
