import { catalogClient } from '@modules/clients';
import marketplaceSalesApi from '@modules/clients/marketplacesales';
import {
  CreationData,
  ItemCardContainer,
  ItemGridContainer,
  ItemGridEmptyView,
} from '@modules/creations/common';
import { Item, itemTypeToLearnMoreUrl, toastDurationTime } from '@modules/miscellaneous/common';
import { Key, PageResponse } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import {
  Alert,
  CancelIcon,
  Grid,
  InputAdornment,
  Link,
  SearchIcon,
  Snackbar,
  TextField,
  Typography,
} from '@rbx/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { creationsMenuManager } from '@modules/creations/menu';
import { RobloxCatalogApiCatalogSearchDetailedResponseItem } from '@rbx/clients/catalogApi';
import { getResponseFromError } from '@modules/clients/utils';
import UniverseProductConfigurationError from '../../common/enums/UniverseProductConfigurationErrorCode';
import UniverseProductConfigurationStatus from '../../common/enums/UniverseProductConfigurationStatus';
import { AssociatedItemsGridPagingParameters } from '../../common/interfaces/AssociatedItemsGridPagingParameters';
import ItemGrid from '../../common/components/ItemGrid';
import useAssociatedItemsSearchContainerStyles from './AssociatedItemsSearchContainer.style';

export interface AssociatedItemsSearchContainerProps {
  hasData: boolean;
  universeId: number;
  pagingParameters: AssociatedItemsGridPagingParameters;
  itemType: Item;
  loadAssociatedItems: (
    pagingParameters: AssociatedItemsGridPagingParameters,
  ) => Promise<PageResponse<CreationData>>;
  onLoad: (data: CreationData[]) => void;
}

const AssociatedItemsSearchContainer = ({
  hasData,
  universeId,
  pagingParameters,
  itemType,
  loadAssociatedItems,
  onLoad,
}: AssociatedItemsSearchContainerProps) => {
  const { translate, translateHTML } = useTranslation();
  const {
    classes: { searchAssetTextField, clearSearchIcon },
  } = useAssociatedItemsSearchContainerStyles();
  const [searchBoxValue, setSearchBoxValue] = useState<string>('');
  const [searchResultItem, setSearchResultItem] = useState<CreationData | undefined>();
  const [isSearching, setIsSearching] = useState(false);
  const [errorState, setErrorState] = useState<UniverseProductConfigurationError | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<
    { success: boolean; enabled?: boolean; error?: UniverseProductConfigurationError } | undefined
  >();

  useEffect(() => {
    setIsSearching(searchBoxValue.trim() !== '');
  }, [searchBoxValue]);

  const onEnabledItemsLoad = useCallback((data: CreationData[]) => {
    onLoad(data);
    if (data.length === 0) {
      setErrorState(UniverseProductConfigurationError.NoItemsEnabled);
    } else {
      setErrorState(undefined);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps -- NOTE (jcountryman, 6/10/24): Turned off to check in text field consolidation work. Codeowners is
     * responsible for triaging issue.
     */
  }, []);

  const handleSearch = useCallback(
    async (value: string) => {
      setIsLoading(true);
      const assetIdToSearch = +value;

      let item: RobloxCatalogApiCatalogSearchDetailedResponseItem;
      try {
        const { data } = await catalogClient.getAssetDetails(assetIdToSearch);

        if (data?.length !== 1 || !data[0].collectibleItemId) {
          throw new Response(undefined, { status: 406 });
        }
        [item] = data;
      } catch (error) {
        const response = getResponseFromError(error);
        if (response?.status === 406) {
          // not acceptable
          setErrorState(UniverseProductConfigurationError.InvalidTargetId);
        } else {
          setErrorState(UniverseProductConfigurationError.Unknown);
        }
        setSearchResultItem(undefined);
        setIsLoading(false);
        return;
      }

      try {
        const { _configuration: universeProductConfig } =
          await marketplaceSalesApi.getUniverseProductConfiguration(universeId, assetIdToSearch);
        setSearchResultItem({
          itemType: Item.CatalogAsset,
          collectibleItemId: universeProductConfig?.collectibleItemId ?? undefined,
          collectibleProductId: universeProductConfig?.collectibleProductId ?? undefined,
          assetId: item.id,
          name: item.name,
          price: item.price,
          creatorName: item.creatorName,
          universeProductConfigEnabled:
            universeProductConfig?.status === UniverseProductConfigurationStatus.Enabled,
          isLimited2: true,
          isClickable: false,
        });
        setErrorState(undefined);
        setIsLoading(false);
      } catch (error) {
        const response = getResponseFromError(error);
        if (response?.status === 400) {
          // Invalid target Id.
          setErrorState(UniverseProductConfigurationError.InvalidTargetId);
        } else if (response?.status === 412) {
          // Mismatch product and experience configurations.
          setErrorState(UniverseProductConfigurationError.ConfigMismatch);
        } else {
          setErrorState(UniverseProductConfigurationError.Unknown);
        }
        setSearchResultItem(undefined);
        setIsLoading(false);
      }
    },
    [universeId],
  );

  const searchBoxValueChanged = useCallback((event: React.ChangeEvent) => {
    const { value } = event.target as HTMLInputElement;
    setSearchBoxValue(value);
  }, []);

  const searchBoxKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === Key.Enter) {
        handleSearch((event.target as HTMLInputElement).value);
      }
    },
    [handleSearch],
  );

  const toggleEnableItem = useCallback(
    async (item: CreationData, enable: boolean) => {
      try {
        await marketplaceSalesApi.updateUniverseProductConfiguration(
          universeId,
          +(item.assetId ?? 0),
          enable
            ? UniverseProductConfigurationStatus.Enabled
            : UniverseProductConfigurationStatus.Disabled,
          item.collectibleItemId ?? '',
          item.collectibleProductId ?? '',
        );
        setUpdateStatus({ success: true, enabled: enable });
        if (isSearching) {
          handleSearch((item.assetId ?? '').toString());
        }
        return true;
      } catch (error) {
        const response = getResponseFromError(error);
        if (response?.status === 412) {
          setUpdateStatus({
            success: false,
            error: UniverseProductConfigurationError.ConfigMismatch,
          });
        } else {
          setUpdateStatus({ success: false, error: UniverseProductConfigurationError.Unknown });
        }
        return false;
      }
    },
    /* eslint-disable-next-line react-hooks/exhaustive-deps -- NOTE (jcountryman, 6/10/24): Turned off to check in text field consolidation work. Codeowners is
     * responsible for triaging issue.
     */
    [isSearching, universeId],
  );

  const itemsEnabledHeader = useMemo(() => {
    return (
      !isSearching &&
      hasData && (
        <Grid container item XSmall={12}>
          <Typography data-testid='itemsEnabledHeader' variant='h2'>
            {translate('Heading.ItemsEnabled')}
          </Typography>
        </Grid>
      )
    );
  }, [isSearching, hasData, translate]);

  const itemsEnabledSection = useMemo(() => {
    return (
      !isSearching && (
        <ItemGridContainer
          pagingParameters={pagingParameters}
          loadItems={loadAssociatedItems}
          getItemKey={(item) => item.assetId ?? 0}
          GridItemComponent={ItemCardContainer}
          errorMessage={translate('Message.LoadItemsError', {
            itemType: translate(creationsMenuManager.getItemFullNameKey(itemType)),
          })}
          onLoad={onEnabledItemsLoad}
          emptyMessage={null}
          toggleEnableItem={toggleEnableItem}
        />
      )
    );
    /* eslint-disable-next-line react-hooks/exhaustive-deps -- NOTE (jcountryman, 6/10/24): Turned off to check in text field consolidation work. Codeowners is
     * responsible for triaging issue.
     */
  }, [
    isSearching,
    pagingParameters,
    loadAssociatedItems,
    translate,
    itemType,
    onEnabledItemsLoad,
    toggleEnableItem,
  ]);

  const emptyStateGrid = useMemo(() => {
    let itemDescription;
    let emptyMessageKey;
    switch (errorState) {
      case UniverseProductConfigurationError.NoItemsEnabled:
        emptyMessageKey = 'Message.EmptyMessageForEnabledItems';
        itemDescription = translateHTML('Message.EmptyMessageForEnabledItemsWithLink', [
          {
            opening: 'LinkStart',
            closing: 'LinkEnd',
            content(chunks) {
              return (
                <Link href={itemTypeToLearnMoreUrl[itemType]} target='_blank'>
                  {chunks}
                </Link>
              );
            },
          },
        ]);
        break;
      case UniverseProductConfigurationError.InvalidTargetId:
        emptyMessageKey = 'Message.ItemNotFound';
        itemDescription = translate('Message.SearchMessagesInvalidItem');
        break;
      case UniverseProductConfigurationError.ConfigMismatch:
        emptyMessageKey = 'Message.ItemNotFound';
        itemDescription = translateHTML('Message.EmptyMessageForSearch', [
          {
            opening: 'LinkStart',
            closing: 'LinkEnd',
            content(chunks) {
              return (
                <Link href={itemTypeToLearnMoreUrl[itemType]} target='_blank'>
                  {chunks}
                </Link>
              );
            },
          },
        ]);
        break;
      default:
        emptyMessageKey = 'Error.Unknown';
        itemDescription = '';
    }

    return (
      <ItemGridEmptyView
        emptyMessage={translate(emptyMessageKey)}
        itemDescription={itemDescription}
      />
    );
  }, [itemType, errorState, translate, translateHTML]);

  const toggleEnableResultAlert = useMemo(() => {
    let alertMessage: string;
    if (updateStatus?.success && updateStatus?.enabled) {
      alertMessage = translate('Message.ItemSaleEnabled');
    } else if (updateStatus?.success) {
      alertMessage = translate('Message.ItemSaleDisabled');
    } else if (updateStatus?.error === UniverseProductConfigurationError.ConfigMismatch) {
      alertMessage = translate('Error.ItemConfigMismatch');
    } else {
      alertMessage = translate('Error.Unknown');
    }

    return (
      <Snackbar
        open={!!updateStatus}
        onClose={() => setUpdateStatus(undefined)}
        anchorOrigin={{
          horizontal: 'center',
          vertical: 'top',
        }}
        autoHide
        autoHideDuration={toastDurationTime}>
        {updateStatus !== undefined ? (
          <Alert severity={updateStatus?.success ? 'success' : 'error'} variant='standard'>
            {alertMessage}
          </Alert>
        ) : undefined}
      </Snackbar>
    );
  }, [updateStatus, translate]);

  return (
    <Grid container>
      <Grid XSmall={12} Medium={5} item>
        <TextField
          className={searchAssetTextField}
          fullWidth
          value={searchBoxValue}
          size='medium'
          onChange={searchBoxValueChanged}
          onKeyDown={searchBoxKeyDown}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon fontSize='small' />
              </InputAdornment>
            ),
            endAdornment: isSearching && (
              <InputAdornment position='end'>
                <CancelIcon
                  onClick={() => {
                    setSearchBoxValue('');
                    setSearchResultItem(undefined);
                  }}
                  className={clearSearchIcon}
                  fontSize='small'
                />
              </InputAdornment>
            ),
            inputProps: { 'data-testid': 'searchAssetTextField' },
          }}
          label={translate('Label.SearchMarketplace')}
          id='associated-items-search'
        />
      </Grid>
      {searchResultItem && (
        <Grid container>
          <ItemGrid
            data={[searchResultItem]}
            getItemKey={(item) => item.assetId ?? 0}
            GridItemComponent={ItemCardContainer}
            removeItemAtIndex={() => null}
            updateItemAtIndex={() => null}
            isLoading={isLoading}
            emptyMessage={null}
            toggleEnableItem={toggleEnableItem}
          />
        </Grid>
      )}
      {itemsEnabledHeader}
      {itemsEnabledSection}
      {errorState && emptyStateGrid}
      {toggleEnableResultAlert}
    </Grid>
  );
};

export default AssociatedItemsSearchContainer;
