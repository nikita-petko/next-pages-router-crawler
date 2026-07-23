import type { FunctionComponent } from 'react';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { buildTitle, HubMeta } from '@rbx/creator-hub-history';
import { Button } from '@rbx/foundation-ui';
import { withTranslation, useTranslation } from '@rbx/intl';
import { Grid, Typography, useMediaQuery } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ChangelogTab from './ChangelogTab';
import { captureUpdatesPageEvent, EUpdatesPageSection } from './eventUtils';
import RoadmapTab from './RoadmapTab';
import useUpdatesPageStyles from './Updates.styles';

type TabType = 'changelog' | 'roadmap';

const UpdatesPage: FunctionComponent = () => {
  const { classes } = useUpdatesPageStyles();
  const router = useRouter();
  const { translate } = useTranslation();
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const routeTab: TabType = router.pathname.includes('/roadmap') ? 'roadmap' : 'changelog';
  const [activeTab, setActiveTab] = useState<TabType>(routeTab);

  useEffect(() => {
    if (router.isReady) {
      setActiveTab(routeTab);
    }
  }, [router.isReady, routeTab]);

  useEffect(() => {
    router.prefetch('/updates').catch(() => {});
    router.prefetch('/updates/roadmap').catch(() => {});
  }, [router]);

  const handleTabChange = (tab: TabType) => {
    if (tab === activeTab) {
      return;
    }
    captureUpdatesPageEvent(
      tab === 'roadmap' ? 'clickRoadmapTab' : 'clickChangelogTab',
      EUpdatesPageSection.TabNavigation,
      { tab },
    );
    setActiveTab(tab);

    // Use normal route transition so page-level wrappers/translations load correctly.
    const newPath = tab === 'roadmap' ? '/updates/roadmap' : '/updates';
    router.push(newPath, undefined, { scroll: false }).catch(() => {
      setActiveTab(routeTab);
    });
  };

  return (
    <Grid className={classes.pageRoot} container flexDirection='column' wrap='nowrap'>
      <div className={classes.container}>
        <div className={classes.tabHeaderStack}>
          {/* Tab Navigation */}
          <div className={classes.tabNavigation}>
            <div className={classes.tabButtons}>
              <button
                type='button'
                className={`${classes.tabButton} ${activeTab === 'changelog' ? classes.tabButtonActive : ''}`}
                onClick={() => handleTabChange('changelog')}>
                <Typography variant='smallLabel1'>{translate('Heading.Changelog')}</Typography>
              </button>
              <button
                type='button'
                className={`${classes.tabButton} ${activeTab === 'roadmap' ? classes.tabButtonActive : ''}`}
                onClick={() => handleTabChange('roadmap')}>
                <Typography variant='smallLabel1'>Roadmap</Typography>
              </button>
            </div>
            <div className={classes.tabActionsWrapper}>
              <div className={classes.tabActions}>
                {!isSmallScreen && (
                  <Button
                    className={classes.tabActionButton}
                    variant='Emphasis'
                    size='Small'
                    color='ActionEmphasis'
                    as='a'
                    href='https://devforum.roblox.com/c/feature-requests/170'
                    target='_blank'
                    rel='noopener noreferrer'
                    onClick={() =>
                      captureUpdatesPageEvent('clickRequestFeature', EUpdatesPageSection.TabActions)
                    }>
                    {translate('Action.RequestFeature')}
                  </Button>
                )}
                <Button
                  className={classes.tabActionButton}
                  variant='Standard'
                  size='Small'
                  as='a'
                  href='https://devforum.roblox.com/w/bug-report/steps/step_1'
                  target='_blank'
                  rel='noopener noreferrer'
                  onClick={() =>
                    captureUpdatesPageEvent('clickReportBug', EUpdatesPageSection.TabActions)
                  }>
                  {translate('Action.ReportBug')}
                </Button>
              </div>
            </div>
          </div>

          {/* Tab Content - only mount active tab so Roadmap does not load until user switches */}
          <div className={classes.tabContent}>
            {activeTab === 'changelog' && (
              <>
                <HubMeta
                  title={buildTitle(translate('Heading.Updates'), translate('Heading.Changelog'))}
                />
                <ChangelogTab />
              </>
            )}
            {activeTab === 'roadmap' && (
              <>
                <HubMeta
                  title={buildTitle(
                    translate('Heading.Updates'),
                    translate('Heading.CreatorRoadMap'),
                  )}
                />
                <RoadmapTab />
              </>
            )}
          </div>
        </div>
      </div>
    </Grid>
  );
};

export default withTranslation(UpdatesPage, [
  TranslationNamespace.Home,
  TranslationNamespace.RoadMap,
]);
