/* oxlint-disable react/react-compiler -- pre-existing useEffect+setState patterns throughout this file */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import type { RobloxCatalogApiMultigetItemDetailsRequestItem } from '@rbx/client-catalog/v1';
import { RobloxCatalogApiMultigetItemDetailsRequestItemItemTypeEnum } from '@rbx/client-catalog/v1';
import type { RobloxApiDevelopModelsUniverseModel } from '@rbx/client-develop/v1';
import type {
  RobloxItemConfigurationApiGetItemResponse,
  RobloxItemConfigurationApiRentalOption,
  RobloxItemConfigurationApiModelsMarketplaceItemRegionalRentalPrice,
} from '@rbx/client-itemconfiguration/v1';
import {
  RobloxItemConfigurationApiBundleDetailsBundleTypeEnum,
  RobloxItemConfigurationApiAssetDetailsAssetTypeEnum,
  RobloxItemConfigurationApiMarketplaceItemCannotBePublishedReasonEnum,
  RobloxItemConfigurationApiMarketplaceItemSaleStatusEnum,
  RobloxItemConfigurationApiMarketplaceItemCollectibleItemTypeEnum,
} from '@rbx/client-itemconfiguration/v1';
import { useFlag } from '@rbx/flags';
import { Divider, useMediaQuery, useTheme } from '@rbx/ui';
import { enableGetItemCollectibleDetails } from '@generated/flags/avatarMarketplace';
import catalogClient from '@modules/clients/catalog';
import developClient from '@modules/clients/develop';
import type { ItemConfigurationCollectiblesMetadataResponse } from '@modules/clients/itemconfiguration';
import itemconfigurationClient from '@modules/clients/itemconfiguration';
import marketplaceItemsClient from '@modules/clients/marketplaceitems';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import TimedOptionsDialog from '../../itemConfiguration/components/TimedOptionsDialog';
import ClassicItemVerificationAlert from '../../verification/components/ClassicItemVerificationAlert';
import {
  getValidTimedOptionsTypes,
  getValidWearTimeTypes,
  mapAssetTypeToString,
  mapBundleTypeToString,
  SaleLocationEnum,
  DurationOptionsEnum,
  DurationOptions,
} from '../helper/UnifiedFeeSystemConstants';
import { getIsDurableType, getIsRentableType } from '../helper/UnifiedFeeSystemHelper';
import { useRestockState } from '../hooks/useRestockState';
import ItemAttributes from './ItemAttributes';
import ItemAttributesPostPublish from './ItemAttributesPostPublish';
import ItemDetails from './ItemDetails';
import NonSellableSavePanel from './NonSellableSavePanel';
import Pricing from './Pricing';
import PublishPanel from './PublishPanel';
import SaleLocation from './SaleLocation';
import SaleLocationAndRevenue from './SaleLocationAndRevenue';
import SavePanel from './SavePanel';
import VerificationAlert from './VerificationAlert';

interface UnifiedFeeSystemContainerProps {
  itemDetails?: RobloxItemConfigurationApiGetItemResponse;
  collectiblesMetadata?: ItemConfigurationCollectiblesMetadataResponse;
  isBundle: boolean;
  is2dAsset: boolean;
}

// CollectiblesSaleLocationType values as returned by the itemconfiguration GetItem
// saleLocation.saleLocationType field.
const SALE_LOCATION_TYPE_SHOP_AND_ALL_EXPERIENCES = 1;
const SALE_LOCATION_EXPERIENCES_AND_DEV_API_ONLY = 2;
const SALE_LOCATION_TYPE_SHOP_ONLY = 3;
const SALE_LOCATION_TYPE_SHOP_AND_EXPERIENCES_BY_ID = 4;

function getUsedWearTimes() {
  // TODO @mryumae: durables - The used options will be retrieved from itemDetails's new RelatedItems field
  return [DurationOptionsEnum.Permanent];
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
  const [name, setName] = useState(itemDetails?.item?.name ?? '');
  const [description, setDescription] = useState(itemDetails?.item?.description ?? '');

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

  // Restocking state (consolidated in custom hook)
  const [restockState, restockActions] = useRestockState({
    collectibleItemId,
    quantity,
  });
  const {
    originalQuantity,
    hasBeenRestocked,
    restockingFee,
    restockEligible,
    restockIneligibilityReason,
    maxRestockQuantityPerOp,
  } = restockState;
  const { setOriginalQuantity, setHasBeenRestocked } = restockActions;

  const [lastRestockedTime, setLastRestockedTime] = useState<string>();
  const resaleUnlockTime = (() => {
    if (!lastRestockedTime) {
      return undefined;
    }
    const lockDuration = collectiblesMetadata?.restockResaleLockDurationSeconds ?? 7 * 24 * 60 * 60;
    const unlockMs = new Date(lastRestockedTime).getTime() + lockDuration * 1000;
    return new Date(unlockMs).toISOString();
  })();

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
  const { ready: isCollectibleDetailsFlagReady, value: useGetItemCollectibleDetails } = useFlag(
    enableGetItemCollectibleDetails,
  );

  const router = useRouter();
  const isPublishPage = router.pathname.includes('/publish');

  const theme = useTheme();
  const isXlScreen = useMediaQuery(theme.breakpoints.up('XXLarge'));

  useEffect(() => {
    void getValidWearTimeTypes();
    void getValidTimedOptionsTypes();
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
    void getPriceFloor();
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

  // Resolves the selected places (root place ids) from a set of universe ids.
  const resolveSelectedPlaces = useCallback(async (universeIds: number[]) => {
    const origRootPlaceIds: string[] = [];
    for (const uid of universeIds) {
      let universeDetailResponse: RobloxApiDevelopModelsUniverseModel;
      try {
        universeDetailResponse = await developClient.getUniverseDetails(uid);
        if (universeDetailResponse?.rootPlaceId) {
          origRootPlaceIds.push(`${universeDetailResponse?.rootPlaceId}`);
        }
      } catch {
        // will not include root place in response
      }
    }
    setSelectedPlaces(origRootPlaceIds);
  }, []);

  // GetItem-sourced path reads collectible details from the GetItem response. Kept in its own
  // effect that depends on itemDetails so provider refetches do not re-run the legacy path below.
  useEffect(() => {
    // GetItem-sourced path: reads all collectible details from the GetItem response instead of
    // calling IsCollectibleItem, GetItemConfiguration, and marketplace-items-api
    // GetCollectibleItemsDetails.
    async function applyCollectibleDataFromGetItem() {
      const item = itemDetails?.item;
      const collectibleDetails = item?.collectibleDetails;
      if (!item?.isCollectible || !collectibleDetails?.collectibleItemId) {
        return;
      }
      setCollectibleItemId(collectibleDetails.collectibleItemId);
      setIsCollectible(true);

      const isItemOnSale =
        item.saleStatus === RobloxItemConfigurationApiMarketplaceItemSaleStatusEnum.NUMBER_0;
      setIsOnSale(isItemOnSale);
      setIsLimited(
        item.collectibleItemType ===
          RobloxItemConfigurationApiMarketplaceItemCollectibleItemTypeEnum.NUMBER_1,
      );

      // Total quantity is sourced directly from the GetItem response instead of a separate
      // catalog-api call.
      setQuantity(collectibleDetails.totalQuantity ?? undefined);
      setOriginalQuantity(collectibleDetails.totalQuantity ?? undefined);

      setHasBeenRestocked((collectibleDetails.totalRestockedQuantity ?? 0) > 0);
      setLastRestockedTime(collectibleDetails.lastRestockedTime?.toISOString() ?? undefined);
      // Eligibility fetch is handled by useRestockState hook via collectibleItemId dependency.

      setLimit(collectibleDetails.quantityLimitPerUser ?? undefined);
      setInitialLimit(collectibleDetails.quantityLimitPerUser ?? undefined);
      // A collectible is free when it has no dynamic price configuration.
      const isItemFree = (item.isCollectible ?? false) && item.dynamicPriceConfiguration == null;
      if (isItemFree) {
        setIsFree(true);
      } else {
        setPriceOffset(item.dynamicPriceConfiguration?.priceOffset);
        const minPrice = item.dynamicPriceConfiguration?.minimumPrice;
        if (minPrice !== 1) {
          setOptionalPriceFloor(minPrice);
        }
      }
      setIsResellable(collectibleDetails.isResellable ?? false);
      setOriginalIsResellable(collectibleDetails.isResellable ?? false);

      const saleLocationType = item.saleLocation?.saleLocationType;
      if (saleLocationType === SALE_LOCATION_TYPE_SHOP_AND_ALL_EXPERIENCES) {
        setSaleLocation(SaleLocationEnum.MarketplaceAndAllExperiences);
      } else if (saleLocationType === SALE_LOCATION_TYPE_SHOP_ONLY) {
        setSaleLocation(SaleLocationEnum.MarketplaceOnly);
      } else if (
        saleLocationType === SALE_LOCATION_EXPERIENCES_AND_DEV_API_ONLY ||
        saleLocationType === SALE_LOCATION_TYPE_SHOP_AND_EXPERIENCES_BY_ID
      ) {
        setSaleLocation(
          saleLocationType === SALE_LOCATION_EXPERIENCES_AND_DEV_API_ONLY
            ? SaleLocationEnum.ExperiencesAndDevAPIOnly
            : SaleLocationEnum.MarketplaceAndExperiencesById,
        );
        await resolveSelectedPlaces(item.saleLocation?.universeIds ?? []);
      }

      // Set scheduledStartDate and scheduledEndDate if scheduled publishing is enabled
      if (collectiblesMetadata?.isScheduledPublishingEnabled) {
        setOriginalSaleStatus(isItemOnSale);

        // There is a pre-existing scheduled sale
        if (item.scheduledRelease) {
          const { onSaleTime, offSaleTime } = item.scheduledRelease;
          const startDate = onSaleTime?.seconds ? new Date(onSaleTime.seconds * 1000) : null;
          const endDate = offSaleTime?.seconds ? new Date(offSaleTime.seconds * 1000) : null;
          setScheduledStartDate(startDate);
          setScheduledEndDate(endDate);
          setPreSaveScheduledStartDate(startDate);
          setPreSaveScheduledEndDate(endDate);
        }
      }
    }

    if (!isCollectibleDetailsFlagReady || !useGetItemCollectibleDetails) {
      return;
    }

    void applyCollectibleDataFromGetItem();
  }, [
    collectiblesMetadata?.isScheduledPublishingEnabled,
    isCollectibleDetailsFlagReady,
    useGetItemCollectibleDetails,
    itemDetails?.item,
    setHasBeenRestocked,
    setOriginalQuantity,
    resolveSelectedPlaces,
  ]);

  // Legacy path: resolves the collectible id via IsCollectibleItem, then hydrates details from
  // marketplace-items-api GetCollectibleItemsDetails and GetItemConfiguration. This effect does
  // not depend on itemDetails, so provider refetches do not re-trigger these calls or reset
  // locally edited state.
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
        setOriginalQuantity(collectibleAssetDetails?.totalQuantity);

        setHasBeenRestocked((collectibleDetails?.totalRestockedQuantity ?? 0) > 0);
        setLastRestockedTime(collectibleDetails?.lastRestockedTime ?? undefined);
        // Eligibility fetch is handled by useRestockState hook via collectibleItemId dependency.

        setLimit(collectibleDetails?.quantityLimitPerUser);
        setInitialLimit(collectibleDetails?.quantityLimitPerUser);
        if (collectibleDetails?.price === 0) {
          setIsFree(true);
        } else {
          const dynamicPriceDataResponse =
            await itemconfigurationClient.getDynamicPriceConfiguration(collectibleItemIdValue);
          setPriceOffset(dynamicPriceDataResponse?.dynamicPriceConfiguration?.priceOffset);
          const minPrice = dynamicPriceDataResponse?.dynamicPriceConfiguration?.minimumPrice;
          if (minPrice !== 1) {
            setOptionalPriceFloor(minPrice);
          }
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

          await resolveSelectedPlaces(collectibleDetails?.universeIds ?? []);
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

    // Wait for the flag to resolve so the legacy endpoints are not called when the
    // GetItem-sourced path is enabled.
    if (!isCollectibleDetailsFlagReady || useGetItemCollectibleDetails) {
      return;
    }

    void fetchCollectiblesData();
  }, [
    targetId,
    isBundle,
    collectiblesMetadata?.isScheduledPublishingEnabled,
    isCollectible,
    setHasBeenRestocked,
    setOriginalQuantity,
    isCollectibleDetailsFlagReady,
    useGetItemCollectibleDetails,
    resolveSelectedPlaces,
  ]);

  useEffect(() => {
    if (!description) {
      setIsSaveDisabled(true);
    } else {
      setIsSaveDisabled(false);
    }
  }, [isBundle, isOnSale, itemType, collectiblesMetadata, description]);

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

  // Fee debouncing is handled by useRestockState hook.

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

    void fetchRentalPricingPreview();
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
          <>
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
                setQuantity={setQuantity}
                originalQuantity={originalQuantity}
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
                isRestockEnabled={restockEligible}
                hasBeenRestocked={hasBeenRestocked}
                restockIneligibilityReason={restockIneligibilityReason}
                maxRestockQuantityPerOp={maxRestockQuantityPerOp}
                resaleUnlockTime={resaleUnlockTime}
                restockingFee={restockingFee}
                isRentableType={isRentableType}
                isRentableOptIn={isRentableOptIn}
                setIsRentableOptIn={setIsRentableOptIn}
              />
            )}
            <Divider style={{ margin: '40px 0' }} />
          </>
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
              minimumPrice={optionalPriceFloor ?? 1}
              isFree={isFree}
              isAvatarItemLicensingEnabled={
                collectiblesMetadata?.isAvatarItemLicensingEnabled ?? false
              }
            />
          ) : (
            <SaleLocation
              saleLocation={saleLocation}
              setSaleLocation={setSaleLocation}
              selectedPlaces={selectedPlaces}
              setSelectedPlaces={setSelectedPlaces}
              availablePlaces={availablePlaces}
              setAvailablePlaces={setAvailablePlaces}
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
            priceOffset={priceOffset}
            optionalPriceFloor={optionalPriceFloor}
            isFree={isFree}
            saleLocation={saleLocation}
            selectedPlaces={selectedPlaces}
            name={name}
            description={description}
            scheduledStartDate={scheduledStartDate}
            scheduledEndDate={scheduledEndDate}
            optOutFromRegionalPricing={isOptOutRegionalPricing}
            wearTime={wearTime}
            isRentableOptIn={isRentableOptIn}
            priceFloor={priceFloor}
            itemDetails={itemDetails}
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
            isFree={isFree}
            saleLocation={saleLocation}
            selectedPlaces={selectedPlaces}
            isSaveDisabled={isSaveDisabled}
            collectiblesMetadata={collectiblesMetadata}
            scheduledStartDate={scheduledStartDate}
            scheduledEndDate={scheduledEndDate}
            scheduledSaleChanged={scheduledSaleChanged}
            setOriginalSaleStatus={setOriginalSaleStatus}
            setOriginalIsResellable={setOriginalIsResellable}
            setPreSaveScheduledStartDate={setPreSaveScheduledStartDate}
            setPreSaveScheduledEndDate={setPreSaveScheduledEndDate}
            optOutFromRegionalPricing={isOptOutRegionalPricing}
            isRentableOptIn={isRentableOptIn}
            displayInfoChanged={displayInfoChanged}
            quantity={quantity}
            originalQuantity={originalQuantity}
            restockingFee={restockingFee}
            setQuantity={setQuantity}
            setOriginalQuantity={setOriginalQuantity}
            setLastRestockedTime={setLastRestockedTime}
            maxRestockQuantityPerOp={maxRestockQuantityPerOp}
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
    originalQuantity,
    hasBeenRestocked,
    restockingFee,
    restockEligible,
    setOriginalQuantity,
    restockIneligibilityReason,
    resaleUnlockTime,
    maxRestockQuantityPerOp,
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
        isHd={isHd}
      />
      {itemAttributes}
    </div>
  );
}

export default UnifiedFeeSystemContainer;
