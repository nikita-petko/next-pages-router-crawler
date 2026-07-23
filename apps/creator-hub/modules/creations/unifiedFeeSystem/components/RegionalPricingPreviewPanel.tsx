import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Typography,
  DialogActions,
  Button,
  SearchIcon,
  Tab,
  Tabs,
} from '@rbx/ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { ReturnPolicy, ThumbnailTypes } from '@rbx/thumbnails';
import {
  Asset,
  assetTypeToItemType,
  itemTypeToReturnPolicyType,
  itemTypeToThumbnailType,
} from '@modules/miscellaneous/common';
import { itemconfigurationClient } from '@modules/clients';
import type {
  AllCountriesDisplayInfo,
  RegionalPriceDisplayInfo,
} from '@modules/regional-pricing/types';
import TopCountriesTable from '@modules/regional-pricing/components/TopCountriesTable/TopCountriesTable';
import AllCountriesTable from '@modules/regional-pricing/components/AllCountriesModal/AllCountriesTable';
import {
  RobloxItemConfigurationApiAssetDetailsAssetTypeEnum,
  RobloxItemConfigurationApiGetItemResponse,
  RobloxItemConfigurationApiGetRegionalpricingPreviewResponse,
  RobloxItemConfigurationApiModelsMarketplaceItemRegionalRentalPrice,
} from '@rbx/client-itemconfiguration/v1';
import { BundleModerationStatus } from '@modules/clients/itemconfiguration';
import { useSettings } from '@modules/settings';
import { DebouncedTextField } from '@modules/charts-generic';
import ItemThumbnail from '../../common/components/ItemThumbnail';
import useItemConfigureFormStylesFromForm from '../../itemConfiguration/components/ItemConfigureForm.styles';
import { useItemConfigureFormStyles } from '../helper/StyleHooks';
import {
  DurationOptionsEnum,
  mapAssetTypeToString,
  mapDurationToEnum,
  mapDurationToString,
} from '../helper/UnifiedFeeSystemConstants';

interface RegionalPricingPreviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  priceOffset: number | undefined;
  minimumPrice: number;
  isBundle: boolean;
  targetId: number;
  itemDetails?: RobloxItemConfigurationApiGetItemResponse;
  name: string;
  isLimited: boolean;
  isRentableOptIn?: boolean;
  regionalRentalPricingData?: RobloxItemConfigurationApiModelsMarketplaceItemRegionalRentalPrice[];
}

function RegionalPricingPreviewPanel(props: RegionalPricingPreviewPanelProps) {
  const {
    isOpen,
    onClose,
    priceOffset,
    minimumPrice,
    isBundle,
    targetId,
    itemDetails,
    name,
    isLimited,
    isRentableOptIn,
    regionalRentalPricingData,
  } = props;
  const { translate } = useTranslation();
  const { settings } = useSettings();
  const {
    classes: {
      regionalPricingPreviewItemCardImg,
      regionalPricingPreviewTable,
      searchIcon,
      regionalPricingPreviewPanelModal,
    },
  } = useItemConfigureFormStyles();
  const {
    classes: { regionalPricingPreviewModeratedThumbnailWrapper },
  } = useItemConfigureFormStylesFromForm();

  const [allCountriesData, setAllCountriesData] = useState<AllCountriesDisplayInfo[]>([]);
  const [topCountriesData, setTopCountriesData] = useState<RegionalPriceDisplayInfo[]>([]);
  const [topCountriesTimedOptionsData, setTopCountriesTimedOptionsData] = useState<
    AllCountriesDisplayInfo[]
  >([]);
  const [activeTab, setActiveTab] = useState(0);

  const isRentablesEnabled = settings?.enableRentables;

  const locale = useLocalization().locale ?? Locale.English;

  const isRentablesTab = isRentablesEnabled && isRentableOptIn && activeTab === 1;

  const moderatedThumbnail =
    itemDetails?.item?.moderationStatus !== undefined &&
    itemDetails?.item?.moderationStatus !== BundleModerationStatus.NUMBER_3;

  useEffect(() => {
    const regionNames = new Intl.DisplayNames(locale, {
      type: 'region',
      fallback: 'code',
    });

    async function getCountryTimedOptionPrices(): Promise<
      Partial<Record<DurationOptionsEnum, RegionalPriceDisplayInfo[]>>
    > {
      const regionalRentalPrices: Partial<Record<DurationOptionsEnum, RegionalPriceDisplayInfo[]>> =
        {};
      regionalRentalPricingData?.forEach(
        (
          regionalRentalPrice: RobloxItemConfigurationApiModelsMarketplaceItemRegionalRentalPrice,
        ) => {
          regionalRentalPrice.rentalPrices?.forEach((rentalPrice) => {
            const duration = rentalPrice.rentalDays;
            if (duration !== undefined) {
              const durationKey = mapDurationToEnum(duration);
              if (!regionalRentalPrices[durationKey]) {
                regionalRentalPrices[durationKey] = [];
              }
              regionalRentalPrices[durationKey]?.push({
                country:
                  regionNames.of(regionalRentalPrice.countryIso2Code?.toUpperCase() ?? '') || '',
                displayPrice: rentalPrice.priceInRobux?.toString() ?? minimumPrice.toString(),
              });
            }
          });
        },
      );
      return regionalRentalPrices;
    }

    async function getCountryData(
      getRegionalPricingPreviewData: RobloxItemConfigurationApiGetRegionalpricingPreviewResponse,
    ): Promise<AllCountriesDisplayInfo[]> {
      if (isRentablesTab) {
        // {
        // [3Days: [ { country: 'United States', displayPrice: '100' }, { country: 'United Kingdom', displayPrice: '100' }, ... ] ],
        // [7Days: [ { country: 'United States', displayPrice: '100' }, { country: 'United Kingdom', displayPrice: '100' }, ... ] ],
        // [14Days: [ { country: 'United States', displayPrice: '100' }, { country: 'United Kingdom', displayPrice: '100' }, ... ] ],
        // [Permanent: [ { country: 'United States', displayPrice: '100' }, { country: 'United Kingdom', displayPrice: '100' }, ... ] ]
        // }
        const allCountriesRegionalRentalPrices = await getCountryTimedOptionPrices();

        return Object.values(DurationOptionsEnum)
          .filter((duration) => duration !== DurationOptionsEnum.Permanent)
          .map((duration) => ({
            displayHeader: translate(`Action.${mapDurationToString(duration)}`),
            allCountriesDisplayInfo: (allCountriesRegionalRentalPrices[duration] || []).sort(
              (a, b) => a.country.localeCompare(b.country),
            ),
          }));
      }

      const regionalPriceDisplayInfo: RegionalPriceDisplayInfo[] =
        getRegionalPricingPreviewData.regionalPrices?.map(
          (regionalPrice): RegionalPriceDisplayInfo => {
            return {
              country: regionNames.of(regionalPrice.countryIso2Code?.toUpperCase() ?? '') || '',
              displayPrice: regionalPrice.priceInRobux?.toString() ?? minimumPrice.toString(),
            };
          },
        ) ?? [];

      regionalPriceDisplayInfo.sort((a, b) => a.country.localeCompare(b.country));

      return [
        {
          displayHeader: translate('Label.RegionalPrice'),
          allCountriesDisplayInfo: regionalPriceDisplayInfo,
        },
      ];
    }

    async function setTopCountriesInfo(
      countryData: AllCountriesDisplayInfo[],
      getRegionalPricingPreviewData: RobloxItemConfigurationApiGetRegionalpricingPreviewResponse,
    ) {
      const representativeCountriesResponse =
        await itemconfigurationClient.getRepresentativeCountries();

      if (isRentablesTab) {
        const representativeCountryNames =
          representativeCountriesResponse.countryIso2Codes
            ?.map((code) => regionNames.of(code.toUpperCase()) || '')
            .filter((countryName) => countryName !== '') ?? [];

        const filteredTimedOptionsData = countryData.map((durationData) => ({
          displayHeader: durationData.displayHeader,
          allCountriesDisplayInfo: representativeCountryNames
            .map((countryName) =>
              durationData.allCountriesDisplayInfo.find(
                (countryInfo) => countryInfo.country === countryName,
              ),
            )
            .filter((info): info is RegionalPriceDisplayInfo => info !== undefined),
        }));

        setTopCountriesTimedOptionsData(filteredTimedOptionsData);
      } else {
        const filteredTopCountriesData =
          representativeCountriesResponse.countryIso2Codes
            ?.map((country): RegionalPriceDisplayInfo | null => {
              const foundRegionalPrice = getRegionalPricingPreviewData.regionalPrices?.find(
                (regionalPrice) => regionalPrice.countryIso2Code === country,
              );
              if (foundRegionalPrice) {
                return {
                  country: regionNames.of(country.toUpperCase()) || '',
                  displayPrice:
                    foundRegionalPrice.priceInRobux?.toString() ?? minimumPrice.toString(),
                };
              }
              return null;
            })
            .filter((data): data is RegionalPriceDisplayInfo => data !== null) ?? [];
        setTopCountriesData(filteredTopCountriesData);
      }
    }

    async function fetchRegionalPricingData() {
      // TODO @mryumae: durables - Add wear time to getRegionalPricingPreview
      const getRegionalPricingPreviewData = await itemconfigurationClient.getRegionalPricingPreview(
        isBundle,
        targetId,
        isLimited,
        minimumPrice,
        priceOffset ?? 0,
      );

      const countryData = await getCountryData(getRegionalPricingPreviewData);

      setAllCountriesData(countryData);

      setTopCountriesInfo(countryData, getRegionalPricingPreviewData);
    }

    fetchRegionalPricingData();
  }, [
    activeTab,
    isBundle,
    isLimited,
    isRentableOptIn,
    isRentablesEnabled,
    locale,
    minimumPrice,
    priceOffset,
    targetId,
    translate,
    isRentablesTab,
    regionalRentalPricingData,
  ]);

  const [viewAllCountries, setViewAllCountries] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const isGroup = itemDetails && itemDetails?.item?.creator?.group !== undefined;
  const assetType = mapAssetTypeToString(
    itemDetails?.item?.marketplaceItemDetails?.assetDetails?.assetType ??
      RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_0,
  ) as Asset;
  const itemTypeThumbnail = isBundle
    ? assetTypeToItemType[Asset.Hat]
    : assetTypeToItemType[assetType];

  const filteredCountriesData = useMemo(() => {
    // Verify the data structure matches the current tab
    // For rentables, there should be 3 price columns (excluding the infinite duration)
    const expectedColumns = isRentablesTab ? Object.values(DurationOptionsEnum).length - 1 : 1;

    // Only return filtered data if it matches the expected structure for the current tab
    // Otherwise, multiple price columns will incorrectly be displayed for the permanent pricing tab
    if (allCountriesData.length !== expectedColumns) {
      return [];
    }

    return allCountriesData.map<AllCountriesDisplayInfo>((displayCol) => {
      return {
        displayHeader: displayCol.displayHeader,
        allCountriesDisplayInfo: displayCol.allCountriesDisplayInfo.filter(({ country }) =>
          country.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      };
    });
  }, [allCountriesData, searchTerm, isRentablesTab]);

  const rentablesTableHeaderClasses = isRentablesTab
    ? {
        tableHeaderCell: 'min-w-[100px]',
      }
    : undefined;

  const itemThumbnail = (
    <ItemThumbnail
      containerClass={regionalPricingPreviewItemCardImg}
      moderatedContainerClass={regionalPricingPreviewItemCardImg}
      type={isBundle ? ThumbnailTypes.bundleThumbnail : itemTypeToThumbnailType[itemTypeThumbnail]}
      targetId={targetId}
      bundleModerationStatus={itemDetails?.item?.moderationStatus}
      returnPolicy={
        isGroup ? ReturnPolicy.PlaceHolder : itemTypeToReturnPolicyType[itemTypeThumbnail]
      }
      alt={itemDetails?.item?.name ?? ''}
      isPendingNewTarget={false}
    />
  );

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth='Medium'
      fullWidth
      className={regionalPricingPreviewPanelModal}>
      <DialogTitle>{translate('Label.RegionalPricingPreview')}</DialogTitle>
      <DialogContent>
        <Grid container>
          <Grid item>
            <Grid style={{ marginBottom: '16px' }}>
              <Typography variant='h2'>{translate('Title.PriceCountryRegions')}</Typography>
            </Grid>
            <Grid container direction='row' alignItems='center'>
              <Grid item>
                {moderatedThumbnail ? (
                  <div className={regionalPricingPreviewModeratedThumbnailWrapper}>
                    {itemThumbnail}
                  </div>
                ) : (
                  itemThumbnail
                )}
              </Grid>
              <Grid item>
                <Grid container direction='column' style={{ marginLeft: '16px' }}>
                  <Grid item>
                    <Typography variant='body1'>{name}</Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant='body2' style={{ color: 'gray' }}>
                      {translate('Label.ID', { id: targetId.toString() })}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {isRentablesEnabled && isRentableOptIn && (
            <Grid item style={{ width: '100%', marginTop: '16px' }}>
              <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                <Tab label={translate('Action.Permanent')} />
                <Tab label={translate('Label.TimedOptionPrices')} />
              </Tabs>
            </Grid>
          )}

          <Grid item className={regionalPricingPreviewTable}>
            {viewAllCountries ? (
              <DialogContent>
                <DebouncedTextField
                  id='all-countries-table-search'
                  label=''
                  aria-label={translate('Label.Search')}
                  placeholder={translate('Label.Search')}
                  size='small'
                  InputProps={{
                    startAdornment: <SearchIcon className={searchIcon} />,
                    type: 'search',
                  }}
                  value={searchTerm}
                  onDebouncedChange={setSearchTerm}
                  debounceTime={100}
                  fullWidth
                />
                <AllCountriesTable
                  countriesData={filteredCountriesData}
                  classes={rentablesTableHeaderClasses}
                />
              </DialogContent>
            ) : (
              <React.Fragment>
                {isRentablesTab ? (
                  // Use AllCountriesTable which supports multiple price columns
                  <AllCountriesTable
                    countriesData={topCountriesTimedOptionsData}
                    showViewAllButton
                    onViewAllCountries={() => {
                      setViewAllCountries(true);
                    }}
                    disableViewAllCountries={false}
                    classes={rentablesTableHeaderClasses}
                  />
                ) : (
                  <TopCountriesTable
                    topCountriesData={topCountriesData}
                    onViewAllCountries={() => {
                      setViewAllCountries(true);
                    }}
                    disableViewAllCountries={false}
                    isForSale
                  />
                )}
              </React.Fragment>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <Grid container justifyContent='flex-end' spacing={1}>
        {viewAllCountries && (
          <DialogActions>
            <Button
              onClick={() => setViewAllCountries(false)}
              color='secondary'
              variant='contained'>
              {translate('Action.GoBack')}
            </Button>
          </DialogActions>
        )}
        <DialogActions>
          <Button onClick={onClose} color='primaryBrand' variant='contained'>
            {translate('Action.Close')}
          </Button>
        </DialogActions>
      </Grid>
    </Dialog>
  );
}

export default RegionalPricingPreviewPanel;
