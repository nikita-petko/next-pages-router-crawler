/* oxlint-disable unicorn/prefer-string-slice -- pre-existing pattern in this file. */
/* oxlint-disable typescript-eslint/no-non-null-assertion -- pre-existing pattern in this file; non-`null` ids are guaranteed by the table data pipeline. */
/* oxlint-disable typescript-eslint/no-floating-promises -- pre-existing pattern in this file; existing async work is fire-and-forget by design. */
/* oxlint-disable typescript-eslint/no-unsafe-type-assertion -- pre-existing pattern in this file; widening assertions are intentional for the foundation-ui table column wiring. */
/* oxlint-disable typescript-eslint/no-unsafe-enum-comparison -- pre-existing pattern in this file; entity-type / column-key comparisons are validated upstream. */
/* oxlint-disable typescript-eslint/no-unsafe-assignment -- pre-existing pattern in this file. */
/* oxlint-disable typescript-eslint/consistent-return -- pre-existing pattern in this file. */
/* oxlint-disable typescript-eslint/prefer-nullish-coalescing -- pre-existing pattern in this file. */
/* oxlint-disable typescript-eslint/restrict-template-expressions -- pre-existing pattern in this file. */
import type { FunctionComponent, ReactElement } from 'react';
import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { captureMessage } from '@sentry/nextjs';
import { useFormContext, useWatch } from 'react-hook-form';
import type {
  RobloxApiDevelopAssetModel,
  RobloxApiDevelopModelsUniverseModel,
} from '@rbx/client-develop/v1';
import {
  V1UserUniversesGetLimitEnum,
  V1UserUniversesGetSortOrderEnum,
} from '@rbx/client-develop/v1';
import type { RobloxMarketplaceFiatSharedV1Beta1Money as Money } from '@rbx/client-marketplace-fiat-service/v1';
import type {
  AssetConfiguration,
  BundleConfiguration,
  UniverseConfiguration,
} from '@rbx/client-resource-settings-api/v1';
import { useTranslation } from '@rbx/intl';
import {
  TableContainer,
  CircularProgress,
  useSnackbar,
  Alert,
  IconButton,
  CloseIcon,
} from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import GenericTableV2 from '@modules/charts-generic/tables/GenericTableV2';
import type { TableColumnConfig } from '@modules/charts-generic/tables/types/GenericColumnType';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { CellDataType } from '@modules/charts-generic/tables/types/GenericTableType';
import marketplaceFiatService from '@modules/clients/creatorStoreProduct/marketplaceFiatService';
import developClient from '@modules/clients/develop';
import itemConfigurationClient from '@modules/clients/itemconfiguration';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { DataSharingLicenseType } from '@modules/clients/resourceSettings';
import { Audience, isPrivateAudience } from '@modules/creations/common/audiences';
import getBundleTypeToBundleTypeString from '@modules/creations/unifiedFeeSystem/helper/unifiedFeeSystemBundleMapping';
import { translateAssetType } from '@modules/creations/unifiedFeeSystem/helper/UnifiedFeeSystemHelper';
import { assetToProduct } from '@modules/marketplaceFiatService/MarketplaceFiatServiceProvider';
import { Asset } from '@modules/miscellaneous/common';
import { EmptyGrid } from '@modules/miscellaneous/components';
import useIXPParameters from '@modules/miscellaneous/hooks/useIXPParameters';
import DataSharingTabKey from '../enums/DataSharingTabKey';
import {
  getAllOwnedGroups,
  getAssetConfigurations,
  getAvatarAssetConfigurations,
  getBundleConfigurations,
  getGroupExperiencesV2,
  getUniverseConfigurations,
  getUserExperiencesV2,
} from '../utils/apiUtils';
import { DataSharingEntityType, getFormRowKey, splitFormKey } from '../utils/formDiffUtils';
import DataSharingEmptyState from './DataSharingEmptyState';
import AssetsHeader from './headers/AssetsHeader';
import AvatarItemsHeader, { BundleTypeOption } from './headers/AvatarItemsHeader';
import ExperiencesHeader from './headers/ExperiencesHeader';
import type {
  ExperiencesTableColumnKey,
  AvatarTableColumnKey,
  AssetTableColumnKey,
  AvatarTableRow,
  EntityTableRow,
  ExperiencesTableRow,
  AssetTableRow,
} from './SettingsTableConfig';
import { SettingsTableConfig } from './SettingsTableConfig';

function getNumberForMarketplaceMoney(money?: Money): number {
  if (!money?.quantity?.exponent || !money?.quantity?.significand) {
    return 0;
  }
  const result = money.quantity.significand * 10 ** money.quantity.exponent;
  return Number(result.toFixed(2));
}

interface SettingsV2Props {
  columnHeaders: TableColumnConfig<
    ExperiencesTableColumnKey | AvatarTableColumnKey | AssetTableColumnKey
  >[];
  currentTab: DataSharingTabKey;
  initialValuesRef: React.RefObject<Record<string, boolean>>;
  setInitialValues: (initialValues: Record<string, boolean>) => void;
  resetKey: number;
}

type TQueryResult = {
  data: EntityTableRow[];
  nextPageCursor: string | undefined;
};

type TPageCache = {
  [key: number]: { data: Array<Map<string, CellDataType>>; nextPageCursor?: string };
};

type TFetchedCache = {
  [key: number]: { data: EntityTableRow[]; nextPageCursor?: string };
};

const SettingsV2: FunctionComponent<SettingsV2Props> = ({
  columnHeaders,
  currentTab,
  initialValuesRef,
  setInitialValues,
  resetKey,
}) => {
  const { setValue, getValues } = useFormContext();
  const [groups, setGroups] = useState<{ id: number; name: string }[]>([]);
  const [pageSize, setPageSize] = useState<V1UserUniversesGetLimitEnum>(
    V1UserUniversesGetLimitEnum.NUMBER_10,
  );
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(0);
  const [nextPagePointer, setNextPagePointer] = useState<string | undefined>(undefined);
  const [rowData, setRowData] = useState<Array<Map<string, CellDataType>>>([]);
  const [fetchedDataCache, setFetchedDataCache] = useState<TFetchedCache>({});
  const [fetchedDataCacheTab, setFetchedDataCacheTab] = useState<DataSharingTabKey | null>(null);
  const rowDataRef = useRef(rowData);
  const [dataLoadedForTab, setDataLoadedForTab] = useState<DataSharingTabKey | null>(null);
  const [tabLoadedIntoCache, setTabLoadedIntoCache] = useState<DataSharingTabKey | null>(null);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [selectAllIndeterminate, setSelectAllIndeterminate] = useState(false);
  const [itemType, setItemType] = useState<BundleTypeOption | Asset | undefined>(undefined);
  const [assetType, setAssetType] = useState<Asset>(Asset.Model);
  const [cache, setCache] = useState<TPageCache>({});
  const { user } = useAuthentication();
  const { control } = useFormContext();
  const { enqueue, close } = useSnackbar();
  const { translate } = useTranslation();
  const {
    params: { enableAudiencesReplacement },
  } = useIXPParameters(IXPLayers.CreatorHubCreationsPermission);
  const audiencesReplacementOn = enableAudiencesReplacement === true;
  const derivePlayabilityLabel = useCallback(
    (experience: RobloxApiDevelopModelsUniverseModel): string => {
      if (audiencesReplacementOn) {
        const { audiences } = experience;
        if (!audiences) {
          return 'unknown';
        }
        if (audiences.includes(Audience.Public)) {
          return 'Public';
        }
        if (isPrivateAudience(audiences)) {
          return 'Private';
        }
        return 'Limited';
      }
      return experience.privacyType ?? 'unknown';
    },
    [audiencesReplacementOn],
  );

  const formData = useWatch({
    control,
  });

  const fetchOwnedGroups = useCallback(async () => {
    if (!user) {
      return;
    }
    const ownedGroups = await getAllOwnedGroups(user.id);
    setGroups(ownedGroups);
  }, [user]);

  useEffect(() => {
    fetchOwnedGroups();
  }, [fetchOwnedGroups]);

  const selectedGroupId = useMemo(() => {
    if (selectedGroup?.startsWith('user')) {
      return;
    }
    const id = Number(selectedGroup?.substring(selectedGroup?.indexOf('-')));
    return Number.isNaN(id) ? undefined : id;
  }, [selectedGroup]);

  const fetchAvatarItems = useCallback(
    async (nextPageCursorParam?: string): Promise<TQueryResult> => {
      if (itemType === undefined) {
        return { data: [], nextPageCursor: undefined };
      }

      const isBundle = itemType in BundleTypeOption;

      const { items, nextCursor } = await itemConfigurationClient.getItemsByCreator(
        pageSize,
        nextPageCursorParam,
        selectedGroupId,
        isBundle ? getBundleTypeToBundleTypeString(itemType) : undefined,
        isBundle ? undefined : translateAssetType(itemType as Asset),
      );
      const nextPageCursorValid = !!nextCursor;

      const itemsWithIds = items?.filter((item) => item.id !== undefined) ?? [];
      const itemIds = itemsWithIds?.map((item) => Number(item.id!));

      const itemConfigurations = await (isBundle
        ? getBundleConfigurations(itemIds)
        : getAvatarAssetConfigurations(itemIds));
      const itemConfigurationLookup = itemConfigurations.reduce(
        (acc: Record<number, AssetConfiguration | BundleConfiguration>, configuration) => {
          if ('assetId' in configuration) {
            acc[configuration.assetId] = configuration;
          }
          if ('bundleId' in configuration) {
            acc[configuration.bundleId] = configuration;
          }
          return acc;
        },
        {},
      );

      const tableRows = itemsWithIds
        .map((item): AvatarTableRow | undefined => {
          const itemId = Number(item.id!);
          const itemConfig = itemConfigurationLookup[itemId];
          return {
            Name: item.name ?? 'unknown',
            CreatedDate: itemConfig?.updatedUtc
              ? new Date(itemConfig.updatedUtc).toLocaleString()
              : 'unknown',
            Price: item.price ?? 0,
            license: itemConfig?.dataSharingLicenseTypes ?? [],
            selected:
              itemConfig?.dataSharingLicenseTypes?.includes(DataSharingLicenseType.RobloxGlobal) ||
              false,
            id: itemId,
            entityType: isBundle
              ? DataSharingEntityType.AvatarBundle
              : DataSharingEntityType.AvatarAsset,
          };
        })
        .filter((row) => row !== undefined);

      return {
        data: tableRows,
        nextPageCursor: nextPageCursorValid ? nextCursor : undefined,
      };
    },
    [itemType, pageSize, selectedGroupId],
  );

  const fetchExperiences = useCallback(
    async (nextPageCursorParam?: string): Promise<TQueryResult> => {
      const idToQuery = selectedGroup ?? `user-${user!.id}`;
      if (selectedGroup === null) {
        setSelectedGroup(`user-${user!.id}`);
      }
      let fetchResult: RobloxApiDevelopModelsUniverseModel[];
      let nextPageCursor: string | undefined;

      if (idToQuery === `user-${user!.id}`) {
        const response = await getUserExperiencesV2(
          V1UserUniversesGetSortOrderEnum.Desc,
          pageSize,
          nextPageCursorParam,
        );
        fetchResult = response.data;
        nextPageCursor = response.nextPageCursor;
      } else {
        const response = await getGroupExperiencesV2(
          parseInt(idToQuery.split('-')[1], 10),
          V1UserUniversesGetSortOrderEnum.Desc,
          pageSize,
          nextPageCursorParam,
        );
        fetchResult = response.data;
        nextPageCursor = response.nextPageCursor;
      }
      const experiencesWithIds = fetchResult.filter((experience) => experience.id !== undefined);

      const experienceIds = experiencesWithIds.map((experience) => experience.id as number);

      const configurations = await getUniverseConfigurations(experienceIds);
      const settingsMap = configurations.reduce(
        (acc: Record<number, UniverseConfiguration>, setting) => {
          acc[setting.universeId] = setting;
          return acc;
        },
        {},
      );

      return {
        data: experiencesWithIds.map(
          (experience): ExperiencesTableRow => ({
            Name: experience.name ?? 'unknown',
            Playability: derivePlayabilityLabel(experience),
            LastUpdatedDate: experience.updated
              ? new Date(experience.updated).toLocaleString()
              : 'unknown',
            license: settingsMap[experience.id!]?.dataSharingLicenseTypes || [],
            selected:
              currentTab === DataSharingTabKey.ExperienceSettings
                ? settingsMap[experience.id!]?.dataSharingLicenseTypes.includes(
                    DataSharingLicenseType.RobloxGlobal,
                  ) || false
                : settingsMap[experience.id!]?.dataSharingLicenseTypes.includes(
                    DataSharingLicenseType.Public,
                  ) || false,
            id: experience.id!,
            entityType:
              currentTab === DataSharingTabKey.ExperienceSettings
                ? DataSharingEntityType.Experience
                : DataSharingEntityType.LuauDataset,
          }),
        ),
        nextPageCursor,
      };
    },
    [currentTab, pageSize, selectedGroup, user, derivePlayabilityLabel],
  );

  const fetchMarketplaceAssets = useCallback(
    async (nextPageCursorParam?: string): Promise<TQueryResult> => {
      const { pageInfo, fiatProducts } = await marketplaceFiatService.getSellerFiatProducts(
        assetToProduct(assetType),
        false,
        true,
        true,
        pageSize,
        nextPageCursorParam,
      );
      const pricedAssetIds =
        fiatProducts?.flatMap((product) => {
          const parsedAssetId = parseInt(product.productKey?.productTargetId ?? '', 10);
          return Number.isNaN(parsedAssetId) ? [] : parsedAssetId;
        }) ?? [];
      if (pricedAssetIds.length === 0) {
        return {
          data: [],
          nextPageCursor: undefined,
        };
      }

      const priceLookup =
        fiatProducts?.reduce((acc: Record<number, Money>, fiatProduct) => {
          if (fiatProduct.price) {
            acc[parseInt(fiatProduct.productKey?.productTargetId ?? '', 10)] = fiatProduct.price;
          }
          return acc;
        }, {}) ?? {};

      const assetConfigurations = await getAssetConfigurations(pricedAssetIds);
      const assetConfigurationLookup = assetConfigurations.reduce(
        (acc: Record<number, AssetConfiguration>, configuration) => {
          acc[configuration.assetId] = configuration;
          return acc;
        },
        {},
      );

      const developerItemDetails = await developClient.getAssetDetails(pricedAssetIds);
      const developerItemDetailsLookup =
        developerItemDetails.data?.reduce(
          (acc: Record<number, RobloxApiDevelopAssetModel>, item) => {
            if (item.id) {
              acc[item.id] = item;
            }
            return acc;
          },
          {},
        ) ?? {};

      return {
        data: pricedAssetIds.map(
          (assetId): AssetTableRow => ({
            Name: developerItemDetailsLookup[assetId]?.name ?? 'unknown',
            LastUpdatedDate: developerItemDetailsLookup[assetId]?.updated
              ? new Date(developerItemDetailsLookup[assetId]?.updated).toLocaleString()
              : 'unknown',
            Price: getNumberForMarketplaceMoney(priceLookup[assetId]),
            license: assetConfigurationLookup[assetId]?.dataSharingLicenseTypes || [],
            selected:
              assetConfigurationLookup[assetId]?.dataSharingLicenseTypes.includes(
                DataSharingLicenseType.RobloxGlobal,
              ) || false,
            id: assetId,
            entityType: DataSharingEntityType.CreatorStoreAsset,
          }),
        ),
        nextPageCursor: pageInfo?.hasMore ? pageInfo?.nextCursor || undefined : undefined,
      };
    },
    [pageSize, assetType],
  );

  const updateSelectAllState = useCallback(() => {
    const values = getValues();
    const currentRowCells = rowDataRef.current.map((row) => row.get('id'));
    const currentEntityType = fetchedDataCache[pageNumber]?.data?.at(0)?.entityType;
    const keys = Object.keys(values).filter((key) => {
      const [entityType, id] = splitFormKey(key);
      return (
        entityType === currentEntityType &&
        currentRowCells.some((cell) => cell?.type === ColumnType.Text && cell.value === id)
      );
    });
    const allChecked = keys.every((key) => values[key] === true);
    const someChecked = keys.some((key) => values[key] === true);

    setSelectAllChecked(allChecked);
    setSelectAllIndeterminate(!allChecked && someChecked);
  }, [getValues, rowDataRef, fetchedDataCache, pageNumber]);

  const displayLoadingError = useCallback(() => {
    enqueue({
      children: (
        <Alert
          severity='error'
          variant='filled'
          action={
            <IconButton aria-label='close' onClick={close} color='inherit' size='small'>
              <CloseIcon />
            </IconButton>
          }>
          {translate('Messsage.LoadError')}
        </Alert>
      ),
    });
  }, [enqueue, close, translate]);

  const initializeDataForTab = useCallback(
    async (page: number, pagePointer?: string) => {
      setDataLoadedForTab(null);
      let result: TQueryResult;
      try {
        switch (currentTab) {
          case DataSharingTabKey.ExperienceSettings:
          case DataSharingTabKey.LuauDataset:
            result = await fetchExperiences(pagePointer);
            break;
          case DataSharingTabKey.AvatarItems:
            result = await fetchAvatarItems(pagePointer);
            break;
          case DataSharingTabKey.CreatorStoreAssets:
            result = await fetchMarketplaceAssets(pagePointer);
            break;
          default: {
            const exhaustiveCheck: never = currentTab;
            throw new Error(`Unknown DataSharingTabKey for ${exhaustiveCheck}`);
          }
        }
        const { data: fetchedData, nextPageCursor: newNextPageCursor } = result;
        const initialValues: Record<string, boolean> = { ...initialValuesRef.current };
        fetchedData.forEach((row) => {
          const experienceKey = getFormRowKey(DataSharingEntityType.Experience, row.id);
          const luauDatasetKey = getFormRowKey(DataSharingEntityType.LuauDataset, row.id);
          const currentKey = getFormRowKey(row.entityType, row.id);

          if (!(currentKey in initialValues)) {
            initialValues[currentKey] = row.selected;
          }

          if (currentTab === DataSharingTabKey.ExperienceSettings) {
            const optedIn = row.license.includes(DataSharingLicenseType.Public);
            if (!(luauDatasetKey in initialValues)) {
              initialValues[luauDatasetKey] = optedIn;
            }
          }

          if (currentTab === DataSharingTabKey.LuauDataset) {
            const optedIn = row.license.includes(DataSharingLicenseType.RobloxGlobal);
            if (!(experienceKey in initialValues)) {
              initialValues[experienceKey] = optedIn;
            }
          }
        });

        setInitialValues(initialValues);
        setFetchedDataCache((prevFetchedDataCache) => ({
          ...prevFetchedDataCache,
          [page]: { data: fetchedData, nextPageCursor: newNextPageCursor },
        })); // Save fetched data for generating rows separately
        setFetchedDataCacheTab(currentTab);
      } catch {
        displayLoadingError();
        setFetchedDataCache((prevFetchedDataCache) => ({
          ...prevFetchedDataCache,
          [page]: { data: [], nextPageCursor: undefined },
        }));
        setFetchedDataCacheTab(currentTab);
        captureMessage(`Failed to fetch data for tab ${currentTab}`);
      } finally {
        setPageNumber(page);
      }
    },
    [
      currentTab,
      fetchAvatarItems,
      fetchExperiences,
      fetchMarketplaceAssets,
      setInitialValues,
      initialValuesRef,
      displayLoadingError,
    ],
  );
  const fetchAllRef = useRef(initializeDataForTab);

  const generateRowData = useCallback((): Array<Map<string, CellDataType>> => {
    if (!fetchedDataCache[pageNumber]) {
      return [];
    }

    const syncFormDataWithFetchedData = (fetchedDataFromCache: EntityTableRow[]) => {
      fetchedDataFromCache.forEach((row) => {
        const rowKey = getFormRowKey(row.entityType, row.id);
        if (!(rowKey in formData)) {
          setValue(rowKey, row.selected, { shouldDirty: false });
        }
      });
    };
    syncFormDataWithFetchedData(fetchedDataCache[pageNumber].data);
    return fetchedDataCache[pageNumber].data.map((row) => {
      const formRowKey = getFormRowKey(row.entityType, row.id);
      return new Map<string, CellDataType>([
        ...Object.entries(row).map(([key, value]) => {
          const isNumericColumn = key === 'Price';
          return [
            key,
            isNumericColumn
              ? { type: ColumnType.Number, value: value as number }
              : {
                  type: ColumnType.Text,
                  value: Array.isArray(value) ? value.join(', ') : value.toString(),
                },
          ] as [string, CellDataType];
        }),
        [
          'selected',
          {
            type: ColumnType.Selection,
            rowKey: formRowKey,
            checked: getValues()[formRowKey],
            onChange: (rowKey: string, isChecked: boolean) => {
              setValue(formRowKey, isChecked, { shouldDirty: true });
              updateSelectAllState();
            },
          },
        ] as [string, CellDataType],
      ]);
    });
  }, [fetchedDataCache, formData, setValue, getValues, pageNumber, updateSelectAllState]);

  useEffect(() => {
    setTabLoadedIntoCache(null);
    setFetchedDataCache({});
    setCache({});
    fetchAllRef.current = initializeDataForTab;
    initializeDataForTab(0);
  }, [initializeDataForTab]);

  useEffect(() => {
    if (fetchedDataCacheTab !== currentTab) {
      return;
    }
    const rowDataVal = generateRowData();
    setCache((prevCache) => ({
      ...prevCache,
      [pageNumber]: {
        data: rowDataVal,
        nextPageCursor: fetchedDataCache[pageNumber]?.nextPageCursor,
      },
    }));
    setTabLoadedIntoCache(currentTab);
  }, [generateRowData, pageNumber, currentTab, fetchedDataCache, fetchedDataCacheTab]);

  useEffect(() => {
    if (tabLoadedIntoCache !== currentTab) {
      return;
    }
    if (cache[pageNumber]) {
      setRowData(cache[pageNumber].data);
      rowDataRef.current = cache[pageNumber].data;
      setNextPagePointer(cache[pageNumber].nextPageCursor);
      setDataLoadedForTab(currentTab);
    } else if (cache[pageNumber - 1]?.nextPageCursor) {
      fetchAllRef.current(pageNumber, cache[pageNumber - 1].nextPageCursor);
    }
  }, [pageNumber, cache, currentTab, tabLoadedIntoCache]);

  useEffect(() => {
    updateSelectAllState();
  }, [updateSelectAllState, resetKey, rowData]);

  const handleSelectAllChange = useCallback(
    async (checked: boolean) => {
      setSelectAllChecked(checked);
      setSelectAllIndeterminate(false);

      const values = getValues();
      const currentRowCells = rowDataRef.current.map((row) => row.get('id'));
      const currentEntityType = fetchedDataCache[pageNumber].data?.at(0)?.entityType;
      const keys = Object.keys(values).filter((key) => {
        const [entityType, id] = splitFormKey(key);
        return (
          entityType === currentEntityType &&
          currentRowCells.some((cell) => cell?.type === ColumnType.Text && cell.value === id)
        );
      });

      keys.forEach((key) => setValue(key, checked, { shouldDirty: true }));
    },
    [rowDataRef, getValues, setValue, fetchedDataCache, pageNumber],
  );

  const handleNextPage = async () => {
    if (nextPagePointer) {
      setPageNumber((prevPageNumber) => prevPageNumber + 1);
    }
  };

  const handlePreviousPage = () => {
    if (pageNumber > 0) {
      setPageNumber((prevPageNumber) => prevPageNumber - 1);
    }
  };

  const columnConfigs = useMemo(
    () =>
      columnHeaders.map((config) => {
        if (config.columnKey !== 'selected') {
          return config;
        }
        return {
          ...config,
          columnType: ColumnType.Selection,
          selection: {
            headerCellSelectionData: {
              rowKey: 'selected',
              checked: selectAllChecked,
              indeterminate: selectAllIndeterminate,
              onChange: (rowKey: string, isChecked: boolean) => {
                handleSelectAllChange(isChecked);
              },
            },
          },
        };
      }) as TableColumnConfig<string>[],
    [columnHeaders, selectAllChecked, selectAllIndeterminate, handleSelectAllChange],
  );

  const pageSizeOptions =
    currentTab === DataSharingTabKey.AvatarItems
      ? [V1UserUniversesGetLimitEnum.NUMBER_10, V1UserUniversesGetLimitEnum.NUMBER_25]
      : [
          V1UserUniversesGetLimitEnum.NUMBER_10,
          V1UserUniversesGetLimitEnum.NUMBER_25,
          V1UserUniversesGetLimitEnum.NUMBER_50,
          V1UserUniversesGetLimitEnum.NUMBER_100,
        ];
  const pagination = {
    page: pageNumber,
    total: -1,
    pageSize: pageSizeOptions.includes(pageSize) ? pageSize : pageSizeOptions[0],
    pageSizeOptions,
    setPageSize: (newPageSize: number) => {
      setPageSize(newPageSize as V1UserUniversesGetLimitEnum);
    },
    onNextPage: handleNextPage,
    onPreviousPage: handlePreviousPage,
    hasNext: nextPagePointer !== undefined,
    hasPrevious: pageNumber > 0,
  };
  if (pagination.pageSize !== pageSize) {
    setPageSize(pagination.pageSize);
  }

  if (user === null) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  let renderedTableView: ReactElement;
  if (dataLoadedForTab === currentTab) {
    renderedTableView =
      rowData.length > 0 ? (
        <TableContainer>
          <GenericTableV2
            rowData={rowData}
            columnConfigs={columnConfigs}
            tableConfig={SettingsTableConfig}
            pagination={pagination}
            isDataLoading={false}
            isResponseFailed={false}
            isUserForbidden={false}
          />
        </TableContainer>
      ) : (
        <DataSharingEmptyState tab={currentTab} />
      );
  } else {
    renderedTableView = (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  return (
    <>
      {(currentTab === DataSharingTabKey.ExperienceSettings ||
        currentTab === DataSharingTabKey.LuauDataset) && (
        <ExperiencesHeader
          groups={groups}
          user={user}
          onGroupChange={setSelectedGroup}
          isPublic={currentTab === DataSharingTabKey.LuauDataset}
        />
      )}
      {currentTab === DataSharingTabKey.AvatarItems && (
        <AvatarItemsHeader
          itemType={itemType}
          setItemType={setItemType}
          user={user}
          groups={groups}
          onGroupChange={setSelectedGroup}
        />
      )}
      {currentTab === DataSharingTabKey.CreatorStoreAssets && (
        <AssetsHeader assetType={assetType} setAssetType={setAssetType} />
      )}
      {renderedTableView}
    </>
  );
};

export default SettingsV2;
