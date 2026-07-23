import {
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  Grid,
  RefreshIcon,
  Tooltip,
} from '@rbx/ui';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import { EventName, unifiedLogger } from '@clients/unifiedLogger';
import { ServerCampaignObjectiveType } from '@constants/campaign';
import {
  CategoryFilter,
  getFilteredIds,
  ListFilteredIdsRequestType,
} from '@modules/clients/ads/adsClient';
import { SummaryEntityType } from '@modules/clients/ads/adsClientTypes';
import { GetTooltipText } from '@modules/miscellaneous/utils/tooltipStrings';
import useFilteringStore from '@modules/stores/filteringStoreProvider';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { ServerAdSetBidType } from '@type/adSet';
import { TODOFIXANY } from 'app/shared/types';

import FilterChip from './FilterDrawer/FilterChip';
import useFilterDrawerStyles from './FilterDrawer/FilterDrawer.styles';
import FilterDrawerButton from './FilterDrawer/FilterDrawerButton';
import FilterDrawerEnumChoice from './FilterDrawer/FilterDrawerEnumChoice';
import FilterDrawerGroup from './FilterDrawer/FilterDrawerGroup';
import FilterDrawerTextChoice from './FilterDrawer/FilterDrawerTextChoice';
import setsEqual from './utils/comparisonUtils';
import {
  adFormatEnumKeys,
  adSetBidTypeEnumKeys,
  campaignObjectiveEnumKeys,
  campaignPaymentMethodEnumKeys,
  enumToNum,
  FilterRefresh,
} from './utils/filterEnums';
import { getText } from './utils/filterStrings';

interface FilterButtonAndPillsProps {
  clearSelectedRows: () => void;
  disabled: boolean;
  filteredAdIds: Set<string> | undefined;
  filteredAdSetIds: Set<string> | undefined;
  filteredCampaignIds: Set<string> | undefined;
  setFilteredAdIds: Dispatch<SetStateAction<Set<string> | undefined>>;
  setFilteredAdSetIds: Dispatch<SetStateAction<Set<string> | undefined>>;
  setFilteredCampaignIds: Dispatch<SetStateAction<Set<string> | undefined>>;
  setFilterLoading: Dispatch<SetStateAction<boolean>>;
}

interface FilterBodyProps {
  currentCategoryFilter: Map<string, string[]>;
  currentTextFilter: Map<SummaryEntityType, string>;
  requestedCategoryFilter: Map<string, string[]>;
  requestedTextFilter: Map<SummaryEntityType, string>;
  setRequestedCategoryFilter: Dispatch<SetStateAction<Map<string, string[]>>>;
  setRequestedTextFilter: Dispatch<SetStateAction<Map<SummaryEntityType, string>>>;
}

interface FilterPillsProps {
  currentCategoryFilter: Map<string, string[]>;
  currentTextFilter: Map<SummaryEntityType, string>;
  disabled: boolean;
  setRequestedCategoryFilter: Dispatch<SetStateAction<Map<string, string[]>>>;
  setRequestedTextFilter: Dispatch<SetStateAction<Map<SummaryEntityType, string>>>;
}

const FilterPills = ({
  currentCategoryFilter,
  currentTextFilter,
  disabled,
  setRequestedCategoryFilter,
  setRequestedTextFilter,
}: FilterPillsProps) => (
  <Grid columnGap={1} container marginTop='18px'>
    {currentTextFilter.get(SummaryEntityType.ENTITY_TYPE_CAMPAIGN) && (
      <Grid item key='campaign name'>
        <FilterChip
          disabled={disabled}
          label={`Campaign Name: ${currentTextFilter.get(SummaryEntityType.ENTITY_TYPE_CAMPAIGN)}`}
          onDelete={() => {
            setRequestedTextFilter(
              new Map(currentTextFilter.set(SummaryEntityType.ENTITY_TYPE_CAMPAIGN, '')),
            );
          }}
        />
      </Grid>
    )}
    {currentTextFilter.get(SummaryEntityType.ENTITY_TYPE_AD_SET) && (
      <Grid item key='ad set name'>
        <FilterChip
          disabled={disabled}
          label={`Ad Set Name: ${currentTextFilter.get(SummaryEntityType.ENTITY_TYPE_AD_SET)}`}
          onDelete={() => {
            setRequestedTextFilter(
              new Map(currentTextFilter.set(SummaryEntityType.ENTITY_TYPE_AD_SET, '')),
            );
          }}
        />
      </Grid>
    )}
    {currentTextFilter.get(SummaryEntityType.ENTITY_TYPE_AD) && (
      <Grid item key='ad name'>
        <FilterChip
          disabled={disabled}
          label={`Ad Name: ${currentTextFilter.get(SummaryEntityType.ENTITY_TYPE_AD)}`}
          onDelete={() => {
            setRequestedTextFilter(
              new Map(currentTextFilter.set(SummaryEntityType.ENTITY_TYPE_AD, '')),
            );
          }}
        />
      </Grid>
    )}
    {currentCategoryFilter.get('objective') &&
      currentCategoryFilter.get('objective')?.length !== 0 && (
        <Grid item key='campaign objective'>
          <FilterChip
            disabled={disabled}
            label={`Objective: ${currentCategoryFilter.get('objective')?.join(', ')}`}
            onDelete={() => {
              currentCategoryFilter.delete('objective');
              setRequestedCategoryFilter(new Map(currentCategoryFilter));
            }}
          />
        </Grid>
      )}
    {currentCategoryFilter.get('payment_type') &&
      currentCategoryFilter.get('payment_type')?.length !== 0 && (
        <Grid item key='campaign payment type'>
          <FilterChip
            disabled={disabled}
            label={`Payment Type: ${currentCategoryFilter.get('payment_type')?.join(', ')}`}
            onDelete={() => {
              currentCategoryFilter.delete('payment_type');
              setRequestedCategoryFilter(new Map(currentCategoryFilter));
            }}
          />
        </Grid>
      )}
    {currentCategoryFilter.get('bid_type') &&
      currentCategoryFilter.get('bid_type')?.length !== 0 && (
        <Grid item key='ad set bid type'>
          <FilterChip
            disabled={disabled}
            label={`Bid Type: ${currentCategoryFilter.get('bid_type')?.join(', ')}`}
            onDelete={() => {
              currentCategoryFilter.delete('bid_type');
              setRequestedCategoryFilter(new Map(currentCategoryFilter));
            }}
          />
        </Grid>
      )}
    {currentCategoryFilter.get('ad_format') &&
      currentCategoryFilter.get('ad_format')?.length !== 0 && (
        <Grid item key='ad format'>
          <FilterChip
            disabled={disabled}
            label={`Ad Format: ${currentCategoryFilter.get('ad_format')?.join(', ')}`}
            onDelete={() => {
              currentCategoryFilter.delete('ad_format');
              setRequestedCategoryFilter(new Map(currentCategoryFilter));
            }}
          />
        </Grid>
      )}
  </Grid>
);

const FilterBody = ({
  currentCategoryFilter,
  currentTextFilter,
  requestedCategoryFilter,
  requestedTextFilter,
  setRequestedCategoryFilter,
  setRequestedTextFilter,
}: FilterBodyProps) => {
  const adAccountIsInternalManaged = useAppStore(
    (state: AppStoreType) => state.adAccountIsInternalManaged,
  );
  const adAccountIsExternalManaged = useAppStore(
    (state: AppStoreType) => state.adAccountIsExternalManaged,
  );

  return (
    <>
      <FilterDrawerGroup name={'Search Name' as string}>
        <FilterDrawerTextChoice
          initial={currentTextFilter.get(SummaryEntityType.ENTITY_TYPE_CAMPAIGN)}
          key='campaign name'
          name='Campaign Name'
          onChangeSubmit={(newValue) => {
            setRequestedTextFilter(
              new Map(requestedTextFilter.set(SummaryEntityType.ENTITY_TYPE_CAMPAIGN, newValue[0])),
            );
          }}
          // This is done to keep value even if request ended in error
          overrideSignal={requestedTextFilter.get(SummaryEntityType.ENTITY_TYPE_CAMPAIGN)}
        />
        <FilterDrawerTextChoice
          initial={currentTextFilter.get(SummaryEntityType.ENTITY_TYPE_AD_SET)}
          key='ad set name'
          name='Ad Set Name'
          onChangeSubmit={(newValue) => {
            setRequestedTextFilter(
              new Map(requestedTextFilter.set(SummaryEntityType.ENTITY_TYPE_AD_SET, newValue[0])),
            );
          }}
          overrideSignal={requestedTextFilter.get(SummaryEntityType.ENTITY_TYPE_AD_SET)}
        />
        <FilterDrawerTextChoice
          initial={currentTextFilter.get(SummaryEntityType.ENTITY_TYPE_AD)}
          key='ad name'
          name='Ad Name'
          onChangeSubmit={(newValue) => {
            setRequestedTextFilter(
              new Map(requestedTextFilter.set(SummaryEntityType.ENTITY_TYPE_AD, newValue[0])),
            );
          }}
          overrideSignal={requestedTextFilter.get(SummaryEntityType.ENTITY_TYPE_AD)}
        />
      </FilterDrawerGroup>
      <FilterDrawerGroup name={'Campaign' as string}>
        <FilterDrawerEnumChoice
          enumOptions={campaignObjectiveEnumKeys
            .filter((pair) => !(pair[1] === ServerCampaignObjectiveType.VIDEO_VIEWS))
            .map((pair) => pair[0])}
          formatOption='literal'
          initial={currentCategoryFilter.get('objective') || []}
          multiple
          name={'Objective' as string}
          onChangeSubmit={(newValue) => {
            setRequestedCategoryFilter(new Map(requestedCategoryFilter.set('objective', newValue)));
          }}
          overrideSignal={requestedCategoryFilter.get('objective') || []}
        />
        {!(adAccountIsInternalManaged() || adAccountIsExternalManaged()) && ( // Only show payment type filter for self-serve accounts
          <FilterDrawerEnumChoice
            enumOptions={campaignPaymentMethodEnumKeys.map((pair) => pair[0])}
            formatOption='literal'
            initial={currentCategoryFilter.get('payment_type') || []}
            multiple
            name={'Payment Type' as string}
            onChangeSubmit={(newValue) => {
              setRequestedCategoryFilter(
                new Map(requestedCategoryFilter.set('payment_type', newValue)),
              );
            }}
            overrideSignal={requestedCategoryFilter.get('payment_type') || []}
          />
        )}
      </FilterDrawerGroup>
      <FilterDrawerGroup name={'Ad Set' as string}>
        <FilterDrawerEnumChoice
          enumOptions={adSetBidTypeEnumKeys
            .filter((pair) => !(pair[1] === ServerAdSetBidType.CPV15))
            .map((pair) => pair[0])}
          formatOption='literal'
          initial={currentCategoryFilter.get('bid_type') || []}
          multiple
          name={'Bid Type' as string}
          onChangeSubmit={(newValue) => {
            setRequestedCategoryFilter(new Map(requestedCategoryFilter.set('bid_type', newValue)));
          }}
          overrideSignal={requestedCategoryFilter.get('bid_type') || []}
        />
      </FilterDrawerGroup>
      <FilterDrawerGroup name={'Ad' as string}>
        <FilterDrawerEnumChoice
          enumOptions={adFormatEnumKeys.map((pair) => pair[0])}
          formatOption='literal'
          initial={currentCategoryFilter.get('ad_format') || []}
          multiple
          name={'Ad Format' as string}
          onChangeSubmit={(newValue) => {
            setRequestedCategoryFilter(new Map(requestedCategoryFilter.set('ad_format', newValue)));
          }}
          overrideSignal={requestedCategoryFilter.get('ad_format') || []}
        />
      </FilterDrawerGroup>
    </>
  );
};

export const FilterButtonAndPills = ({
  clearSelectedRows,
  disabled,
  filteredAdIds,
  filteredAdSetIds,
  filteredCampaignIds,
  setFilteredAdIds,
  setFilteredAdSetIds,
  setFilteredCampaignIds,
  setFilterLoading,
}: FilterButtonAndPillsProps) => {
  const {
    classes: { filterLoadingCircularSpinner, filterRefreshButton },
  } = useFilterDrawerStyles();
  const { adAccountId, ads, adSets } = useAppStore((state: AppStoreType) => state.appData);

  const refreshFilter = useFilteringStore((state: TODOFIXANY) => state.refreshFilter);
  const setRefreshFilter = useFilteringStore((state: TODOFIXANY) => state.setRefreshFilter);

  const [filterLoadingError, setFilterLoadingError] = useState<boolean>(false);
  const [requestedTextFilter, setRequestedTextFilter] = useState<Map<SummaryEntityType, string>>(
    new Map(),
  );
  const [currentTextFilter, setCurrentTextFilter] = useState<Map<SummaryEntityType, string>>(
    new Map(),
  );
  const [requestedCategoryFilter, setRequestedCategoryFilter] = useState<Map<string, string[]>>(
    new Map(),
  );
  const [currentCategoryFilter, setCurrentCategoryFilter] = useState<Map<string, string[]>>(
    new Map(),
  );
  const [editSetTimeoutId, setEditSetTimeoutId] = useState<number | undefined>(undefined);
  const [showRefreshButton, setShowRefreshButton] = useState<boolean>(false);
  const [refreshButtonDisabled, setRefreshButtonDisabled] = useState<boolean>(true);
  const [checkFilterFreshness, setCheckFilterFreshness] = useState<boolean>(false);

  const translateFilter = (filterList: string[]) => {
    const result: number[] = [];
    filterList.forEach((val) => {
      const translatedNum = enumToNum.get(val);
      if (translatedNum) {
        result.push(translatedNum);
      }
    });
    return result;
  };

  // Translate states to request to send to AMA
  const buildFilterRequest = () => {
    const request: ListFilteredIdsRequestType = {};
    let filterExists = false;
    const campaignFilterText = requestedTextFilter.get(SummaryEntityType.ENTITY_TYPE_CAMPAIGN);
    if (campaignFilterText) {
      filterExists = true;
      request.campaign_filter = { text: campaignFilterText };
    }
    const adSetFilterText = requestedTextFilter.get(SummaryEntityType.ENTITY_TYPE_AD_SET);
    if (adSetFilterText) {
      filterExists = true;
      request.ad_set_filter = { text: adSetFilterText };
    }
    const adFilterText = requestedTextFilter.get(SummaryEntityType.ENTITY_TYPE_AD);
    if (adFilterText) {
      filterExists = true;
      request.ad_filter = { text: adFilterText };
    }
    const campaignCategoryFilters: CategoryFilter[] = [];
    const adSetCategoryFilters: CategoryFilter[] = [];
    const adCategoryFilters: CategoryFilter[] = [];
    requestedCategoryFilter.forEach((value, key) => {
      if (value.length) {
        filterExists = true;
        switch (key) {
          case 'objective':
          case 'payment_type':
            campaignCategoryFilters.push({ field: key, values: translateFilter(value) });
            break;
          case 'bid_type':
            adSetCategoryFilters.push({ field: key, values: translateFilter(value) });
            break;
          case 'ad_format':
            adCategoryFilters.push({ field: key, values: translateFilter(value) });
            break;
          default:
        }
      }
    });
    request.campaign_filter = {
      ...request.campaign_filter,
      category_filters: campaignCategoryFilters,
    };
    request.ad_set_filter = { ...request.ad_set_filter, category_filters: adSetCategoryFilters };
    request.ad_filter = { ...request.ad_filter, category_filters: adCategoryFilters };
    return { filterExists, request };
  };

  // Translate AMA filter response to entity ids
  const parseFilterResponse = (ids: string[], entityType: SummaryEntityType) => {
    const responseIds = new Set(ids);
    let campaignIds: Set<string> = new Set();
    let adSetIds: Set<string> = new Set();
    let adIds: Set<string> = new Set();
    switch (entityType) {
      case SummaryEntityType.ENTITY_TYPE_CAMPAIGN:
        adSetIds = new Set(
          adSets?.filter((adSet) => responseIds.has(adSet.campaign_id)).map((adSet) => adSet.id),
        );
        adIds = new Set(ads?.filter((ad) => responseIds.has(ad.campaign_id)).map((ad) => ad.id));
        return { adIds, adSetIds, campaignIds: responseIds };
      case SummaryEntityType.ENTITY_TYPE_AD_SET:
        campaignIds = new Set(
          adSets?.filter((adSet) => responseIds.has(adSet.id)).map((adSet) => adSet.campaign_id),
        );
        adIds = new Set(ads?.filter((ad) => responseIds.has(ad.ad_set_id)).map((ad) => ad.id));
        return { adIds, adSetIds: responseIds, campaignIds };
      case SummaryEntityType.ENTITY_TYPE_AD:
        campaignIds = new Set(
          ads?.filter((ad) => responseIds.has(ad.id)).map((ad) => ad.campaign_id),
        );
        adSetIds = new Set(ads?.filter((ad) => responseIds.has(ad.id)).map((ad) => ad.ad_set_id));
        return { adIds: responseIds, adSetIds, campaignIds };
      default:
        return { adIds, adSetIds, campaignIds };
    }
  };

  // Send filter request to AMA, showing loading
  const submitFilteringRequest = () => {
    const { filterExists, request } = buildFilterRequest();
    // Log filter submitted (including reset filters and pill delete)
    if (filterExists || filteredCampaignIds || filteredAdSetIds || filteredAdIds) {
      unifiedLogger.logClickEvent({
        eventName: EventName.FilterApplyClicked,
        parameters: {
          adAccountId: adAccountId || '',
          request: JSON.stringify(request) || '',
        },
      });
    }
    if (filterExists) {
      setFilterLoading(true);
      const getFilteredIdsResponse = getFilteredIds(request);
      getFilteredIdsResponse
        .then(({ entity_type, ids }) => {
          clearSelectedRows();
          setFilterLoadingError(false);
          setCurrentTextFilter(new Map(requestedTextFilter));
          setCurrentCategoryFilter(new Map(requestedCategoryFilter));
          const { adIds, adSetIds, campaignIds } = parseFilterResponse(ids, entity_type);
          setFilteredCampaignIds(campaignIds);
          setFilteredAdSetIds(adSetIds);
          setFilteredAdIds(adIds);
        })
        .catch((error) => {
          // Show error text
          setFilterLoadingError(true);
          // Log error
          unifiedLogger.logClickEvent({
            eventName: EventName.ListFilteredIdsError,
            parameters: {
              adAccountId: adAccountId || '',
              errorStatus: error.message,
              userInitiated: true.toString(),
            },
          });
        })
        .finally(() => setFilterLoading(false));
    } else {
      // No filters requested
      setFilteredCampaignIds(undefined);
      setFilteredAdSetIds(undefined);
      setFilteredAdIds(undefined);
      // Reset possible errors
      setFilterLoadingError(false);
      // Reset chips
      setCurrentTextFilter(new Map());
      setCurrentCategoryFilter(new Map());
    }
    // If refresh button is currently showing, any subsequent fresh request should stop it from showing
    if (!refreshButtonDisabled) {
      setShowRefreshButton(false);
      setRefreshButtonDisabled(true); // Reinstate initial
    }
  };

  const FilterRefreshButton = (
    <Tooltip
      placement='right'
      title={
        refreshButtonDisabled
          ? GetTooltipText('Filtering.RefreshButtonDisabled')
          : GetTooltipText('Filtering.RefreshButton')
      }>
      <span>
        <Button
          className={filterRefreshButton}
          color='secondary'
          disabled={refreshButtonDisabled}
          onClick={() => {
            submitFilteringRequest();
          }}
          size='medium'
          startIcon={
            refreshButtonDisabled ? (
              <CircularProgress
                className={filterLoadingCircularSpinner}
                color='secondary'
                size={16}
                sx={{
                  animation: 'circular-rotate 1.4s linear infinite',
                  animationDuration: '550ms',
                }}
              />
            ) : (
              <RefreshIcon fontSize='large' />
            )
          }>
          {refreshButtonDisabled ? '' : 'Refresh'}
        </Button>
      </span>
    </Tooltip>
  );

  if (refreshFilter !== FilterRefresh.FILTER_REFRESH_UNSPECIFIED) {
    switch (refreshFilter) {
      case FilterRefresh.FILTER_REFRESH_AFTER_EDIT:
        setShowRefreshButton(true);
        setRefreshButtonDisabled(true);
        if (editSetTimeoutId !== undefined) {
          clearTimeout(editSetTimeoutId);
        }
        setEditSetTimeoutId(window.setTimeout(() => setCheckFilterFreshness(true), 10000)); // Fetch 10 secs from most recent edit
        break;
      case FilterRefresh.FILTER_REFRESH_AFTER_DATE_FILTER:
        submitFilteringRequest();
        break;
      default:
    }
    setRefreshFilter(FilterRefresh.FILTER_REFRESH_UNSPECIFIED);
  }

  // Stop the spinner, fetch new results (secretly), compare with old, determine if refresh should be shown
  // useEffect lets us use the most recent states instead of the states at the time of setTimeout
  useEffect(() => {
    if (checkFilterFreshness) {
      const { filterExists, request } = buildFilterRequest();
      if (filterExists) {
        const getFilteredIdsResponse = getFilteredIds(request);
        getFilteredIdsResponse
          .then(({ entity_type, ids }) => {
            const { adIds, adSetIds, campaignIds } = parseFilterResponse(ids, entity_type);
            if (
              setsEqual(campaignIds, filteredCampaignIds) &&
              setsEqual(adSetIds, filteredAdSetIds) &&
              setsEqual(adIds, filteredAdIds)
            ) {
              setShowRefreshButton(false);
              setRefreshButtonDisabled(true); // Reinstate initial
            } else {
              setRefreshButtonDisabled(false);
            }
          })
          .catch((error) => {
            // If there's an error fetching new results, we'll prompt user to click refresh button
            setRefreshButtonDisabled(false);
            // Log error
            unifiedLogger.logClickEvent({
              eventName: EventName.ListFilteredIdsError,
              parameters: {
                adAccountId: adAccountId || '',
                errorStatus: error.message,
                userInitiated: false.toString(),
              },
            });
          });
      } else {
        // If no filter specified when this goes off, stop showing refresh button
        setShowRefreshButton(false);
        setRefreshButtonDisabled(true); // Reinstate initial
      }
      setCheckFilterFreshness(false);
    }
  }, [checkFilterFreshness]);

  // Submits filter request with requested filters change
  useEffect(() => {
    submitFilteringRequest();
  }, [requestedTextFilter, requestedCategoryFilter]);

  return (
    <>
      <FormControl error={filterLoadingError}>
        <FilterDrawerButton
          buttonLabel={getText('Action.FilterBy')}
          disabled={disabled}
          drawerTitle={getText('Description.FilterDrawer.FilterByCategory')}
          filterDrawerContent={
            <FilterBody
              currentCategoryFilter={currentCategoryFilter}
              currentTextFilter={currentTextFilter}
              requestedCategoryFilter={requestedCategoryFilter}
              requestedTextFilter={requestedTextFilter}
              setRequestedCategoryFilter={setRequestedCategoryFilter}
              setRequestedTextFilter={setRequestedTextFilter}
            />
          }
          getDrawerContainer={() => null}
        />
        {filterLoadingError && <FormHelperText>Error fetching data.</FormHelperText>}
      </FormControl>
      {(currentTextFilter.size > 0 || currentCategoryFilter.size > 0) &&
        showRefreshButton &&
        FilterRefreshButton}
      {(currentTextFilter.size > 0 || currentCategoryFilter.size > 0) && ( // This condition should include all filter state vars
        <FilterPills
          currentCategoryFilter={currentCategoryFilter}
          currentTextFilter={currentTextFilter}
          disabled={disabled}
          setRequestedCategoryFilter={setRequestedCategoryFilter}
          setRequestedTextFilter={setRequestedTextFilter}
        />
      )}
    </>
  );
};
