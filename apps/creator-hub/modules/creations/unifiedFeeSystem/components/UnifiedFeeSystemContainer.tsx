import React, { useEffect, useMemo, useState } from 'react';
import { Divider, useMediaQuery, useTheme } from '@rbx/ui';
import { useRouter } from 'next/router';
import {
  ItemConfigurationCollectiblesMetadataResponse,
  catalogClient,
  developClient,
  itemconfigurationClient,
  marketplaceItemsClient,
} from '@modules/clients';
import { RobloxApiDevelopModelsUniverseModel } from '@rbx/clients/develop';
import {
  RobloxCatalogApiMultigetItemDetailsRequestItem,
  RobloxCatalogApiMultigetItemDetailsRequestItemItemTypeEnum,
} from '@rbx/clients/catalogApi';
import { useSettings } from '@modules/settings';
import {
  RobloxItemConfigurationApiBundleDetailsBundleTypeEnum,
  RobloxItemConfigurationApiAssetDetailsAssetTypeEnum,
  RobloxItemConfigurationApiGetItemResponse,
  RobloxItemConfigurationApiMarketplaceItemCannotBePublishedReasonEnum,
  RobloxItemConfigurationApiRentalOption,
  RobloxItemConfigurationApiModelsMarketplaceItemRegionalRentalPrice,
} from '@rbx/client-itemconfiguration/v1';
import TimedOptionsDialog from '../../itemConfiguration/components/TimedOptionsDialog';
import ItemDetails from './ItemDetails';
import ItemAttributes from './ItemAttributes';
import Pricing from './Pricing';
import SaleLocation from './SaleLocation';

import PublishPanel from './PublishPanel';
import SavePanel from './SavePanel';
import ItemAttributesPostPublish from './ItemAttributesPostPublish';
import {
  BodySuitDisplayName,
  getValidTimedOptionsTypes,
  getValidWearTimeTypes,
  mapAssetTypeToString,
  mapBundleTypeToString,
  SaleLocationEnum,
  DurationOptionsEnum,
  DurationOptions,
} from '../helper/UnifiedFeeSystemConstants';
import ClassicItemVerificationAlert from '../../verification/components/ClassicItemVerificationAlert';
import VerificationAlert from './VerificationAlert';
import NonSellableSavePanel from './NonSellableSavePanel';
import SaleLocationAndRevenue from './SaleLocationAndRevenue';
import { getIsDurableType, getIsRentableType } from '../helper/UnifiedFeeSystemHelper';

interface UnifiedFeeSystemContainerProps {
  itemDetails?: RobloxItemConfigurationApiGetItemResponse;
  collectiblesMetadata?: ItemConfigurationCollectiblesMetadataResponse;
  isBundle: boolean;
  is2dAsset: boolean;
}

function UnifiedFeeSystemContainer(props: UnifiedFeeSystemContainerProps) {
  const { itemDetails, collectiblesMetadata, isBundle, is2dAsset } = props;
  const { settings } = useSettings();

  const isGroup = itemDetails?.item?.creator?.group !== undefined;
  const creatorTargetId = isGroup
    ? itemDetails?.item?.creator?.group?.groupId
    : itemDetails?.item?.creator?.user?.userId;
  const targetId = Number(itemDetails?.item?.id);
  const itemType = isBundle
    ? mapBundleTypeToString(
        itemDetails?.item?.marketplaceItemDetails?.bundleDetails?.bundleType ??
          RobloxItemConfigurationApiBundleDetailsBundleTypeEnum.NUMBER_0,
      )
    : mapAssetTypeToString(
        itemDetails?.item?.marketplaceItemDetails?.assetDetails?.assetType ??
          RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_0,
      );

  const isHd = itemDetails?.item?.isHD ?? false;
  const [isCollectible, setIsCollectible] = useState(false);
  const [collectibleItemId, setCollectibleItemId] = useState('');
  const [name, setName] = useState(itemDetails?.item?.name || '');
  const [description, setDescription] = useState(itemDetails?.item?.description || '');

  function getUsedWearTimes() {
    // TODO @mryumae: durables - The used options will be retrieved from itemDetails's new RelatedItems field
    return [DurationOptionsEnum.Permanent];
  }
  const usedWearTimes = getUsedWearTimes();

  function getDefaultWearTime(): DurationOptionsEnum {
    // Find the first available wear time option that hasn't been used
    return (
      DurationOptions.find((option) => !usedWearTimes.includes(option)) ??
      DurationOptionsEnum.Permanent
    );
  }

  const [isLimited, setIsLimited] = useState(false);
  const [quantity, setQuantity] = useState<number>();
  const [limit, setLimit] = useState<number | undefined>();
  const [initialLimit, setInitialLimit] = useState<number | undefined>();
  const [isFree, setIsFree] = useState(false);
  const [isResellable, setIsResellable] = useState(false);
  const [originalIsResellable, setOriginalIsResellable] = useState(false);
  const [price, setPrice] = useState<number>();
  const [priceOffset, setPriceOffset] = useState<number>();
  const [optionalPriceFloor, setOptionalPriceFloor] = useState<number>();
  const [saleLocation, setSaleLocation] = useState<SaleLocationEnum>(1);
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);
  const [availablePlaces, setAvailablePlaces] = useState<string[]>([]);
  const [isOnSale, setIsOnSale] = useState(true);
  const [isSaveDisabled, setIsSaveDisabled] = useState(false);
  const [cannotBeSold, setCannotBeSold] = useState(false);
  const [scheduledStartDate, setScheduledStartDate] = useState<Date | null>(null);
  const [scheduledEndDate, setScheduledEndDate] = useState<Date | null>(null);
  const [isOptOutRegionalPricing, setIsOptOutRegionalPricing] = useState(false);

  // Store the original scheduled sale dates before the user makes changes
  const [preSaveScheduledStartDate, setPreSaveScheduledStartDate] = useState<Date | null>(null);
  const [preSaveScheduledEndDate, setPreSaveScheduledEndDate] = useState<Date | null>(null);
  const [originalSaleStatus, setOriginalSaleStatus] = useState<boolean>(true);
  const [scheduledSaleChanged, setScheduledSaleChanged] = useState<boolean>(false);
  const [priceFloor, setPriceFloor] = useState<number>(0);
  const [priceFloorDisplayName, setPriceFloorDisplayName] = useState<string>('');

  const [wearTime, setWearTime] = useState<DurationOptionsEnum>(getDefaultWearTime()); // TODO @mryumae: durables - replace with itemDetails?.item?.wearTime once BE is ready
  const [showTimedOptionsDialog, setShowTimedOptionsDialog] = useState<boolean>(false);

  const isDurableType = getIsDurableType(
    itemDetails?.item?.marketplaceItemDetails?.assetDetails?.assetType,
    itemDetails?.item?.marketplaceItemDetails?.bundleDetails?.bundleType,
  );
  const isRentableType = getIsRentableType(
    itemDetails?.item?.marketplaceItemDetails?.assetDetails?.assetType,
    itemDetails?.item?.marketplaceItemDetails?.bundleDetails?.bundleType,
  );

  const [isRentableOptIn, setIsRentableOptIn] = useState<boolean | undefined>(
    isRentableType ? itemDetails?.item?.isRentalOptIn : undefined,
  );
  const [rentalPricingData, setRentalPricingData] = useState<
    RobloxItemConfigurationApiRentalOption[]
  >([]);
  const [regionalRentalPricingData, setRegionalRentalPricingData] = useState<
    RobloxItemConfigurationApiModelsMarketplaceItemRegionalRentalPrice[]
  >([]);
  const isRentablesEnabled = settings?.enableRentables;

  const router = useRouter();
  const isPublishPage = router.pathname.includes('/publish');

  const theme = useTheme();
  const isXlScreen = useMediaQuery(theme.breakpoints.up('XXLarge'));

  useEffect(() => {
    getValidWearTimeTypes();
    getValidTimedOptionsTypes();
  }, []);

  useEffect(() => {
    if (isLimited) {
      setIsRentableOptIn(undefined);
    } else if (isRentableType && itemDetails?.item?.isRentalOptIn !== undefined) {
      setIsRentableOptIn(itemDetails.item.isRentalOptIn);
    }
  }, [isLimited, isRentableType, itemDetails?.item?.isRentalOptIn]);

  useEffect(() => {
    const saleChanged =
      preSaveScheduledStartDate !== scheduledStartDate ||
      preSaveScheduledEndDate !== scheduledEndDate;

    setScheduledSaleChanged(saleChanged);
    if (!saleChanged) {
      // Used to reset the on sale toggle if a scheduled sale is canceled before saving the changes
      setIsOnSale(isCollectible ? originalSaleStatus : true);
    }
  }, [
    preSaveScheduledStartDate,
    preSaveScheduledEndDate,
    scheduledStartDate,
    scheduledEndDate,
    isCollectible,
    originalSaleStatus,
  ]);

  useEffect(() => {
    const getPriceFloor = async () => {
      // TODO @mryumae: durables - Add wear time to getPriceFloor once BE is ready
      const priceFloorResponse = await itemconfigurationClient.getPriceFloor(
        targetId,
        isBundle,
        isLimited,
      );
      setPriceFloor(priceFloorResponse?.priceFloorInRobux ?? 0);
      setPriceFloorDisplayName(priceFloorResponse?.displayName ?? '');
    };
    getPriceFloor();
  }, [targetId, isLimited, collectiblesMetadata?.isGetPriceFloorEnabled, isBundle]);

  useEffect(() => {
    if (collectiblesMetadata?.isRegionalPricingEnabled) {
      setIsOptOutRegionalPricing(
        itemDetails?.item?.dynamicPriceConfiguration?.isOptOutRegionalPricing ?? false,
      );
    }
  }, [
    targetId,
    isBundle,
    collectiblesMetadata?.isRegionalPricingEnabled,
    itemDetails?.item?.dynamicPriceConfiguration?.isOptOutRegionalPricing,
  ]);

  useEffect(() => {
    async function fetchCollectiblesData() {
      const getCollectibleItemIdResponse = await itemconfigurationClient.getCollectibleItemId(
        targetId,
        isBundle,
      );
      const collectibleItemIdValue = getCollectibleItemIdResponse?.collectibleItemId;
      if (collectibleItemIdValue) {
        setCollectibleItemId(collectibleItemIdValue);
        setIsCollectible(true);
        const getCollectibleDetailsResponse =
          await marketplaceItemsClient.getCollectibleItemsDetails([collectibleItemIdValue]);
        const collectibleDetails = getCollectibleDetailsResponse?.[0];
        setIsOnSale(collectibleDetails?.productSaleStatus === 3);
        setIsLimited(collectibleDetails?.itemType === 1);

        const catalogItems: RobloxCatalogApiMultigetItemDetailsRequestItem[] = [
          {
            id: targetId,
            itemType: isBundle
              ? RobloxCatalogApiMultigetItemDetailsRequestItemItemTypeEnum.NUMBER_2
              : RobloxCatalogApiMultigetItemDetailsRequestItemItemTypeEnum.NUMBER_1,
          },
        ];
        const getCollectibleDetails = await catalogClient.postItemDetails(catalogItems);
        const collectibleAssetDetails = getCollectibleDetails.data?.[0];
        setQuantity(collectibleAssetDetails?.totalQuantity);

        setLimit(collectibleDetails?.quantityLimitPerUser);
        setInitialLimit(collectibleDetails?.quantityLimitPerUser);
        setPrice(collectibleDetails?.price ?? undefined);
        if (collectibleDetails?.price === 0) {
          setIsFree(true);
        } else if (!isBundle || collectiblesMetadata?.isNewBundleUIEnabled) {
          const dynamicPriceDataResponse =
            await itemconfigurationClient.getDynamicPriceConfiguration(collectibleItemIdValue);
          setPriceOffset(dynamicPriceDataResponse?.dynamicPriceConfiguration?.priceOffset);
          const minPrice = dynamicPriceDataResponse?.dynamicPriceConfiguration?.minimumPrice;
          if (minPrice !== 1) setOptionalPriceFloor(minPrice);
        }
        setIsResellable(collectibleDetails?.resaleRestriction === 1);
        setOriginalIsResellable(collectibleDetails?.resaleRestriction === 1);
        if (collectibleDetails?.saleLocationType === 'ShopAndAllExperiences') {
          setSaleLocation(SaleLocationEnum.MarketplaceAndAllExperiences);
        } else if (collectibleDetails?.saleLocationType === 'ShopOnly') {
          setSaleLocation(SaleLocationEnum.MarketplaceOnly);
        } else if (
          collectibleDetails?.saleLocationType === 'ExperiencesDevApiOnly' ||
          collectibleDetails?.saleLocationType === 'ShopAndExperiencesById'
        ) {
          setSaleLocation(
            collectibleDetails?.saleLocationType === 'ExperiencesDevApiOnly'
              ? SaleLocationEnum.ExperiencesAndDevAPIOnly
              : SaleLocationEnum.MarketplaceAndExperiencesById,
          );

          const origRootPlaceIds: string[] = [];
          let processedUniverseIds = 0;

          const retrievedUniverseIds: number[] = collectibleDetails?.universeIds || [];
          retrievedUniverseIds.forEach(async (uid) => {
            let universeDetailResponse: RobloxApiDevelopModelsUniverseModel;
            try {
              universeDetailResponse = await developClient.getUniverseDetails(uid);
              if (universeDetailResponse?.rootPlaceId) {
                origRootPlaceIds.push(`${universeDetailResponse?.rootPlaceId}`);
              }
            } catch {
              // will not include root place in response
            }
            processedUniverseIds += 1;
            if (processedUniverseIds === retrievedUniverseIds.length) {
              setSelectedPlaces(origRootPlaceIds);
            }
          });
        }

        // Set scheduledStartDate and scheduledEndDate if scheduled publishing is enabled
        if (collectiblesMetadata?.isScheduledPublishingEnabled) {
          setOriginalSaleStatus(collectibleDetails?.productSaleStatus === 3);

          // There is a pre-existing scheduled sale
          if (collectibleDetails?.scheduledRelease) {
            const { onSaleTime, offSaleTime } = collectibleDetails.scheduledRelease;
            const startDate = onSaleTime?.seconds ? new Date(onSaleTime.seconds * 1000) : null;
            const endDate = offSaleTime?.seconds ? new Date(offSaleTime.seconds * 1000) : null;
            setScheduledStartDate(startDate);
            setScheduledEndDate(endDate);
            setPreSaveScheduledStartDate(startDate);
            setPreSaveScheduledEndDate(endDate);
          }
        }
      }
    }

    fetchCollectiblesData();
  }, [
    targetId,
    isBundle,
    collectiblesMetadata?.isNewBundleUIEnabled,
    collectiblesMetadata?.isScheduledPublishingEnabled,
    isCollectible,
  ]);

  useEffect(() => {
    if (!description) {
      setIsSaveDisabled(true);
    } else {
      setIsSaveDisabled(false);
    }
  }, [price, isBundle, isOnSale, itemType, collectiblesMetadata, description]);

  useEffect(() => {
    setCannotBeSold(
      itemDetails?.item?.cannotBePublishedReason !==
        RobloxItemConfigurationApiMarketplaceItemCannotBePublishedReasonEnum.NUMBER_0,
    );
  }, [itemDetails]);

  // since limited is not available for collectibles, reset opt out regional pricing.
  useEffect(() => {
    if (isLimited) {
      setIsOptOutRegionalPricing(false);
    }
  }, [isLimited]);

  useEffect(() => {
    const fetchRentalPricingPreview = async () => {
      if (!isRentablesEnabled || !isRentableOptIn) {
        return;
      }

      const response = await itemconfigurationClient.getRentalPricingPreview(
        isBundle,
        targetId,
        isLimited,
        optionalPriceFloor ?? priceFloor,
        priceOffset ?? 0,
        true,
      );

      setRegionalRentalPricingData(response.regionalRentalPrices ?? []);
      setRentalPricingData(response.rentalPrices ?? []);
    };

    fetchRentalPricingPreview();
  }, [
    isRentablesEnabled,
    isRentableOptIn,
    isBundle,
    targetId,
    isLimited,
    optionalPriceFloor,
    priceFloor,
    priceOffset,
    isOptOutRegionalPricing,
  ]);

  const enableItemAttributes = useMemo(() => {
    return (
      (!isCollectible && scheduledSaleChanged) ||
      isOnSale ||
      (isCollectible && scheduledStartDate != null)
    );
  }, [isCollectible, isOnSale, scheduledSaleChanged, scheduledStartDate]);

  const itemAttributes = useMemo(() => {
    const displayInfoChanged =
      name !== itemDetails?.item?.name || description !== itemDetails?.item?.description;

    if (cannotBeSold) {
      return (
        <NonSellableSavePanel
          targetId={targetId}
          name={name}
          description={description}
          isBundle={isBundle}
          displayInfoChanged={displayInfoChanged}
        />
      );
    }

    const displayItemAttributes = isDurableType ? isPublishPage : !isCollectible;

    return (
      <div>
        <Divider style={{ margin: '40px 0' }} />

        {!is2dAsset && (
          <React.Fragment>
            {displayItemAttributes ? (
              <ItemAttributes
                isBundle={isBundle}
                isLimited={isLimited}
                setIsLimited={setIsLimited}
                quantity={quantity}
                setQuantity={setQuantity}
                limit={limit}
                setLimit={setLimit}
                isFree={isFree}
                setIsFree={setIsFree}
                setPriceOffset={setPriceOffset}
                setOptionalPriceFloor={setOptionalPriceFloor}
                isResellable={isResellable}
                setIsResellable={setIsResellable}
                collectiblesMetadata={collectiblesMetadata}
                wearTime={wearTime}
                setWearTime={setWearTime}
                usedWearTimes={usedWearTimes}
                isDurableType={isDurableType}
                isCollectible={isCollectible}
                isRentableType={isRentableType}
                isRentableOptIn={isRentableOptIn}
                setIsRentableOptIn={setIsRentableOptIn}
              />
            ) : (
              <ItemAttributesPostPublish
                isLimited={isLimited}
                quantity={quantity}
                limit={limit}
                setLimit={setLimit}
                initialLimit={initialLimit}
                isFree={isFree}
                isResellable={isResellable}
                setIsResellable={setIsResellable}
                originalIsResellable={originalIsResellable}
                collectiblesMetadata={collectiblesMetadata}
                wearTime={wearTime}
                isBundle={isBundle}
                isDurableType={isDurableType}
                itemId={targetId}
                enableItemAttributes={enableItemAttributes}
                isRentableType={isRentableType}
                isRentableOptIn={isRentableOptIn}
                setIsRentableOptIn={setIsRentableOptIn}
              />
            )}
            <Divider style={{ margin: '40px 0' }} />
          </React.Fragment>
        )}

        <div
          style={{
            opacity: enableItemAttributes ? '100%' : '24%',
          }}>
          <Pricing
            isBundle={isBundle}
            isFree={isFree}
            isLimited={isLimited}
            isOptOutRegionalPricing={isOptOutRegionalPricing}
            setIsOptOutRegionalPricing={setIsOptOutRegionalPricing}
            price={price}
            setPrice={setPrice}
            priceOffset={priceOffset}
            setPriceOffset={setPriceOffset}
            optionalPriceFloor={optionalPriceFloor}
            setOptionalPriceFloor={setOptionalPriceFloor}
            itemTypeString={itemType}
            collectiblesMetadata={collectiblesMetadata}
            priceFloor={priceFloor}
            priceFloorDisplayName={priceFloorDisplayName}
            targetId={targetId}
            itemDetails={itemDetails}
            name={name}
            isRentableOptIn={isRentableOptIn}
            rentalPricingData={rentalPricingData}
            regionalRentalPricingData={regionalRentalPricingData}
            setShowTimedOptionsDialog={setShowTimedOptionsDialog}
          />
          <Divider style={{ margin: '40px 0' }} />
          {collectiblesMetadata?.isRevenueSplitEnabled ? (
            <SaleLocationAndRevenue
              isBundle={isBundle}
              targetId={targetId.toString()}
              isLimited={isLimited}
              saleLocation={saleLocation}
              setSaleLocation={setSaleLocation}
              selectedPlaces={selectedPlaces}
              setSelectedPlaces={setSelectedPlaces}
              availablePlaces={availablePlaces}
              setAvailablePlaces={setAvailablePlaces}
              priceOffset={priceOffset ?? 0}
              minimumPrice={optionalPriceFloor === undefined ? 1 : optionalPriceFloor}
              isFree={isFree}
            />
          ) : (
            <SaleLocation
              isLimited={isLimited}
              saleLocation={saleLocation}
              setSaleLocation={setSaleLocation}
              selectedPlaces={selectedPlaces}
              setSelectedPlaces={setSelectedPlaces}
              availablePlaces={availablePlaces}
              setAvailablePlaces={setAvailablePlaces}
              collectiblesMetadata={collectiblesMetadata}
            />
          )}
        </div>
        <Divider style={{ margin: '40px 0' }} />

        {!isCollectible ? (
          <PublishPanel
            isOnSale={isOnSale}
            itemType={itemType}
            isBundle={isBundle}
            isLimited={isLimited}
            isGroup={isGroup || false}
            creatorTargetId={creatorTargetId}
            targetId={targetId}
            quantity={quantity}
            limit={limit}
            isResellable={isResellable}
            price={price}
            priceOffset={priceOffset}
            optionalPriceFloor={optionalPriceFloor}
            isFree={isFree}
            saleLocation={saleLocation}
            selectedPlaces={selectedPlaces}
            name={name}
            description={description}
            collectiblesMetadata={collectiblesMetadata}
            scheduledStartDate={scheduledStartDate}
            scheduledEndDate={scheduledEndDate}
            optOutFromRegionalPricing={isOptOutRegionalPricing}
            wearTime={wearTime}
            isRentableOptIn={isRentableOptIn}
            priceFloor={priceFloor}
          />
        ) : (
          <SavePanel
            updateDisplayInfoOnly={cannotBeSold}
            isBundle={isBundle}
            targetId={targetId}
            name={name}
            description={description}
            collectibleItemId={collectibleItemId}
            isOnSale={isOnSale}
            limit={limit}
            isResellable={isResellable}
            originalIsResellable={originalIsResellable}
            optionalPriceFloor={optionalPriceFloor}
            priceOffset={priceOffset}
            price={price}
            isFree={isFree}
            saleLocation={saleLocation}
            selectedPlaces={selectedPlaces}
            isSaveDisabled={isSaveDisabled}
            collectiblesMetadata={collectiblesMetadata}
            scheduledStartDate={scheduledStartDate}
            scheduledEndDate={scheduledEndDate}
            scheduledSaleChanged={scheduledSaleChanged}
            setOriginalSaleStatus={setOriginalSaleStatus}
            setPreSaveScheduledStartDate={setPreSaveScheduledStartDate}
            setPreSaveScheduledEndDate={setPreSaveScheduledEndDate}
            optOutFromRegionalPricing={isOptOutRegionalPricing}
            isRentableOptIn={isRentableOptIn}
            displayInfoChanged={displayInfoChanged}
          />
        )}

        <TimedOptionsDialog
          showTimedOptionsDialog={showTimedOptionsDialog}
          setShowTimedOptionsDialog={setShowTimedOptionsDialog}
          rentalPricingData={rentalPricingData}
        />
      </div>
    );
  }, [
    name,
    itemDetails,
    description,
    cannotBeSold,
    isDurableType,
    isPublishPage,
    isCollectible,
    is2dAsset,
    isBundle,
    isLimited,
    quantity,
    limit,
    isFree,
    isResellable,
    collectiblesMetadata,
    wearTime,
    usedWearTimes,
    isRentableType,
    isRentableOptIn,
    initialLimit,
    originalIsResellable,
    targetId,
    enableItemAttributes,
    isOptOutRegionalPricing,
    price,
    priceOffset,
    optionalPriceFloor,
    itemType,
    priceFloor,
    priceFloorDisplayName,
    rentalPricingData,
    regionalRentalPricingData,
    saleLocation,
    selectedPlaces,
    availablePlaces,
    isOnSale,
    isGroup,
    creatorTargetId,
    scheduledStartDate,
    scheduledEndDate,
    collectibleItemId,
    isSaveDisabled,
    scheduledSaleChanged,
    showTimedOptionsDialog,
  ]);

  return (
    <div style={{ width: '100%', maxWidth: '1800px', paddingRight: isXlScreen ? '10%' : '0%' }}>
      {!isCollectible &&
        !cannotBeSold &&
        (is2dAsset ? <ClassicItemVerificationAlert /> : <VerificationAlert />)}
      <ItemDetails
        cannotBeSold={cannotBeSold}
        isBundle={isBundle}
        isCollectible={isCollectible}
        isOnSale={isOnSale}
        setIsOnSale={setIsOnSale}
        name={name}
        setName={setName}
        description={description}
        setDescription={setDescription}
        targetId={targetId}
        itemDetails={itemDetails}
        setStartDate={setScheduledStartDate}
        startDate={scheduledStartDate}
        setEndDate={setScheduledEndDate}
        endDate={scheduledEndDate}
        collectiblesMetadata={collectiblesMetadata}
        scheduledSaleChanged={scheduledSaleChanged}
        setScheduledSaleChanged={setScheduledSaleChanged}
        isBodySuit={priceFloorDisplayName === BodySuitDisplayName}
        isHd={isHd}
      />
      {itemAttributes}
    </div>
  );
}

export default UnifiedFeeSystemContainer;
