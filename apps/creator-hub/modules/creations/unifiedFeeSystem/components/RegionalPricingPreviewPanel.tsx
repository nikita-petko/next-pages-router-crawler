import { useEffect, useMemo, useState } from 'react';
import type {
  RobloxItemConfigurationApiGetItemResponse,
  RobloxItemConfigurationApiGetRegionalpricingPreviewResponse,
  RobloxItemConfigurationApiModelsMarketplaceItemRegionalRentalPrice,
} from '@rbx/client-itemconfiguration/v1';
import { RobloxItemConfigurationApiAssetDetailsAssetTypeEnum } from '@rbx/client-itemconfiguration/v1';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  SearchInput,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@rbx/foundation-ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { ReturnPolicy, ThumbnailTypes } from '@rbx/thumbnails';
import itemconfigurationClient from '@modules/clients/itemconfiguration';
import {
  Asset,
  assetTypeToItemType,
  itemTypeToReturnPolicyType,
  itemTypeToThumbnailType,
} from '@modules/miscellaneous/common';
import { isValidEnumValue } from '@modules/miscellaneous/utils';
import AllCountriesTable from '@modules/regional-pricing/components/AllCountriesModal/AllCountriesTable';
import TopCountriesTable from '@modules/regional-pricing/components/TopCountriesTable/TopCountriesTable';
import type {
  AllCountriesDisplayInfo,
  RegionalPriceDisplayInfo,
} from '@modules/regional-pricing/types';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import ItemThumbnail from '../../common/components/ItemThumbnail';
import {
  DurationOptionsEnum,
  mapAssetTypeToString,
  mapDurationToEnum,
  mapDurationToString,
} from '../helper/UnifiedFeeSystemConstants';

// Mirror the (working) ItemDetails thumbnail sizing: an inline-block sized container capped by a
// maxWidth/maxHeight wrapper below.
const THUMBNAIL_CLASS = 'inline-block size-[75px] radius-medium';
const MODERATED_THUMBNAIL_CLASS = 'relative inline-block size-[75px] radius-medium';

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

  const [allCountriesData, setAllCountriesData] = useState<AllCountriesDisplayInfo[]>([]);
  const [topCountriesData, setTopCountriesData] = useState<RegionalPriceDisplayInfo[]>([]);
  const [topCountriesTimedOptionsData, setTopCountriesTimedOptionsData] = useState<
    AllCountriesDisplayInfo[]
  >([]);
  const [activeTab, setActiveTab] = useState(0);

  const isRentablesEnabled = settings?.enableRentables;

  const locale = useLocalization().locale ?? Locale.English;

  const isRentablesTab = isRentablesEnabled && isRentableOptIn && activeTab === 1;

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
              regionalRentalPrices[durationKey] ??= [];
              regionalRentalPrices[durationKey]?.push({
                country:
                  regionNames.of(regionalRentalPrice.countryIso2Code?.toUpperCase() ?? '') ?? '',
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
            allCountriesDisplayInfo: (allCountriesRegionalRentalPrices[duration] ?? []).sort(
              (a, b) => a.country.localeCompare(b.country),
            ),
          }));
      }

      const regionalPriceDisplayInfo: RegionalPriceDisplayInfo[] =
        getRegionalPricingPreviewData.regionalPrices?.map(
          (regionalPrice): RegionalPriceDisplayInfo => {
            return {
              country: regionNames.of(regionalPrice.countryIso2Code?.toUpperCase() ?? '') ?? '',
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
            ?.map((code) => regionNames.of(code.toUpperCase()) ?? '')
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
                  country: regionNames.of(country.toUpperCase()) ?? '',
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

      void setTopCountriesInfo(countryData, getRegionalPricingPreviewData);
    }

    void fetchRegionalPricingData();
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
  const mappedAssetType = mapAssetTypeToString(
    itemDetails?.item?.marketplaceItemDetails?.assetDetails?.assetType ??
      RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_0,
  );
  const assetType = isValidEnumValue(Asset, mappedAssetType) ? mappedAssetType : Asset.Hat;
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
      containerClass={THUMBNAIL_CLASS}
      moderatedContainerClass={MODERATED_THUMBNAIL_CLASS}
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
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
      size='Large'
      isModal
      hasCloseAffordance={false}>
      <DialogContent className='width-full'>
        <DialogBody>
          <DialogTitle className='text-heading-small margin-none'>
            {translate('Label.RegionalPricingPreview')}
          </DialogTitle>
          <div className='margin-top-[16px]'>
            <div className='text-heading-small margin-bottom-[16px]'>
              {translate('Title.PriceCountryRegions')}
            </div>
            <div className='flex items-center'>
              <div className='shrink-0 [max-width:75px] [max-height:75px]'>{itemThumbnail}</div>
              <div className='flex flex-col margin-left-[16px]'>
                <span className='text-body-medium'>{name}</span>
                <span className='text-body-small content-muted'>
                  {translate('Label.ID', { id: targetId.toString() })}
                </span>
              </div>
            </div>

            {isRentablesEnabled && isRentableOptIn && (
              <div className='width-full margin-top-[16px]'>
                <Tabs
                  value={activeTab === 1 ? 'timed' : 'permanent'}
                  onValueChange={(value) => setActiveTab(value === 'timed' ? 1 : 0)}>
                  <TabsList>
                    <TabsTrigger value='permanent'>{translate('Action.Permanent')}</TabsTrigger>
                    <TabsTrigger value='timed'>{translate('Label.TimedOptionPrices')}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}

            <div className='width-full margin-top-[16px]'>
              {viewAllCountries ? (
                <div className='flex flex-col gap-medium'>
                  <SearchInput
                    id='all-countries-table-search'
                    aria-label={translate('Label.Search')}
                    leadingIconName='icon-regular-magnifying-glass'
                    placeholder={translate('Label.Search')}
                    size='Small'
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className='width-full'
                  />
                  {/* Scroll the (potentially long) country list instead of growing the dialog. */}
                  <div className='[max-height:50vh] [overflow-y:auto]'>
                    <AllCountriesTable
                      countriesData={filteredCountriesData}
                      classes={rentablesTableHeaderClasses}
                    />
                  </div>
                </div>
              ) : (
                <div className='[max-height:50vh] [overflow-y:auto]'>
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
                </div>
              )}
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <div className='flex gap-small justify-end'>
            {viewAllCountries && (
              <Button variant='Standard' type='button' onClick={() => setViewAllCountries(false)}>
                {translate('Action.GoBack')}
              </Button>
            )}
            <Button variant='Emphasis' type='button' onClick={onClose}>
              {translate('Action.Close')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RegionalPricingPreviewPanel;
