import {
  FunctionComponent,
  useEffect,
  useCallback,
  useState,
  useMemo,
  Fragment,
  type ChangeEvent,
} from 'react';
import { CircularProgress, Typography, Grid, Tab, Divider } from '@rbx/ui';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useLocalization, withTranslation, useTranslation, Locale } from '@rbx/intl';
import { EmptyGrid } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { OpenCloudError } from '@rbx/google-gax';
import { ErrorPage } from '@modules/miscellaneous/error';
import { StatusCodes } from '@rbx/core';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { useRouter } from 'next/router';
import { buildTitle, HubMeta } from '@rbx/creator-hub-history';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import HorizontalTabs from '@modules/miscellaneous/common/components/HorizontalTabs';
import DataStoresPageContent from '@modules/cloud-services/insights/pages/DataStoresPageContent';
import { getUniverseStorage, getDataStoreStorage } from '../openCloudStandardDataStoresRequests';
import { DataStore, UniverseStorage } from '../types';
import ListDataStoresView from '../components/ListDataStoresView/ListDataStoresView';
import {
  MAX_PAGE_SIZE,
  PERMISSION_DENIED_ERROR_CODE,
  doesUserHaveDeleteDataStoresPermission,
  doesUserHaveDeleteDataStoreEntryPermission,
} from '../common';
import StorageSummary from '../components/StorageSummary/StorageSummary';
import ListEntriesView from '../components/ListEntriesView/ListEntriesView';

enum DataStoresTabs {
  Manager = 'Manager',
  Dashboard = 'Dashboard',
}

const DataStoresMainPageContainer: FunctionComponent = () => {
  const { locale } = useLocalization();
  const router = useRouter();
  const { translate } = useTranslation();
  const { isLoadingGame, gameDetails } = useCurrentGame();
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

  const activeDataStoresTab = useMemo(() => {
    if (!Object.values(DataStoresTabs).includes(query.activeTab as DataStoresTabs)) {
      return DataStoresTabs.Manager;
    }
    return query.activeTab as DataStoresTabs;
  }, [query.activeTab]);

  // Set the activeTab query param if it's not present or invalid
  useEffect(() => {
    if (!Object.values(DataStoresTabs).includes(query.activeTab as DataStoresTabs)) {
      setQueryParamValues({ activeTab: DataStoresTabs.Manager });
    }
  }, [query.activeTab, setQueryParamValues]);

  const handleTabChange = useCallback(
    async (_event: ChangeEvent<unknown>, value: DataStoresTabs | string) => {
      setQueryParamValues({ activeTab: value.toString() });
    },
    [setQueryParamValues],
  );

  const loadPageData = useCallback(async (uId: number) => {
    try {
      const storageResponse = await getUniverseStorage(uId);
      setUniverseStorage(storageResponse);
      const response = await getDataStoreStorage(uId, true, MAX_PAGE_SIZE);
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
      if (!(error instanceof OpenCloudError) || error.code !== PERMISSION_DENIED_ERROR_CODE) {
        setUserNotAuthorized(true);
      }
      setPageInitFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (gameDetails?.id) {
      loadPageData(gameDetails.id);
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
          <HorizontalTabs
            value={activeDataStoresTab}
            onChange={(_event, value) => handleTabChange(_event, value as string)}>
            {Object.values(DataStoresTabs).map((type) => (
              <Tab label={translate(`Label.${type}`)} value={type} key={type} />
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
        {activeDataStoresTab !== DataStoresTabs.Dashboard && (
          <Grid item XSmall={12}>
            {userNotAuthorized ? (
              <ErrorPage errorCode={StatusCodes.FORBIDDEN} />
            ) : (
              <Fragment>
                {!query.ds && (
                  <Fragment>
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
                  </Fragment>
                )}
                <Grid item XSmall={12}>
                  {query.ds && (
                    <ListEntriesView
                      universeId={universeId}
                      dataStoreName={query.ds as string}
                      userHasEditPermission={userHasEditPermission}
                      locale={locale ?? Locale.English}
                      onBack={() => setQueryParamValues({ ds: undefined })}
                    />
                  )}
                </Grid>
              </Fragment>
            )}
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
