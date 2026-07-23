import { Chip, Divider } from '@rbx/foundation-ui';
import { Paper, Tab, Tabs } from '@rbx/ui';
import { useRouter } from 'next/router';
import { memo } from 'react';

import CustomCircularProgress from '@components/common/CustomCircularProgress';
import useAdManagerTabsStyles from '@components/navigation/ad_manager_tabs/AdManagerTabs.styles';
import { adManagerTabs } from '@constants/navigation';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';

interface AdsManagerTab {
  key: string;
  path: string;
  titleKey: string;
}

const AdManagerTabs = memo(() => {
  const router = useRouter();
  const {
    classes: { chipRoot, paperContainer, tab, tabLeftColumn, tabMainText, tabRow, tabs },
  } = useAdManagerTabsStyles();
  const {
    selectedAds,
    selectedAdSets,
    selectedAdSetsLoading,
    selectedAdsLoading,
    selectedCampaigns,
  } = useAppStore((state: AppStoreType) => state.appData);
  const { setSelectedAds, setSelectedAdSets, setSelectedCampaigns } = useAppStore(
    (state: AppStoreType) => state,
  );

  const selectedRoute = router.query.tableView;

  return (
    <Paper className={paperContainer} square>
      <div className={tabRow}>
        <Tabs className={tabs} value={selectedRoute}>
          {adManagerTabs.map((adManagerTab: AdsManagerTab) => {
            const { key, path, titleKey } = adManagerTab;
            let chip: React.ReactNode = null;
            let tabContents = null;

            if (key === 'ads') {
              if (selectedAds.length) {
                chip = (
                  <Chip
                    className={chipRoot}
                    color='secondary'
                    isChecked={false}
                    key='clearSelectedAds'
                    onCheckedChange={() => {
                      setSelectedAds([]);
                    }}
                    size='Small'
                    text={`${selectedAds.length} selected`}
                    trailing='icon-regular-x'
                    variant='Standard'
                  />
                );
              }

              if (selectedAdsLoading) {
                tabContents = <CustomCircularProgress />;
              }
            }

            if (key === 'adsets') {
              if (selectedAdSets.length) {
                chip = (
                  <Chip
                    className={chipRoot}
                    color='secondary'
                    isChecked={false}
                    key='clearSelectedAdSets'
                    onCheckedChange={() => {
                      setSelectedAdSets([]);
                      setSelectedAds([]);
                    }}
                    size='Small'
                    text={`${selectedAdSets.length} selected`}
                    trailing='icon-regular-x'
                    variant='Standard'
                  />
                );
              }

              if (selectedAdSetsLoading) {
                tabContents = <CustomCircularProgress />;
              }
            }

            if (key === 'campaigns' && selectedCampaigns.length) {
              chip = (
                <Chip
                  className={chipRoot}
                  color='secondary'
                  isChecked={false}
                  key='clearSelectedCampaigns'
                  onCheckedChange={() => {
                    setSelectedCampaigns([]);
                    setSelectedAdSets([]);
                    setSelectedAds([]);
                  }}
                  size='Small'
                  text={`${selectedCampaigns.length} selected`}
                  trailing='icon-regular-x'
                  variant='Standard'
                />
              );
            }

            if (tabContents === null) {
              tabContents = (
                <div className={tabLeftColumn}>
                  <div>
                    <div className={tabMainText}>{titleKey}</div>
                  </div>
                  <div>
                    {/* Clearing a selection via the chip must not bubble to the
                        Tab's onClick (which navigates). Foundation Chip's
                        onCheckedChange doesn't stop propagation the way the old
                        WebBlox Chip's onDelete did, and Chip omits onClick, so
                        guard bubbling on this wrapper. The wrapper is a passive
                        propagation guard, not an interactive control (the Chip
                        is), so the a11y interaction rule is disabled here. */}
                    {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                        }
                      }}>
                      {chip}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Tab
                className={tab}
                data-testid={`tab-${key}`}
                key={key}
                label={tabContents}
                onClick={() => {
                  if (key === 'adsets' && selectedAdSetsLoading) {
                    return;
                  }

                  if (key === 'ads' && selectedAdsLoading) {
                    return;
                  }

                  router.push(path, undefined, { shallow: true });
                }}
                value={key}
              />
            );
          })}
        </Tabs>
      </div>
      <Divider />
    </Paper>
  );
});

export default AdManagerTabs;
