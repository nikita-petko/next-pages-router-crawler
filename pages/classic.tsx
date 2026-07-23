import { Button } from '@rbx/foundation-ui';
import { FormControl, FormHelperText, Grid, makeStyles, MenuItem, Select } from '@rbx/ui';
import { useRouter } from 'next/router';
import { ReactNode, useCallback, useEffect, useState } from 'react';

import { EventName, unifiedLogger } from '@clients/unifiedLogger';
import UnifiedPaymentStatusToast from '@components/billing/UnifiedPaymentStatusToast';
import AdsManagerPageBaseLayout from '@components/common/AdsManagerDefaultLayout';
import CenteredCircularProgress from '@components/common/CenteredCircularProgress';
import { getCreatorHubPageLayout } from '@components/common/CreatorHubPageLayout';
import DateFilteringNoDataPage from '@components/common/DateFilteringNoDataPage';
import DisplayNameWarningToast from '@components/common/DisplayNameWarningToast';
import GenericSnackBar from '@components/common/GenericSnackBar';
import NoDataPage from '@components/common/NoDataPage';
import AdManagerTabs from '@components/navigation/ad_manager_tabs/AdManagerTabs';
import TransitionBanner from '@components/onboarding/TransitionBanner';
import { openReportDownloadDialog } from '@components/reporting/dialogs/ReportDownloadDialog';
import { CardVerificationResultEnum } from '@constants/billing';
import {
  AdDisplayStatusType,
  AdSetDisplayStatusType,
  CampaignDisplayStatusType,
} from '@constants/campaignStatus';
import DateFilteringTimePeriod from '@constants/dateFilteringTimePeriod';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { EmptyDataPage } from '@modules/app/utility-pages/emptyDataPage';
import {
  getAds,
  getAdSets,
  getAdSetsSummary,
  getAdSetStatus,
  getAdsSummary,
  getAdStatus,
  getCampaignsSummary,
  getCampaignStatus,
  getCampaignsV2,
  getDateFilteredAds,
  getDateFilteredAdSets,
  getDateFilteredAdSetsSummary,
  getDateFilteredAdsSummary,
  getDateFilteredCampaignsSummary,
  getDateFilteredCampaignsV2,
  listAdFormats,
  ListAdFormatsResponseType,
} from '@modules/clients/ads/adsClient';
import { OrganizationType, ServerAdFormatType } from '@modules/clients/ads/adsClientTypes';
import {
  getGameThumbnailsByUniverseIds,
  getImageThumbnails,
} from '@modules/clients/thumbnails/thumbnailsClient';
import CreateButton from '@modules/creation/components/createButton';
import { FilterButtonAndPills } from '@modules/filtering/FilterButtonAndPills';
import { FilterRefresh } from '@modules/filtering/utils/filterEnums';
import { AdSetsManagementTable } from '@modules/management/components/adSetsManagementTable';
import { AdsManagementTable } from '@modules/management/components/adsManagementTable';
import { CampaignManagementTable } from '@modules/management/components/campaignManagementTable';
import { getThumbnailsClientBatchSize } from '@modules/miscellaneous/utils/envBasedUtilities';
import { useAdCreativeAssetStore } from '@modules/stores/adCreativeStoreProvider';
import {
  DisplayStatusesStoreType,
  useDisplayStatusesStore,
} from '@modules/stores/displayStatusStoreProvider';
import useFilteringStore from '@modules/stores/filteringStoreProvider';
import { useLimitInfoStore } from '@modules/stores/limitInfoStoreProvider';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { useHomePageErrorStore, useHomePageRateLimitStore } from '@stores/errorStoreProvider';
import {
  GetAdSetStatusResponseType,
  GetAdStatusResponseType,
  GetCampaignStatusResponseType,
} from '@type/campaign';
import { PaymentProfileType } from '@type/payment';
import { ConvertDateFilteringEnumToString } from '@utils/enumToString';
import { CaptureException } from '@utils/error';

const getHomePageLayout = (page: ReactNode) => {
  return getCreatorHubPageLayout(page, {
    headerKey: 'Label.ManageAdsClassic',
    headerNamespace: TranslationNamespace.Navigation,
  });
};

export const LARGEST_FAST_PAGE_SIZE = 100;

export const HOME_PAGE_TABLE_VIEWS = {
  ads: 'ads',
  adSets: 'adsets',
  campaigns: 'campaigns',
};

const Home = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Report);
  const {
    classes: { pageContainer },
  } = makeStyles()(() => ({
    pageContainer: {
      height: '100%',
      position: 'relative',
    },
  }))();

  const {
    classes: { dateQuickPickContainer, headerRowContainerStyle, utilityButtonsContainerStyle },
  } = makeStyles()((theme) => ({
    dateQuickPickContainer: {
      width: 190,
    },

    headerRowContainerStyle: {
      alignItems: 'flex-start',
      alignSelf: 'stretch',
      display: 'flex',
      justifyContent: 'space-between',
      width: '100%',
    },

    utilityButtonsContainerStyle: {
      padding: theme.spacing?.(1, 0),
      textAlign: 'right',
    },
  }))();

  const router = useRouter();
  const [pageFetchingEssentialData, setPageFetchingEssentialData] = useState(true);
  const { isFromSuccessfulEmailVerification = false, tableView } = router.query;
  let NON_REACT_CLOSURE_STORE_has_date_picker_loading_error = false;

  const {
    accountHasValidName,
    adAccountId,
    adAccountInfo,
    adCreditActivated,
    adFormats = [],
    ads = [],
    adSets = [],
    adSetsSummaryInfo,
    adsSummaryInfo,
    campaigns = [],
    campaignsSummaryInfo,
    organizationInfo,
    paymentProfiles,
    showDelete = false,
  } = useAppStore((state: AppStoreType) => state.appData);

  const setAccountHasValidName = useAppStore((state: AppStoreType) => state.setAccountHasValidName);
  const isClassicFlowEnabled = useAppStore(
    (state: AppStoreType) => state.appMetadataState?.data?.isClassicFlowEnabled,
  );

  const {
    setAdFormats,
    setAds,
    setAdSets,
    setAdSetsSummaryInfo,
    setAdsSummaryInfo,
    setCampaigns,
    setCampaignsSummaryInfo,
    setSelectedAds,
    setSelectedAdSets,
    setSelectedCampaigns,
  } = useAppStore((state: AppStoreType) => state);

  const replaceBackendCampaignStatuses = useDisplayStatusesStore(
    (state: DisplayStatusesStoreType) => state.replaceCampaignStatuses,
  );
  const replaceBackendAdSetStatuses = useDisplayStatusesStore(
    (state: DisplayStatusesStoreType) => state.replaceAdSetStatuses,
  );
  const replaceBackendAdStatuses = useDisplayStatusesStore(
    (state: DisplayStatusesStoreType) => state.replaceAdStatuses,
  );
  const resetStatuses = useDisplayStatusesStore(
    (state: DisplayStatusesStoreType) => state.resetStatuses,
  );
  const replaceNumCampaigns = useLimitInfoStore((state: any) => state.replaceNumCampaigns);
  const replaceCampaignIdToNumChildren = useLimitInfoStore(
    (state: any) => state.replaceCampaignIdToNumChildren,
  );
  const replaceAdSetIdToNumChildren = useLimitInfoStore(
    (state: any) => state.replaceAdSetIdToNumChildren,
  );
  const resetLimitInfo = useLimitInfoStore((state: any) => state.resetLimitInfo);

  const [currentView, setCurrentView] = useState<string>(HOME_PAGE_TABLE_VIEWS.campaigns);
  const [campaignsLoading, setCampaignsLoading] = useState<boolean>(true);
  const [campaignsLoadingError, setCampaignsLoadingError] = useState<boolean>(false);
  const [adSetsLoading, setAdSetsLoading] = useState<boolean>(true);
  const [adSetsLoadingError, setAdSetsLoadingError] = useState<boolean>(false);
  const [adsLoading, setAdsLoading] = useState<boolean>(true);
  const [adsLoadingError, setAdsLoadingError] = useState<boolean>(false);
  const [adFormatsLoading, setAdFormatsLoading] = useState<boolean>(true);
  const [loadingPaymentProfile, setLoadingPaymentProfile] = useState(true);
  const [loadingPaymentStatus, setLoadingPaymentStatus] = useState(true);
  const [hasFailedPayment, setHasFailedPayment] = useState(false);
  const [paymentProfile, setPaymentProfile] = useState(null as PaymentProfileType | null);
  const [hasUnverifiedCard, setHasUnverifiedCard] = useState(false);
  const [showEditSuccessful, setShowEditSuccessful] = useState(false);
  const [showCancelSuccessful, setShowCancelSuccessful] = useState(false);
  const [showCancelFailure, setShowCancelFailure] = useState(false);
  const [campaignsNextCursor, setCampaignsNextCursor] = useState<string>('');
  const [adSetsNextCursor, setAdSetsNextCursor] = useState<string>('');
  const [adsNextCursor, setAdsNextCursor] = useState<string>('');
  const [selectedDateRange, setSelectedDateRange] = useState<number>(
    DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_UNSPECIFIED,
  );
  const [dateFilteringLoading, setDateFilteringLoading] = useState<boolean>(false);

  const dateFilteringLoadingError = useHomePageErrorStore(
    (state: any) => state.dateFilteringLoadingError,
  );
  const setDateFilteringLoadingError = useHomePageErrorStore(
    (state: any) => state.setDateFilteringLoadingError,
  );

  const dateFilteringRateLimitExceeded = useHomePageRateLimitStore(
    (state: any) => state.dateFilteringRateLimitExceeded,
  );
  const setDateFilteringRateLimitExceeded = useHomePageRateLimitStore(
    (state: any) => state.setDateFilteringRateLimitExceeded,
  );
  const assetIdToUrlMap = useAdCreativeAssetStore((state: any) => state.assetIdToUrl);
  const updateAssetIdToUrlMap = useAdCreativeAssetStore((state: any) => state.updateAssetIdToUrl);
  const getAdAccountStatus = useAppStore((state: AppStoreType) => state.getAdAccountStatus);

  const [assetMapLoading, setAssetMapLoading] = useState<boolean>(true);

  const [filterLoading, setFilterLoading] = useState<boolean>(false);
  const [filteredCampaignIds, setFilteredCampaignIds] = useState<Set<string>>();
  const [filteredAdSetIds, setFilteredAdSetIds] = useState<Set<string>>();
  const [filteredAdIds, setFilteredAdIds] = useState<Set<string>>();
  const setRefreshFilter = useFilteringStore((state: any) => state.setRefreshFilter);
  const getPaymentProfiles = useAppStore((state: AppStoreType) => state.getPaymentProfiles);

  let showFailedCardAuthBanner = false;
  let showUnknownErrorBanner = false;
  let showSomethingWentWrongBanner = false;
  if (router.query.state === CardVerificationResultEnum.CARD_AUTHENTICATION_FAILED) {
    showFailedCardAuthBanner = true;
  } else if (router.query.state === CardVerificationResultEnum.UNKNOWN_STRIPE_ERROR) {
    showUnknownErrorBanner = true;
  } else if (router.query.state === CardVerificationResultEnum.SOMETHING_WENT_WRONG) {
    showSomethingWentWrongBanner = true;
  }

  const resolvePaymentStatus = useCallback(async (triggerBanner: boolean) => {
    try {
      const { hasFailedPayment: failedPayment } = await getAdAccountStatus();
      if (triggerBanner) {
        setHasFailedPayment(failedPayment);
      }
      setLoadingPaymentStatus(false);
      return failedPayment;
    } catch (error) {
      CaptureException(error as Error);
      return false;
    }
  }, []);

  const resolvePaymentProfile = useCallback(async (triggerBanner: boolean) => {
    try {
      const listPaymentProfilesResponse = await getPaymentProfiles(true);
      if (!listPaymentProfilesResponse || listPaymentProfilesResponse.data.length === 0) {
        setLoadingPaymentProfile(false);
        return false;
      }

      const profile = listPaymentProfilesResponse.data[0];
      setPaymentProfile(profile);
      if (triggerBanner) {
        setHasUnverifiedCard(!profile.is_verified);
      }
      setLoadingPaymentProfile(false);
      return !profile.is_verified;
    } catch (error) {
      CaptureException(error as Error);
      return false;
    }
  }, []);

  const loadMoreCampaigns = async (currentItems: any[], pageSize?: number, cursor?: string) => {
    const listCampaignResult = (await getCampaignsV2(pageSize, cursor)) || {};
    setCampaignsNextCursor(listCampaignResult.next_cursor);
    const newItems = listCampaignResult.campaigns || [];
    return {
      items: [...currentItems, ...newItems],
      length: newItems.length,
      next_cursor: listCampaignResult.next_cursor,
    };
  };

  const loadMoreAdSets = async (currentItems: any[], pageSize?: number, cursor?: string) => {
    const listAdSetResult = (await getAdSets(pageSize, cursor)) || {};
    setAdSetsNextCursor(listAdSetResult.next_cursor);
    const newItems = listAdSetResult.ad_sets || [];
    return {
      items: [...currentItems, ...newItems],
      length: newItems.length,
      next_cursor: listAdSetResult.next_cursor,
    };
  };

  const loadMoreAds = async (currentItems: any[], pageSize?: number, cursor?: string) => {
    const listAdsResult = (await getAds(pageSize, cursor)) || {};
    setAdsNextCursor(listAdsResult.next_cursor);
    const newItems = listAdsResult.ads || [];
    return {
      items: [...currentItems, ...newItems],
      length: newItems.length,
      next_cursor: listAdsResult.next_cursor,
    };
  };

  const fetchCampaignsCurrentUserHasAccessTo = useCallback(async () => {
    const fetchedCampaigns = await getCampaignsV2();
    setCampaigns(fetchedCampaigns.campaigns || []);
    setCampaignsNextCursor(fetchedCampaigns.next_cursor);

    let nextSerialCursor = fetchedCampaigns.next_cursor;
    let items = fetchedCampaigns.campaigns || [];

    /* eslint-disable no-await-in-loop */
    while (nextSerialCursor) {
      const loadMoreCampaignsResult = await loadMoreCampaigns(
        items,
        LARGEST_FAST_PAGE_SIZE,
        nextSerialCursor,
      );
      items = loadMoreCampaignsResult.items;
      nextSerialCursor = loadMoreCampaignsResult.next_cursor;

      if (!nextSerialCursor) {
        break;
      }
    }
    setCampaigns(items);
    /* eslint-enable no-await-in-loop */

    const campaignsSummary = await getCampaignsSummary();
    setCampaignsSummaryInfo(campaignsSummary);
    setCampaignsLoadingError(false);
  }, []);

  const fetchAdSetsCurrentUserHasAccessTo = useCallback(async () => {
    const adSetsResponse = await getAdSets();
    setAdSets(adSetsResponse.ad_sets || []);
    setAdSetsNextCursor(adSetsResponse.next_cursor);

    let nextSerialCursor = adSetsResponse.next_cursor;
    let items = adSetsResponse.ad_sets || [];

    /* eslint-disable no-await-in-loop */
    while (nextSerialCursor) {
      const loadMoreAdSetsResult = await loadMoreAdSets(
        items,
        LARGEST_FAST_PAGE_SIZE,
        nextSerialCursor,
      );
      items = loadMoreAdSetsResult.items;
      nextSerialCursor = loadMoreAdSetsResult.next_cursor;

      if (!nextSerialCursor) {
        break;
      }
    }
    /* eslint-enable no-await-in-loop */
    setAdSets(items);

    const adSetsSummary = await getAdSetsSummary();
    setAdSetsSummaryInfo(adSetsSummary);
    setAdSetsLoadingError(false);
  }, []);

  const fetchAdsCurrentUserHasAccessTo = useCallback(async () => {
    const adsResponse = await getAds();
    setAds(adsResponse.ads || []);
    setAdsNextCursor(adsResponse.next_cursor);

    let nextSerialCursor = adsResponse.next_cursor;
    let items = adsResponse.ads || [];

    /* eslint-disable no-await-in-loop */
    while (nextSerialCursor) {
      const loadMoreAdsResult = await loadMoreAds(items, LARGEST_FAST_PAGE_SIZE, nextSerialCursor);
      items = loadMoreAdsResult.items;
      nextSerialCursor = loadMoreAdsResult.next_cursor;

      if (!nextSerialCursor) {
        break;
      }
    }
    /* eslint-enable no-await-in-loop */
    setAds(items);

    const adsSummary = await getAdsSummary();
    setAdsSummaryInfo(adsSummary);
    setAdsLoadingError(false);
  }, []);

  const fetchAdFormatsCurrentUserUses = useCallback(async () => {
    const adFormatsResponse: ListAdFormatsResponseType = await listAdFormats();
    setAdFormats(adFormatsResponse.formats_to_display || []);
  }, []);

  const loadDateFilteredCampaigns = async (
    requestTimestamp: string,
    timePeriod: DateFilteringTimePeriod,
    onErrorCallback?: any,
  ) => {
    const fetchedCampaigns = await getDateFilteredCampaignsV2(
      requestTimestamp,
      timePeriod,
      undefined,
      undefined,
      onErrorCallback,
    );

    let nextSerialCursor = fetchedCampaigns.next_cursor;
    let allCampaigns = fetchedCampaigns.campaigns;

    /* eslint-disable no-await-in-loop */
    while (nextSerialCursor) {
      const nextFetchedCampaigns = await getDateFilteredCampaignsV2(
        requestTimestamp,
        timePeriod,
        LARGEST_FAST_PAGE_SIZE,
        nextSerialCursor,
        onErrorCallback,
      );
      nextSerialCursor = nextFetchedCampaigns.next_cursor;
      allCampaigns = allCampaigns.concat(nextFetchedCampaigns.campaigns);

      if (!nextSerialCursor) {
        break;
      }
    }
    return allCampaigns;
  };

  const loadDateFilteredAdSets = async (
    campaignIds: string[],
    requestTimestamp: string,
    timePeriod: DateFilteringTimePeriod,
    onErrorCallback?: any,
  ) => {
    const listDateFilteredAdSetsRequest = {
      campaign_ids: campaignIds,
    };
    const fetchedAdSets = await getDateFilteredAdSets(
      listDateFilteredAdSetsRequest,
      requestTimestamp,
      timePeriod,
      undefined,
      undefined,
      onErrorCallback,
    );

    let nextSerialCursor = fetchedAdSets.next_cursor;
    let allAdSets = fetchedAdSets.ad_sets;

    /* eslint-disable no-await-in-loop */
    while (nextSerialCursor) {
      const nextFetchedAdSets = await getDateFilteredAdSets(
        listDateFilteredAdSetsRequest,
        requestTimestamp,
        timePeriod,
        LARGEST_FAST_PAGE_SIZE,
        nextSerialCursor,
        onErrorCallback,
      );
      nextSerialCursor = nextFetchedAdSets.next_cursor;
      allAdSets = allAdSets.concat(nextFetchedAdSets.ad_sets);

      if (!nextSerialCursor) {
        break;
      }
    }
    return allAdSets;
  };

  const loadDateFilteredAds = async (
    campaignIds: string[],
    requestTimestamp: string,
    timePeriod: DateFilteringTimePeriod,
    onErrorCallback?: any,
  ) => {
    const listDateFilteredAdsRequest = {
      campaign_ids: campaignIds,
    };
    const fetchedAds = await getDateFilteredAds(
      listDateFilteredAdsRequest,
      requestTimestamp,
      timePeriod,
      undefined,
      undefined,
      onErrorCallback,
    );

    let nextSerialCursor = fetchedAds.next_cursor;
    let allAds = fetchedAds.ads;

    /* eslint-disable no-await-in-loop */
    while (nextSerialCursor) {
      const nextFetchedAds = await getDateFilteredAds(
        listDateFilteredAdsRequest,
        requestTimestamp,
        timePeriod,
        LARGEST_FAST_PAGE_SIZE,
        nextSerialCursor,
        onErrorCallback,
      );
      nextSerialCursor = nextFetchedAds.next_cursor;
      allAds = allAds.concat(nextFetchedAds.ads);

      if (!nextSerialCursor) {
        break;
      }
    }
    return allAds;
  };

  const IsValidDateFilteringTimePeriod = (timePeriod: number) => {
    return Object.values(DateFilteringTimePeriod).includes(timePeriod);
  };

  const showCampaignsTable = currentView === HOME_PAGE_TABLE_VIEWS.campaigns;
  const showAdSetsTable = currentView === HOME_PAGE_TABLE_VIEWS.adSets;
  const showAdsTable = currentView === HOME_PAGE_TABLE_VIEWS.ads;

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    if (tableView && tableView !== currentView) {
      setCurrentView(tableView.toString());
    } else {
      const query: any = {
        tableView: 'campaigns',
      };
      if (isFromSuccessfulEmailVerification) {
        query.isFromSuccessfulEmailVerification = true;
      }
      router.replace({
        pathname: Routes.CLASSIC,
        query,
      });
    }
  }, [router.isReady, tableView]);

  useEffect(() => {
    if (campaigns && !campaignsLoading) {
      const campaignIds = campaigns.map((campaign) => campaign.id);
      const campaignIdBatches = [];
      // Batch size should not exceed the BatchGetRequestLimit specified at https://obelix.simulprod.com/project/ads-golang/runtime-configuration/group/ads-management-service-v2
      const campaignBatchSize = 50;
      for (let i = 0; i < campaignIds.length; i += campaignBatchSize) {
        campaignIdBatches.push(campaignIds.slice(i, i + campaignBatchSize));
      }
      const backendResponses = new Map<string, GetCampaignStatusResponseType>();
      Promise.all(
        campaignIdBatches.map((campaignIdBatch) =>
          getCampaignStatus(campaignIdBatch)
            .then((r) => {
              return r.map((response) => backendResponses.set(response.id, response));
            })
            .catch((error) => {
              // Show error statuses for those that did not come back successfully
              campaignIdBatch.map((campaignId) =>
                backendResponses.set(campaignId, {
                  disabled: true,
                  display_status: CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_ERROR,
                  id: campaignId,
                  is_on: false,
                }),
              );
              unifiedLogger.logClickEvent({
                eventName: EventName.GetCampaignStatusError,
                parameters: {
                  adAccountId: adAccountId || '',
                  errorStatus: error.message,
                },
              });
            }),
        ),
      ).then(() => {
        replaceBackendCampaignStatuses(backendResponses);
      });
    }
    if (campaigns && !campaignsLoading) {
      replaceNumCampaigns(campaigns);
    }
  }, [campaignsLoading]);

  useEffect(() => {
    if (adSets && !adSetsLoading) {
      const adSetIds = adSets.map((adSet) => adSet.id);
      const adSetIdBatches = [];
      // Batch size should not exceed the BatchGetRequestLimit specified at https://obelix.simulprod.com/project/ads-golang/runtime-configuration/group/ads-management-service-v2
      const adSetBatchSize = 50;
      for (let i = 0; i < adSetIds.length; i += adSetBatchSize) {
        adSetIdBatches.push(adSetIds.slice(i, i + adSetBatchSize));
      }
      const backendResponses = new Map<string, GetAdSetStatusResponseType>();
      Promise.all(
        adSetIdBatches.map((adSetIdBatch) =>
          getAdSetStatus(adSetIdBatch)
            .then((r) => {
              return r.map((response) => backendResponses.set(response.id, response));
            })
            .catch((error) => {
              // Show error statuses for those that did not come back successfully
              adSetIdBatch.map((adSetId) =>
                backendResponses.set(adSetId, {
                  disabled: true,
                  display_status: AdSetDisplayStatusType.AD_SET_DISPLAY_STATUS_ERROR,
                  id: adSetId,
                  is_on: false,
                }),
              );
              unifiedLogger.logClickEvent({
                eventName: EventName.GetAdSetStatusError,
                parameters: {
                  adAccountId: adAccountId || '',
                  errorStatus: error.message,
                },
              });
            }),
        ),
      ).then(() => {
        replaceBackendAdSetStatuses(backendResponses);
      });
    }
    if (adSets && !adSetsLoading) {
      replaceCampaignIdToNumChildren(adSets);
    }
  }, [adSetsLoading]);

  useEffect(() => {
    if (ads && !adsLoading) {
      const adIds = ads.map((ad) => ad.id);
      const adIdBatches = [];
      // Batch size should not exceed the BatchGetRequestLimit specified at https://obelix.simulprod.com/project/ads-golang/runtime-configuration/group/ads-management-service-v2
      const adBatchSize = 50;
      for (let i = 0; i < adIds.length; i += adBatchSize) {
        adIdBatches.push(adIds.slice(i, i + adBatchSize));
      }
      const backendResponses = new Map<string, GetAdStatusResponseType>();
      Promise.all(
        adIdBatches.map((adIdBatch) =>
          getAdStatus(adIdBatch)
            .then((r) => {
              return r.map((response) => backendResponses.set(response.id, response));
            })
            .catch((error) => {
              // Show error statuses for those that did not come back successfully
              adIdBatch.map((adId) =>
                backendResponses.set(adId, {
                  disabled: true,
                  display_status: AdDisplayStatusType.AD_DISPLAY_STATUS_ERROR,
                  id: adId,
                  is_on: false,
                }),
              );
              unifiedLogger.logClickEvent({
                eventName: EventName.GetAdStatusError,
                parameters: {
                  adAccountId: adAccountId || '',
                  errorStatus: error.message,
                },
              });
            }),
        ),
      ).then(() => {
        replaceBackendAdStatuses(backendResponses);
      });
    }
    if (ads && !adsLoading) {
      replaceAdSetIdToNumChildren(ads);
    }
  }, [adsLoading]);

  const loadBatchAssetThumbnails = async (assetIds: number[]) => {
    try {
      const thumbnailResponse = await getImageThumbnails(assetIds);
      thumbnailResponse.data.forEach((resp: any) => {
        const { imageUrl, targetId } = resp;
        updateAssetIdToUrlMap(targetId, imageUrl);
      });
    } catch (e) {
      CaptureException(`error getting thumbnail urls for assetIds ${assetIds}`);
    }
  };

  const loadBatchGameThumbnails = async (universeIds: number[]) => {
    try {
      const thumbnailResponse = await getGameThumbnailsByUniverseIds(universeIds);
      thumbnailResponse.data.forEach((resp: any) => {
        const { imageUrl, targetId } = resp;
        updateAssetIdToUrlMap(targetId, imageUrl);
      });
    } catch (e) {
      CaptureException(`error getting thumbnail urls for universeIds ${universeIds}`);
    }
  };

  useEffect(() => {
    const fetchCreativeAssets = async () => {
      if (ads && !adsLoading) {
        const assetIds: any[] = [];
        const universeIds: any[] = [];
        ads.forEach((ad: any) => {
          switch (ad.type) {
            case ServerAdFormatType.DISPLAY:
              assetIds.push(ad.display_ad_metadata?.asset_metadata?.asset_id);
              break;
            case ServerAdFormatType.PORTAL:
              assetIds.push(ad.portal_ad_metadata?.banner_asset_metadata?.asset_id);
              break;
            case ServerAdFormatType.VIDEO:
              assetIds.push(ad.video_ad_metadata?.asset_metadata?.asset_id);
              break;
            case ServerAdFormatType.TILE:
              universeIds.push(ad.sponsored_universe_ad_metadata?.target_universe_id);
              break;
            case ServerAdFormatType.SEARCH:
              universeIds.push(ad.search_ad_metadata?.target_universe_id);
              break;
            default:
              CaptureException(`unknown type ${ad.type} for ad id ${ad.id}`);
          }
        });

        const batchRequestPromises: Promise<void>[] = [];
        const batchSize = getThumbnailsClientBatchSize();
        const numAssetRequests = Math.ceil(assetIds.length / batchSize);
        for (let i = 0; i < numAssetRequests; i += 1) {
          const sliceStart = i * batchSize;
          const batchAssetIds = assetIds.slice(sliceStart, sliceStart + batchSize);
          batchRequestPromises.push(loadBatchAssetThumbnails(batchAssetIds));
        }
        const numUniverseRequests = Math.ceil(universeIds.length / batchSize);
        for (let i = 0; i < numUniverseRequests; i += 1) {
          const sliceStart = i * batchSize;
          const batchUniverseIds = universeIds.slice(sliceStart, sliceStart + batchSize);
          batchRequestPromises.push(loadBatchGameThumbnails(batchUniverseIds));
        }
        await Promise.all(batchRequestPromises);
        setAssetMapLoading(false);
      }
    };
    fetchCreativeAssets();
  }, [adsLoading]);

  const fetchAllLifetimeTableData = async () => {
    return Promise.all([
      fetchCampaignsCurrentUserHasAccessTo()
        .catch((err) => {
          CaptureException(err as Error);
          setCampaignsLoadingError(true);
        })
        .finally(() => {
          setCampaignsLoading(false);
        }),
      fetchAdSetsCurrentUserHasAccessTo()
        .catch((err) => {
          CaptureException(err as Error);
          setAdSetsLoadingError(true);
        })
        .finally(() => {
          setAdSetsLoading(false);
        }),
      fetchAdsCurrentUserHasAccessTo()
        .catch((err) => {
          CaptureException(err as Error);
          setAdsLoadingError(true);
        })
        .finally(() => {
          setAdsLoading(false);
        }),
      fetchAdFormatsCurrentUserUses()
        .catch((err) => {
          CaptureException(err as Error);
        })
        .finally(() => {
          setAdFormatsLoading(false);
        }),
    ]);
  };

  useEffect(() => {
    fetchAllLifetimeTableData();
  }, [
    fetchCampaignsCurrentUserHasAccessTo,
    fetchAdSetsCurrentUserHasAccessTo,
    fetchAdsCurrentUserHasAccessTo,
    fetchAdFormatsCurrentUserUses,
  ]);

  useEffect(() => {
    resolvePaymentProfile(true);
    resolvePaymentStatus(true);

    resetStatuses();
    resetLimitInfo();
  }, []);

  const getUserHasValidDisplayName = useAppStore(
    (state: AppStoreType) => state.getUserHasValidDisplayName,
  );

  const checkUserHasValidDisplayName = useCallback(async () => {
    if (
      organizationInfo &&
      organizationInfo?.type === OrganizationType.ORGANIZATION_TYPE_BUSINESS
    ) {
      try {
        const validDisplayName = await getUserHasValidDisplayName(
          organizationInfo?.business_name?.name,
        );
        const isValid = validDisplayName?.is_valid || false;
        setAccountHasValidName(isValid);
      } catch (error) {
        CaptureException(error as Error);
      }
    }
  }, [organizationInfo]);

  useEffect(() => {
    if (organizationInfo && adAccountInfo && paymentProfiles) {
      setPageFetchingEssentialData(false);
    }
  }, [organizationInfo, adAccountInfo, paymentProfiles]);

  useEffect(() => {
    checkUserHasValidDisplayName();
  }, [organizationInfo, checkUserHasValidDisplayName]);

  let unifiedPaymentStatusToast: any;

  const advertisingEnabled = useAppStore((state: AppStoreType) =>
    state.advertisingShouldBeEnabled(),
  );

  const hasNoPaymentMethod = (paymentProfile === null || hasUnverifiedCard) && !adCreditActivated;

  if (
    isClassicFlowEnabled ||
    loadingPaymentProfile ||
    loadingPaymentStatus ||
    pageFetchingEssentialData ||
    (adCreditActivated && advertisingEnabled.advertisingShouldBeEnabled)
  ) {
    unifiedPaymentStatusToast = null;
  } else {
    unifiedPaymentStatusToast = (
      <UnifiedPaymentStatusToast
        failedCardAuthorization={showFailedCardAuthBanner}
        hasActiveChallenge={paymentProfile?.has_active_challenge}
        hasFailedPayment={hasFailedPayment}
        hasNoPaymentMethod={hasNoPaymentMethod}
        hasUnknownError={showUnknownErrorBanner}
        hasUnverifiedCard={hasUnverifiedCard}
        paymentProfileId={paymentProfile?.payment_profile_id}
        refreshFunc={async () => {
          const checkPaymentDeclined = await resolvePaymentStatus(false);
          const checkUnverifiedCardStatus = await resolvePaymentProfile(false);

          setHasFailedPayment(checkPaymentDeclined);
          setHasUnverifiedCard(checkUnverifiedCardStatus);
          return checkPaymentDeclined || checkUnverifiedCardStatus;
        }}
        somethingWentWrong={showSomethingWentWrongBanner}
      />
    );
  }

  let displayNameWarningToast = null;
  if (!accountHasValidName) {
    displayNameWarningToast = <DisplayNameWarningToast />;
  }

  const getCampaignsTable = () => {
    if (showCampaignsTable && (campaignsLoading || adFormatsLoading || filterLoading)) {
      return <CenteredCircularProgress />;
    }

    if (campaignsLoadingError && !campaignsLoading && showCampaignsTable) {
      return <NoDataPage />;
    }

    if (
      (!campaignsLoading && !campaigns && showCampaignsTable) ||
      (campaigns && campaigns.length === 0 && showCampaignsTable)
    ) {
      if (selectedDateRange === DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_UNSPECIFIED) {
        return <EmptyDataPage />;
      }
      return <DateFilteringNoDataPage />;
    }

    if (campaigns && showCampaignsTable) {
      return (
        <CampaignManagementTable
          adFormats={adFormats}
          hasNoPaymentMethod={hasNoPaymentMethod}
          inFilterView={filteredCampaignIds !== undefined}
          loadMore={loadMoreCampaigns}
          nextCursor={campaignsNextCursor}
          onCancelFailure={() => {
            setShowCancelFailure(true);
          }}
          onCancelSuccess={() => {
            setShowCancelSuccessful(true);
          }}
          onEditClick={() => {
            setShowEditSuccessful(false);
          }}
          onEditSuccess={() => {
            setShowEditSuccessful(true);
          }}
          rows={campaigns.filter(
            (row) => filteredCampaignIds === undefined || filteredCampaignIds.has(row.id),
          )}
          showDelete={showDelete}
          tableSummaryRowData={campaignsSummaryInfo}
        />
      );
    }

    return null;
  };

  const getAdSetsTable = () => {
    if (showAdSetsTable && (adSetsLoading || adFormatsLoading || filterLoading)) {
      return <CenteredCircularProgress />;
    }

    if (adSetsLoadingError && !adSetsLoading && showAdSetsTable) {
      return <NoDataPage />;
    }

    if (
      (!adSetsLoading && !adSets && showAdSetsTable) ||
      (adSets && adSets.length === 0 && showAdSetsTable)
    ) {
      if (selectedDateRange === DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_UNSPECIFIED) {
        return <EmptyDataPage />;
      }
      return <DateFilteringNoDataPage />;
    }

    if (adSets && showAdSetsTable) {
      return (
        <AdSetsManagementTable
          adFormats={adFormats || []}
          inFilterView={filteredAdSetIds !== undefined}
          loadMore={loadMoreAdSets}
          nextCursor={adSetsNextCursor}
          onCancelFailure={() => {}}
          onCancelSuccess={() => {}}
          onEditClick={() => {
            setShowEditSuccessful(false);
          }}
          onEditSuccess={() => {
            setShowEditSuccessful(true);
          }}
          rows={adSets.filter(
            (row) => filteredAdSetIds === undefined || filteredAdSetIds.has(row.id),
          )}
          showDelete={showDelete}
          tableSummaryRowData={adSetsSummaryInfo}
        />
      );
    }
    return null;
  };

  const getAdsTable = () => {
    if (showAdsTable && (adsLoading || adFormatsLoading || filterLoading)) {
      return <CenteredCircularProgress />;
    }

    if (adsLoadingError && !adsLoading && showAdsTable) {
      return <NoDataPage />;
    }

    if ((!adsLoading && !ads && showAdsTable) || (ads && ads.length === 0 && showAdsTable)) {
      if (selectedDateRange === DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_UNSPECIFIED) {
        return <EmptyDataPage />;
      }
      return <DateFilteringNoDataPage />;
    }

    if (ads && showAdsTable) {
      return (
        <AdsManagementTable
          adFormats={adFormats}
          assetIdToUrlMap={assetIdToUrlMap || new Map()}
          assetMapLoading={assetMapLoading}
          inFilterView={filteredAdIds !== undefined}
          loadMore={loadMoreAds}
          nextCursor={adsNextCursor}
          onCancelFailure={() => {}}
          onCancelSuccess={() => {}}
          onEditClick={() => {
            setShowEditSuccessful(false);
          }}
          onEditSuccess={() => {
            setShowEditSuccessful(true);
          }}
          rows={ads.filter((row) => filteredAdIds === undefined || filteredAdIds.has(row.id))}
          showDelete={showDelete}
          tableSummaryRowData={adsSummaryInfo}
        />
      );
    }
    return null;
  };

  const utilityButtonsContainer: ReactNode = (
    <div className={utilityButtonsContainerStyle}>
      <Button
        icon='icon-regular-arrow-down-to-line'
        onClick={() => openReportDownloadDialog()}
        size='Small'
        variant='Utility'>
        {translate('Action.Download')}
      </Button>
    </div>
  );

  const clearSelectedRows = () => {
    setSelectedCampaigns([]);
    setSelectedAdSets([]);
    setSelectedAds([]);
  };

  const getCampaignIds = (campaignsResponse: any[]): string[] => {
    return campaignsResponse.map((campaign) => campaign.id);
  };

  const onDateFilteringError = (response: Response) => {
    setDateFilteringLoadingError(true);
    if (response.status === 429) {
      setDateFilteringRateLimitExceeded(true);
    }
    NON_REACT_CLOSURE_STORE_has_date_picker_loading_error = true;
    unifiedLogger.logClickEvent({
      eventName: EventName.DateFilteringError,
      parameters: {
        errorStatus: response.status.toString(),
        url: response.url,
      },
    });
  };

  const handleChangeDateFiltering = async (newDateRangeSelection: number) => {
    const requestTimestamp = new Date().toISOString();
    setDateFilteringLoadingError(false);
    setDateFilteringRateLimitExceeded(false);
    // Fetch campaigns first, then call ad sets/ads/summary endpoints if successful
    try {
      const dateFilteredCampaigns = await loadDateFilteredCampaigns(
        requestTimestamp,
        newDateRangeSelection,
        onDateFilteringError,
      );

      if (dateFilteredCampaigns && dateFilteredCampaigns.length > 0) {
        const campaignIds = getCampaignIds(dateFilteredCampaigns);

        await Promise.all([
          loadDateFilteredAdSets(
            campaignIds,
            requestTimestamp,
            newDateRangeSelection,
            onDateFilteringError,
          ),
          loadDateFilteredAds(
            campaignIds,
            requestTimestamp,
            newDateRangeSelection,
            onDateFilteringError,
          ),
          getDateFilteredCampaignsSummary(
            requestTimestamp,
            newDateRangeSelection,
            onDateFilteringError,
          ),
          getDateFilteredAdSetsSummary(
            requestTimestamp,
            newDateRangeSelection,
            onDateFilteringError,
          ),
          getDateFilteredAdsSummary(requestTimestamp, newDateRangeSelection, onDateFilteringError),
        ]).then((resolvedPromises: any = []) => {
          const [
            adSetsResponse,
            adsResponse,
            campaignSummaryResponse,
            adSetSummaryResponse,
            adSummaryResponse,
          ] = resolvedPromises;

          if (NON_REACT_CLOSURE_STORE_has_date_picker_loading_error) {
            return false;
          }

          setCampaigns(dateFilteredCampaigns);
          setAdSets(adSetsResponse);
          setAds(adsResponse);

          setCampaignsSummaryInfo(campaignSummaryResponse);
          setAdSetsSummaryInfo(adSetSummaryResponse);
          setAdsSummaryInfo(adSummaryResponse);

          setSelectedDateRange(newDateRangeSelection);
          return true;
        });
      } else {
        setCampaigns([]);
        setAdSets([]);
        setAds([]);

        setCampaignsSummaryInfo({});
        setAdSetsSummaryInfo({});
        setAdsSummaryInfo({});
        setSelectedDateRange(newDateRangeSelection);
      }
    } catch (error) {
      CaptureException(error as Error);
      setDateFilteringLoadingError(true);
    }

    return true;
  };

  const handleChange = async (evt: any) => {
    NON_REACT_CLOSURE_STORE_has_date_picker_loading_error = false;
    const newDateRangeSelection = parseInt(evt?.target?.value, 10);
    if (
      !Number.isNaN(newDateRangeSelection) &&
      IsValidDateFilteringTimePeriod(newDateRangeSelection)
    ) {
      // Show loading animation while updating table with date filtered data
      setDateFilteringLoading(true);
      setCampaignsLoading(true);
      setAdSetsLoading(true);
      setAdsLoading(true);
      // Reset
      resetStatuses();
      setRefreshFilter(FilterRefresh.FILTER_REFRESH_AFTER_DATE_FILTER);

      // If the selection is for "Lifetime" we use the UNSPECIFIED enum value
      // and call the standard campaign/adset/ad endpoints to load lifetime
      // data instead of using date filtering endpoints
      if (
        newDateRangeSelection === DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_UNSPECIFIED
      ) {
        await fetchAllLifetimeTableData();
        if (campaignsLoadingError || adSetsLoadingError || adsLoadingError) {
          setDateFilteringLoadingError(true);
        } else {
          setSelectedDateRange(newDateRangeSelection);
          setDateFilteringLoadingError(false);
        }
      } else {
        unifiedLogger.logClickEvent({
          eventName: EventName.DateFilteringOptionClicked,
          parameters: {
            dateFilteringOption: ConvertDateFilteringEnumToString(newDateRangeSelection),
          },
        });

        await handleChangeDateFiltering(newDateRangeSelection);
      }

      // De-select any previously selected rows
      clearSelectedRows();

      // Show table with updated data
      setDateFilteringLoading(false);
      setCampaignsLoading(false);
      setAdSetsLoading(false);
      setAdsLoading(false);
    }
  };

  const DateQuickPick = (
    <FormControl
      className={dateQuickPickContainer}
      error={dateFilteringLoadingError}
      variant='outlined'>
      <Select
        disabled={dateFilteringLoading}
        inputProps={{
          id: 'outlined-date-range',
          MenuProps: {
            anchorOrigin: {
              horizontal: 'left',
              vertical: 'bottom',
            },
            getContentAnchorEl: null,
            transformOrigin: {
              horizontal: 'left',
              vertical: 'top',
            },
          },
          name: 'dateRange',
        }}
        label={translate('Label.DateRange')}
        onChange={handleChange}
        size='small'
        value={selectedDateRange}
        variant='outlined'>
        <MenuItem value={DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_UNSPECIFIED}>
          {translate('Label.Lifetime')}
        </MenuItem>
        <MenuItem value={DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_TODAY}>
          {translate('Label.Today')}
        </MenuItem>
        <MenuItem value={DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_YESTERDAY}>
          {translate('Label.Yesterday')}
        </MenuItem>
        <MenuItem value={DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_SEVEN_DAYS}>
          {translate('Label.Last7Days')}
        </MenuItem>
        <MenuItem value={DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_THIRTY_DAYS}>
          {translate('Label.Last30Days')}
        </MenuItem>
        <MenuItem value={DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_THIS_MONTH}>
          {translate('Label.ThisMonth')}
        </MenuItem>
        <MenuItem value={DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_LAST_MONTH}>
          {translate('Label.LastMonth')}
        </MenuItem>
        <MenuItem value={DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_YEAR_TO_DATE}>
          {translate('Label.YearToDate')}
        </MenuItem>
      </Select>
      {dateFilteringLoadingError && dateFilteringRateLimitExceeded && (
        <FormHelperText>{translate('Message.DateFilteringRateLimitExceeded')}</FormHelperText>
      )}
      {dateFilteringLoadingError && !dateFilteringRateLimitExceeded && (
        <FormHelperText>{translate('Message.DateFilteringFetchError')}</FormHelperText>
      )}
    </FormControl>
  );

  let topBanners = <div>{unifiedPaymentStatusToast}</div>;
  if (displayNameWarningToast !== null) {
    topBanners = (
      <div>
        <div>{unifiedPaymentStatusToast}</div>
        <div>{displayNameWarningToast}</div>
      </div>
    );
  }

  const headerSection = (
    <div>
      {topBanners}
      <Grid container rowGap='24px'>
        {!isClassicFlowEnabled && <TransitionBanner />}
        <div className={headerRowContainerStyle}>
          <div>
            {DateQuickPick}
            <FilterButtonAndPills
              clearSelectedRows={clearSelectedRows}
              disabled={campaignsLoading || adSetsLoading || adsLoading}
              filteredAdIds={filteredAdIds}
              filteredAdSetIds={filteredAdSetIds}
              filteredCampaignIds={filteredCampaignIds}
              setFilteredAdIds={setFilteredAdIds}
              setFilteredAdSetIds={setFilteredAdSetIds}
              setFilteredCampaignIds={setFilteredCampaignIds}
              setFilterLoading={setFilterLoading}
            />
          </div>
          <CreateButton />
        </div>
        <Grid item XSmall={12}>
          <AdManagerTabs />
          {campaigns && campaigns.length > 0 && utilityButtonsContainer}
        </Grid>
      </Grid>
    </div>
  );
  return (
    <AdsManagerPageBaseLayout headerSection={headerSection} isLoading={pageFetchingEssentialData}>
      <div className={pageContainer}>
        {isFromSuccessfulEmailVerification && (
          <GenericSnackBar message={translate('Message.EmailVerified')} severity='success' />
        )}
        {showEditSuccessful && (
          <GenericSnackBar message={translate('Message.EditSaved')} severity='success' />
        )}
        {showCancelSuccessful && (
          <GenericSnackBar message={translate('Message.CampaignCanceled')} severity='success' />
        )}
        {showCancelFailure && (
          <GenericSnackBar message={translate('Message.CancelCampaignError')} severity='error' />
        )}
        {getCampaignsTable()}
        {getAdsTable()}
        {getAdSetsTable()}
      </div>
    </AdsManagerPageBaseLayout>
  );
};

(Home as any).getPageLayout = getHomePageLayout;

export default Home;
