import type { FunctionComponent } from 'react';
import { useEffect, useCallback, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/router';
import { StatusCodes } from '@rbx/core';
import { buildTitle, HubMeta } from '@rbx/creator-hub-history';
import { OpenCloudError } from '@rbx/google-gax';
import { useLocalization, withTranslation, useTranslation, Locale } from '@rbx/intl';
import { CircularProgress, Typography, Grid, Tab, Divider } from '@rbx/ui';
import DataStoresPageContent from '@modules/cloud-services/insights/pages/DataStoresPageContent';
import { EmptyGrid } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import HorizontalTabs from '@modules/miscellaneous/components/HorizontalTabs';
import { ErrorPage } from '@modules/miscellaneous/error';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import useSettingsWhitelist from '@modules/miscellaneous/hooks/useSettingsWhitelist';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { FeatureFlagName } from '@modules/settings/SettingsProvider/featureFlags';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import {
  MAX_PAGE_SIZE,
  PERMISSION_DENIED_ERROR_CODE,
  doesUserHaveDeleteDataStoresPermission,
  doesUserHaveDeleteDataStoreEntryPermission,
} from '../common';
import ListDataStoresView from '../components/ListDataStoresView/ListDataStoresView';
import ListEntriesView from '../components/ListEntriesView/ListEntriesView';
import RtbfConfigsView from '../components/RtbfConfigsView/RtbfConfigsView';
import StorageSummary from '../components/StorageSummary/StorageSummary';
import { getUniverseStorage, getDataStoreStorage } from '../openCloudStandardDataStoresRequests';
import type { DataStore, UniverseStorage } from '../types';

enum DataStoresTabs {
  Manager = 'Manager',
  Dashboard = 'Dashboard',
  RtbfSetting = 'RtbfSetting',
}

const DATA_STORES_TAB_VALUES = new Set<string>(Object.values(DataStoresTabs));

const isDataStoresTab = (value: unknown): value is DataStoresTabs =>
  typeof value === 'string' && DATA_STORES_TAB_VALUES.has(value);

const DataStoresMainPageContainer: FunctionComponent = () => {
  const { locale } = useLocalization();
  const router = useRouter();
  const { translate } = useTranslation();
  const { isLoadingGame, gameDetails } = useCurrentGame();
  const { settings, isFetched: isSettingsFetched } = useSettings();
  const isInRtbfAllowlist = useSettingsWhitelist(FeatureFlagName.rtbfSettingAllowlist);
  const isRtbfEnabled = isSettingsFetched && (settings?.enableRtbfSetting || isInRtbfAllowlist);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pageInitFailed, setPageInitFailed] = useState<boolean>(false);
  const [userNotAuthorized, setUserNotAuthorized] = useState<boolean>(false);
  const [universeId, setUniverseId] = useState<number>(0);

  // Page states
  const [useDataStoreStorageEndpoint, setUseDataStoresStorageEndpoint] = useState<boolean>(true);
  const [query, setQueryParamValues] = useQueryParams(['activeTab', 'ds', 's', 'e', 'v']);

  // User Permissions
  const [userHasDeletePermission, setUserHasDeletePermission] = useState<boolean>(false);
  const [userHasEditPermission, setUserHasEditPermission] = useState<boolean>(false);

  // DataStore resource types
  const [listData, setListData] = useState<DataStore[]>([]);

  // Pagination states
  const [dataStoresCursor, setDataStoresCursor] = useState<string>();
  const [universeStorage, setUniverseStorage] = useState<UniverseStorage>({
    bytesTotalPermanent: '--',
    storageLimitBytes: '--',
    numDataStores: '--',
    numKeys: '--',
  });

  const activeDataStoresTab = isDataStoresTab(query.activeTab)
    ? query.activeTab
    : DataStoresTabs.Manager;
  const selectedDataStoreName = typeof query.ds === 'string' ? query.ds : undefined;

  // Set the activeTab query param if it's not present or invalid
  useEffect(() => {
    if (!isDataStoresTab(query.activeTab)) {
      setQueryParamValues({ activeTab: DataStoresTabs.Manager });
    }
  }, [query.activeTab, setQueryParamValues]);

  const handleTabChange = useCallback(
    (_event: ChangeEvent<object>, value: unknown) => {
      if (isDataStoresTab(value)) {
        setQueryParamValues({ activeTab: value });
      }
    },
    [setQueryParamValues],
  );

  const loadPageData = useCallback(async (uId: number) => {
    try {
      const storageResponse = await getUniverseStorage(uId);
      setUniverseStorage(storageResponse);
      const response = await getDataStoreStorage(
        uId,
        true,
        MAX_PAGE_SIZE,
        undefined,
        undefined,
        true,
      );
      setListData(response.dataStores);
      setDataStoresCursor(response.cursor ?? '');
      setUseDataStoresStorageEndpoint(response.storageTracking);

      // Check permissions
      const deletePermission = await doesUserHaveDeleteDataStoresPermission(uId);
      setUserHasDeletePermission(deletePermission);
      const deleteEntryPermission = await doesUserHaveDeleteDataStoreEntryPermission(uId);
      setUserHasEditPermission(deleteEntryPermission);
      setUniverseId(uId);
      setPageInitFailed(false);
    } catch (error) {
      if (
        !(error instanceof OpenCloudError) ||
        Number(error.code) !== PERMISSION_DENIED_ERROR_CODE
      ) {
        setUserNotAuthorized(true);
      }
      setPageInitFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (gameDetails?.id) {
      void loadPageData(gameDetails.id);
    }
  }, [gameDetails?.id, loadPageData]);

  // Handle page navigation
  const loadEntryList = useCallback(
    async (dataStoreName: string) => {
      setQueryParamValues({ ds: dataStoreName });
    },
    [setQueryParamValues],
  );

  if (pageInitFailed && !isLoading && !isLoadingGame && !userNotAuthorized) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={() => router.reload()}
      />
    );
  }

  if (gameDetails?.id != null && !isLoading && !isLoadingGame) {
    return (
      <Grid container XSmall={12} spacing={1}>
        <Grid container item XSmall={12} spacing={2}>
          <Grid item XSmall={12}>
            <Typography variant='body1' color='secondary'>
              {translate('Description.DataStoresManager')}
            </Typography>
          </Grid>
        </Grid>
        <Grid item XSmall={12} style={{ paddingBottom: 2 }}>
          <HorizontalTabs value={activeDataStoresTab} onChange={handleTabChange}>
            {Object.values(DataStoresTabs)
              .filter((type) => type !== DataStoresTabs.RtbfSetting || isRtbfEnabled)
              .map((type) => (
                <Tab
                  label={
                    type === DataStoresTabs.RtbfSetting
                      ? translate('Heading.RtbfDeletion')
                      : translate(`Label.${type}`)
                  }
                  value={type}
                  key={type}
                />
              ))}
          </HorizontalTabs>
          <Divider />
        </Grid>
        <HubMeta hubOnly title={buildTitle(translate(`Label.${activeDataStoresTab}`))} />
        {activeDataStoresTab === DataStoresTabs.Dashboard && (
          <Grid item XSmall={12}>
            <DataStoresPageContent />
          </Grid>
        )}
        {activeDataStoresTab === DataStoresTabs.Manager && (
          <Grid item XSmall={12}>
            {userNotAuthorized ? (
              <ErrorPage errorCode={StatusCodes.FORBIDDEN} />
            ) : (
              <>
                {selectedDataStoreName == null && (
                  <>
                    <Grid item XSmall={12}>
                      <StorageSummary
                        universeStorage={universeStorage}
                        displayDSStorage={useDataStoreStorageEndpoint}
                      />
                    </Grid>
                    <Grid item XSmall={12}>
                      <ListDataStoresView
                        universeId={universeId}
                        dataStores={listData}
                        useStorage={useDataStoreStorageEndpoint}
                        cursor={dataStoresCursor}
                        userHasDeletePermission={userHasDeletePermission}
                        locale={locale ?? Locale.English}
                        loadEntryList={loadEntryList}
                        resetView={() => {}}
                      />
                    </Grid>
                  </>
                )}
                <Grid item XSmall={12}>
                  {selectedDataStoreName != null && (
                    <ListEntriesView
                      universeId={universeId}
                      dataStoreName={selectedDataStoreName}
                      userHasEditPermission={userHasEditPermission}
                      locale={locale ?? Locale.English}
                      onBack={() => setQueryParamValues({ ds: undefined })}
                    />
                  )}
                </Grid>
              </>
            )}
          </Grid>
        )}
        {isRtbfEnabled && activeDataStoresTab === DataStoresTabs.RtbfSetting && gameDetails && (
          <Grid item XSmall={12}>
            <RtbfConfigsView universeId={gameDetails.id} />
          </Grid>
        )}
      </Grid>
    );
  }

  return (
    <EmptyGrid>
      <CircularProgress />
    </EmptyGrid>
  );
};

export default withTranslation(DataStoresMainPageContainer, [
  TranslationNamespace.Table,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.DataStoresManager,
  TranslationNamespace.Navigation,
]);
