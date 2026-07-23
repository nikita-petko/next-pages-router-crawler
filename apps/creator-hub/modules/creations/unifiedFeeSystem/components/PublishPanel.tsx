import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  RobloxItemConfigurationApiModelsRequestCollectiblesSaleLocationConfigurationModel,
  RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum,
} from '@rbx/client-itemconfiguration/v1';
import {
  V1PermissionsItemTypesGetActionEnum,
  V1PermissionsItemTypesGetTargetTypesEnum,
} from '@rbx/client-itemconfiguration/v1';
import { uuidService } from '@rbx/core';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  DialogTemplate,
  Divider,
  Grid,
  InfoOutlinedIcon,
  Link,
  RobuxIcon,
  Typography,
  useSnackbar,
  useTheme,
  alpha,
  makeStyles,
} from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import type { ItemConfigurationCollectiblesMetadataResponse } from '@modules/clients/itemconfiguration';
import itemconfigurationClient from '@modules/clients/itemconfiguration';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import type { Asset } from '@modules/miscellaneous/common';
import { Item as ItemType } from '@modules/miscellaneous/common';
import {
  MARKETPLACE_POLICY,
  PUBLISHING_ADVANCE,
  ROBLOX_COMMUNITY_STANDARDS,
} from '@modules/miscellaneous/common/constants/linkConstants';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import type { DurationOptionsEnum } from '../helper/UnifiedFeeSystemConstants';
import {
  PUBLISHING_ADVANCE_THRESHOLD,
  SaleLocationEnum,
  mapSaleLocationToType,
} from '../helper/UnifiedFeeSystemConstants';
import {
  getConfigurePageUrl,
  getIsDurableType,
  getIsRentableType,
} from '../helper/UnifiedFeeSystemHelper';

const normalizePublishItemType = (type: string) => type.toLowerCase();

const useStyles = makeStyles()((theme) => ({
  fieldValue: {
    color: alpha(theme.palette.actionV2.primary.fill, 200),
  },
}));

const formatPublishingFees = (fees: number | undefined) => {
  return fees ? fees.toString().replaceAll(/\B(?=(\d{3})+(?!\d))/g, ',') : '-';
};

const marketplacePolicyLink = {
  opening: 'policyLinkStart',
  closing: 'policyLinkEnd',
  content: function PolicyLinkContent(chunks: React.ReactNode) {
    return (
      <Link href={MARKETPLACE_POLICY} target='_blank'>
        {chunks}
      </Link>
    );
  },
};

const communityStandardsLink = {
  opening: 'standardsLinkStart',
  closing: 'standardsLinkEnd',
  content: function StandardsLinkContent(chunks: React.ReactNode) {
    return (
      <Link href={ROBLOX_COMMUNITY_STANDARDS} target='_blank'>
        {chunks}
      </Link>
    );
  },
};

const publishingAdvanceLink = {
  opening: 'publishingAdvanceLinkStart',
  closing: 'publishingAdvanceLinkEnd',
  content: function PublishingAdvanceLinkContent(chunks: React.ReactNode) {
    return (
      <Link href={PUBLISHING_ADVANCE} target='_blank'>
        {chunks}
      </Link>
    );
  },
};

interface PublishPanelProps {
  isOnSale: boolean;
  itemType: string;
  targetId: number;
  isBundle: boolean;
  isLimited: boolean;
  isGroup: boolean;
  creatorTargetId: number | undefined;
  quantity: number | undefined;
  limit: number | undefined;
  isResellable: boolean;
  price: number | undefined;
  priceOffset: number | undefined;
  optionalPriceFloor: number | undefined;
  isFree: boolean;
  saleLocation: SaleLocationEnum;
  selectedPlaces: string[];
  name: string;
  description: string;
  collectiblesMetadata?: ItemConfigurationCollectiblesMetadataResponse;
  scheduledStartDate: Date | null;
  scheduledEndDate: Date | null;
  optOutFromRegionalPricing: boolean;
  wearTime?: DurationOptionsEnum;
  isRentableOptIn: boolean | undefined;
  priceFloor: number;
}

function PublishPanel(props: PublishPanelProps) {
  const {
    isOnSale,
    itemType,
    targetId,
    isBundle,
    isLimited,
    isGroup,
    creatorTargetId,
    quantity,
    limit,
    isResellable,
    price,
    priceOffset,
    optionalPriceFloor,
    isFree,
    saleLocation,
    selectedPlaces,
    name,
    description,
    collectiblesMetadata,
    scheduledStartDate,
    scheduledEndDate,
    optOutFromRegionalPricing,
    wearTime,
    isRentableOptIn,
    priceFloor,
  } = props;
  const [publishingFees, setPublishingFees] = useState<number | undefined>();
  const [showPrepublishDialog, setShowPrepublishDialog] = useState(false);
  const [publishErrorMessage, setPublishErrorMessage] = useState('');
  const [publishErrorCode, setPublishErrorCode] = useState<number | undefined>();
  const [publishErrorTimestamp, setPublishErrorTimestamp] = useState<Date | null>(null);
  const [showPublishErrorDialog, setShowPublishErrorDialog] = useState(false);
  const [showPublishFeeInfoDialog, setShowPublishFeeInfoDialog] = useState(false);
  const [showPublishAdvanceInfoDialog, setShowPublishAdvanceInfoDialog] = useState(false);
  const [isPublishAllowedForItemType, setIsPublishAllowedForItemType] = useState(true);
  const { user } = useAuthentication();
  const { enqueue } = useSnackbar();
  const { translate, translateHTML } = useTranslation();
  const theme = useTheme();
  const { settings } = useSettings();
  const { classes } = useStyles();

  /* oxlint-disable typescript/no-unsafe-type-assertion -- itemType is the mapped Asset/BundleType display string used throughout UFS */
  const isDurableType = getIsDurableType(
    itemType as Asset,
    itemType as RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum,
  );
  const isRentableType = getIsRentableType(
    itemType as Asset,
    itemType as RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum,
  );
  /* oxlint-enable typescript/no-unsafe-type-assertion */
  const isRentablesEnabled = settings?.enableRentables;

  const isScheduled = useMemo(() => {
    return scheduledStartDate !== null || scheduledEndDate !== null;
  }, [scheduledEndDate, scheduledStartDate]);

  const itemPrice = Math.max(
    optionalPriceFloor ?? 1,
    priceOffset ? priceFloor + priceOffset : priceFloor,
  );

  const isPublishAllowed =
    !(isLimited && !quantity) && !!description && isPublishAllowedForItemType;

  useEffect(() => {
    async function fetchAllowedPublishTypes() {
      try {
        // Action type 6 = publish permission check for current asset/bundle type
        const response = await itemconfigurationClient.getAllowedAssetTypes(
          V1PermissionsItemTypesGetActionEnum.NUMBER_6,
          [
            V1PermissionsItemTypesGetTargetTypesEnum.NUMBER_0,
            V1PermissionsItemTypesGetTargetTypesEnum.NUMBER_1,
          ],
        );

        const allowedTypes = [
          ...(response.allowedAssetTypes?.map(normalizePublishItemType) ?? []),
          ...(response.allowedBundleTypes?.map(normalizePublishItemType) ?? []),
        ];
        setIsPublishAllowedForItemType(allowedTypes.includes(normalizePublishItemType(itemType)));
      } catch {
        setIsPublishAllowedForItemType(true);
      }
    }
    void fetchAllowedPublishTypes();
  }, [itemType]);

  useEffect(() => {
    async function fetchPublishingFees() {
      try {
        if (!isLimited) {
          // TODO @mryumae: durables - pass wear time to getCollectiblePublishingFees
          const getCollectiblePublishingFeesResponse =
            await itemconfigurationClient.getCollectiblePublishingFees(
              isBundle,
              targetId,
              0,
              2,
              saleLocation,
              isResellable,
              isFree,
            );
          if (getCollectiblePublishingFeesResponse) {
            setPublishingFees(getCollectiblePublishingFeesResponse.publishingFeeInRobux);
          }
        } else if (quantity) {
          const getCollectiblePublishingFeesResponse =
            await itemconfigurationClient.getCollectiblePublishingFees(
              isBundle,
              targetId,
              parseInt(quantity.toString(), 10),
              isLimited ? 1 : 2,
              saleLocation,
              isResellable,
              isFree,
            );
          if (getCollectiblePublishingFeesResponse) {
            setPublishingFees(getCollectiblePublishingFeesResponse.publishingFeeInRobux);
          }
        } else {
          setPublishingFees(undefined);
        }
      } catch {
        setPublishingFees(undefined);
      }
    }

    void fetchPublishingFees();
  }, [quantity, isBundle, targetId, isLimited, saleLocation, isResellable, isFree]);

  const showSuccessToast = useCallback(() => {
    enqueue(
      {
        message: (
          <span data-testid='success-message'>
            {translate('Message.assetUpdateSuccess', {
              assetType: itemType,
            })}
          </span>
        ),
        autoHide: true,
      },
      (reason) => reason === 'timeout',
    );
  }, [enqueue, translate, itemType]);

  const navigateToConfigurePage = useCallback(() => {
    const itemTypePath = isBundle ? ItemType.Bundle : ItemType.CatalogAsset;
    window.location.href = getConfigurePageUrl(itemTypePath, targetId);
  }, [isBundle, targetId]);

  const handleSaveChanges = async () => {
    try {
      await itemconfigurationClient.updateCollectibleItemDisplayInfo(
        isBundle,
        targetId,
        name,
        description,
      );
      showSuccessToast();
    } catch {
      setPublishErrorMessage('Message.ErrorSavingChanges');
      setShowPublishErrorDialog(true);
    }
  };

  const publishCollectibleItem = useCallback(async () => {
    setShowPrepublishDialog(false);
    if (saleLocation === SaleLocationEnum.Invalid) {
      setPublishErrorMessage('Message.MissingSaleLocations');
      setShowPublishErrorDialog(true);
      return;
    }

    const saleLocationModel: RobloxItemConfigurationApiModelsRequestCollectiblesSaleLocationConfigurationModel =
      {
        saleLocationType: mapSaleLocationToType(saleLocation),
        places:
          saleLocation === SaleLocationEnum.ExperiencesAndDevAPIOnly ||
          saleLocation === SaleLocationEnum.MarketplaceAndExperiencesById
            ? selectedPlaces.map(Number)
            : [],
      };

    const publishUserId = isGroup ? undefined : creatorTargetId;
    const publishGroupId = isGroup ? creatorTargetId : undefined;
    const publishPublisherId = isGroup ? user?.id : undefined;
    let priceInRobux;
    if (isFree) {
      priceInRobux = 0;
    } else if (isBundle && collectiblesMetadata?.isNewBundleUIEnabled === false) {
      priceInRobux = price ?? 0;
    } else if (optionalPriceFloor && optionalPriceFloor > 0) {
      priceInRobux = optionalPriceFloor;
    } else {
      priceInRobux = 1;
    }
    try {
      // TODO @mryumae: durables - add wearTime to the request
      // TODO @mryumae: if publishing variant, call new endpoint
      await itemconfigurationClient.publishCollectible(
        uuidService.generateRandomUuid(),
        targetId,
        isBundle,
        isLimited,
        publishingFees ?? 0,
        publishUserId,
        publishGroupId,
        publishPublisherId,
        quantity ?? 0,
        limit ?? 0,
        isResellable,
        priceInRobux,
        priceOffset ?? 0,
        isFree,
        saleLocationModel,
        name,
        description,
        scheduledStartDate,
        scheduledEndDate,
        optOutFromRegionalPricing,
        isRentableOptIn,
      );
      showSuccessToast();
      navigateToConfigurePage();
    } catch (e) {
      const error = await tryParseResponseError(e);

      setPublishErrorCode(error?.code);
      setPublishErrorTimestamp(new Date());
      // Values from Roblox.ItemConfiguration.Api.Enums.CollectibleErrors
      switch (error?.code) {
        case undefined:
          setPublishErrorMessage('Message.UnknownError');
          break;
        case 9:
          setPublishErrorMessage('Message.LimitedPublishLimit');
          break;
        case 12:
          setPublishErrorMessage('Message.MissingGroupPermission');
          break;
        case 14:
          setPublishErrorMessage('Message.ItemPendingReview');
          break;
        case 15:
          setPublishErrorMessage('Message.ItemIsModeratedOrPendingReview');
          break;
        case 18:
          setPublishErrorMessage('Message.UserDoesNotOwnItem');
          break;
        case 19:
          setPublishErrorMessage('Message.ItemPriceTooLow');
          break;
        case 20:
          setPublishErrorMessage('Message.ItemPriceTooHigh');
          break;
        case 21:
          setPublishErrorMessage('Message.AssetIdInvalid');
          break;
        case 26:
          setPublishErrorMessage('Message.NameOrDescriptionModerated');
          break;
        case 28:
          setPublishErrorMessage('Message.L2PreviouslyOnSale');
          break;
        case 35:
          setPublishErrorMessage('Message.QuantityInvalid');
          break;
        case 44:
          setPublishErrorMessage('Message.InvalidQuantityLimit');
          break;
        case 45:
          setPublishErrorMessage('Message.AssetCopyOfPublished');
          break;
        case 52:
          setPublishErrorMessage('Message.ItemIsModeratedOrPendingReview');
          break;
        case 59:
          setPublishErrorMessage('Message.PriceOffsetInvalid');
          break;
        case 60:
          setPublishErrorMessage('Message.MinimumPriceInvalid');
          break;
        case 61:
          setPublishErrorMessage('Message.InvalidSaleStatus');
          break;
        case 70:
          setPublishErrorMessage('Message.NotEnoughRobux');
          break;
        case 72:
          setPublishErrorMessage('Message.ItemIsModeratedOrPendingReview');
          break;
        case 75:
          setPublishErrorMessage('Message.ItemHasArchivedDependencies');
          break;
        case 76:
          setPublishErrorMessage('Message.ItemIsDelisted');
          break;
        case 79:
          setPublishErrorMessage('Message.InvalidSaleLocation');
          break;
        case 101:
          // Value 101 is shared across multiple error enums used in Roblox.ItemConfiguration.Api
          setPublishErrorMessage('Message.CalendarQuotaLimit');
          break;
        case 106:
          setPublishErrorMessage('Message.MissingIdVerification');
          break;
        case 125:
          setPublishErrorMessage('Message.MissingTwoStepVerification');
          break;
        case 107:
          setPublishErrorMessage('Message.CreationAccessBlocked');
          break;
        case 108:
          setPublishErrorMessage('Message.MissingPremiumSubscription');
          break;
        case 109:
          setPublishErrorMessage('Message.GroupOwnerMissingPremiumSubscription');
          break;
        case 118:
          setPublishErrorMessage('Message.GrantedItemCannotBePublished');
          break;
        case 122:
          setPublishErrorMessage('Message.NameIsInvalid');
          break;
        case 123:
          setPublishErrorMessage('Message.DescriptionIsInvalid');
          break;
        default:
          setPublishErrorMessage('Message.UnknownError');
      }
      setShowPublishErrorDialog(true);
    }
  }, [
    saleLocation,
    selectedPlaces,
    isGroup,
    creatorTargetId,
    user?.id,
    isFree,
    isBundle,
    collectiblesMetadata?.isNewBundleUIEnabled,
    optionalPriceFloor,
    targetId,
    price,
    isLimited,
    publishingFees,
    quantity,
    limit,
    isResellable,
    priceOffset,
    name,
    description,
    scheduledStartDate,
    scheduledEndDate,
    optOutFromRegionalPricing,
    isRentableOptIn,
    showSuccessToast,
    navigateToConfigurePage,
  ]);

  return (
    <div>
      {isOnSale || isScheduled ? (
        <Grid container item XSmall={12} rowGap={2} marginTop='32px' alignItems='center'>
          <Grid item XSmall={12} Large={9} alignItems='center' container paddingRight={12}>
            <Typography
              variant='h5'
              style={{ fontSize: '24px', fontWeight: '450', marginRight: '12px' }}>
              {translate(isFree ? 'Label.PublishFeeInfoDialogTitle' : 'Label.PublishingAdvance')}
            </Typography>

            <RobuxIcon />
            <Typography style={{ fontSize: '24px', fontWeight: '425', margin: '0 8px' }}>
              {formatPublishingFees(publishingFees)}
            </Typography>
            <Button
              onClick={() =>
                isFree ? setShowPublishFeeInfoDialog(true) : setShowPublishAdvanceInfoDialog(true)
              }>
              <InfoOutlinedIcon color='secondary' />
            </Button>
            <br />
            <Typography variant='body2' style={{ marginTop: '8px' }} className={classes.fieldValue}>
              {translateHTML(
                'Message.PolicyDisclaimer',
                [marketplacePolicyLink, communityStandardsLink],
                {
                  lineBreak: <br />,
                },
              )}
            </Typography>
          </Grid>
          <Grid item XSmall={12} Large={3}>
            <Button
              variant='contained'
              onClick={() => setShowPrepublishDialog(true)}
              disabled={!isPublishAllowed}
              style={{ padding: '8px 50px' }}>
              {translate('Action.PublishItem')}
            </Button>
          </Grid>
        </Grid>
      ) : (
        <Button variant='contained' onClick={handleSaveChanges} style={{ padding: '8px 50px' }}>
          {translate('Action.SaveChanges')}
        </Button>
      )}
      <Dialog open={showPrepublishDialog}>
        <DialogTemplate
          onConfirm={publishCollectibleItem}
          onCancel={() => setShowPrepublishDialog(false)}
          title=''
          content={
            <div
              style={{
                minWidth: '580px',
                padding: '0 10px 10px 10px',
                color: theme.palette.mode === 'light' ? 'black' : 'white',
              }}>
              <div style={{ textAlign: 'center' }}>
                <Typography style={{ fontSize: '20px', fontWeight: '450' }}>
                  {translate('Label.ConfirmPublish')}
                </Typography>
              </div>
              <Divider style={{ margin: '24px 0' }} />
              <Typography>{translate('Label.PrepublishDialogDescription')}</Typography>

              <Grid container item XSmall={12} alignItems='center' marginTop='24px' padding='16px'>
                <Grid item XSmall={6}>
                  <Typography style={{ fontSize: '14px', fontWeight: '400' }}>
                    {translate('Label.ItemType')}
                  </Typography>
                </Grid>
                <Grid item XSmall={6}>
                  <Typography variant='body2' className={classes.fieldValue}>
                    {translate(isLimited ? 'Label.Limited' : 'Label.NonLimited')}
                  </Typography>
                </Grid>
              </Grid>
              <Divider />

              {isRentablesEnabled && isRentableType && (
                <>
                  <Grid container item XSmall={12} alignItems='center' padding='16px'>
                    <Grid item XSmall={6}>
                      <Typography style={{ fontSize: '14px', fontWeight: '400' }}>
                        {translate('Title.TimedOptions')}
                      </Typography>
                    </Grid>
                    <Grid item XSmall={6}>
                      <Typography variant='body2' className={classes.fieldValue}>
                        {translate(isRentableOptIn ? 'Label.Enabled' : 'Label.Disabled')}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Divider />
                </>
              )}

              {isDurableType && (
                <>
                  <Grid container item XSmall={12} alignItems='center' padding='16px'>
                    <Grid item XSmall={6}>
                      <Typography style={{ fontSize: '14px', fontWeight: '400' }}>
                        {translate('Label.Duration')}
                      </Typography>
                    </Grid>
                    <Grid item XSmall={6}>
                      <Typography variant='body2' className={classes.fieldValue}>
                        {translate(`Action.${wearTime}`)}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Divider />
                </>
              )}

              {isBundle && !settings.allowUpdatingBundleName && (
                <>
                  <Grid container item XSmall={12} alignItems='center' padding='16px'>
                    <Grid item XSmall={6}>
                      <Typography style={{ fontSize: '14px', fontWeight: '400' }}>
                        {translate('Label.ItemName')}
                      </Typography>
                    </Grid>
                    <Grid item XSmall={6}>
                      <Typography variant='body2' className={classes.fieldValue}>
                        {name}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Divider />
                </>
              )}

              {isLimited && (
                <>
                  <Grid container item XSmall={12} alignItems='center' padding='16px'>
                    <Grid item XSmall={6}>
                      <Typography style={{ fontSize: '14px', fontWeight: '400' }}>
                        {translate('Label.Quantity')}
                      </Typography>
                    </Grid>
                    <Grid item XSmall={6}>
                      <Typography variant='body2' className={classes.fieldValue}>
                        {quantity}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Divider />
                </>
              )}

              {isLimited && limit !== undefined && (
                <>
                  <Grid container item XSmall={12} alignItems='center' padding='16px'>
                    <Grid item XSmall={6}>
                      <Typography style={{ fontSize: '14px', fontWeight: '400' }}>
                        {translate('Label.LimitCopiesPerUser')}
                      </Typography>
                    </Grid>
                    <Grid item XSmall={6}>
                      <Typography variant='body2' className={classes.fieldValue}>
                        {limit} ({translate('Label.CanOnlyBeIncreased')})
                      </Typography>
                    </Grid>
                  </Grid>
                  <Divider />
                </>
              )}

              <Grid container item XSmall={12} alignItems='center' padding='16px'>
                <Grid item XSmall={6}>
                  <Typography style={{ fontSize: '14px', fontWeight: '400' }}>
                    {translate('Label.FreeItem')}
                  </Typography>
                </Grid>
                <Grid item XSmall={6}>
                  <Typography variant='body2' className={classes.fieldValue}>
                    {translate(isFree ? 'Action.Yes' : 'Action.No')}
                  </Typography>
                </Grid>
              </Grid>
              <Divider />

              {isResellable && (
                <>
                  <Grid container item XSmall={12} alignItems='center' padding='16px'>
                    <Grid item XSmall={6}>
                      <Typography style={{ fontSize: '14px', fontWeight: '400' }}>
                        {translate('Label.Resellable')}
                      </Typography>
                    </Grid>
                    <Grid item XSmall={6}>
                      <Typography variant='body2' className={classes.fieldValue}>
                        {translate('Action.Yes')}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Divider />
                </>
              )}

              {saleLocation === SaleLocationEnum.MarketplaceAndAllExperiences && (
                <>
                  <Grid container item XSmall={12} alignItems='center' padding='16px'>
                    <Grid item XSmall={6}>
                      <Typography style={{ fontSize: '14px', fontWeight: '400' }}>
                        {translate('Label.SaleLocation')}
                      </Typography>
                    </Grid>
                    <Grid item XSmall={6}>
                      <Typography variant='body2' className={classes.fieldValue}>
                        {translate('Label.MarketplaceAndAllExperiences')}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Divider />
                </>
              )}

              {isScheduled && (
                <>
                  <Grid container item XSmall={12} alignItems='center' padding='16px'>
                    <Grid item XSmall={6}>
                      <Typography style={{ fontSize: '14px', fontWeight: '400' }}>
                        {translate('Label.ScheduledSale')}
                      </Typography>
                    </Grid>
                    <Grid container item XSmall={6}>
                      <Grid item>
                        {scheduledStartDate && (
                          <Typography variant='body2' className={classes.fieldValue}>
                            {translate('Message.ScheduledStartDate', {
                              date: scheduledStartDate.toLocaleString(),
                            })}
                          </Typography>
                        )}
                      </Grid>
                      <Grid item>
                        {scheduledEndDate && (
                          <Typography variant='body2' className={classes.fieldValue}>
                            {translate('Message.ScheduledEndDate', {
                              date: scheduledEndDate.toLocaleString(),
                            })}
                          </Typography>
                        )}
                      </Grid>
                    </Grid>
                  </Grid>
                  <Divider />
                </>
              )}

              {itemPrice * PUBLISHING_ADVANCE_THRESHOLD > (publishingFees ?? 0) && (
                <div style={{ marginTop: '20px' }}>
                  <Typography variant='body2' color='primary' style={{ marginTop: '8px' }}>
                    {translateHTML('Message.PublishingAdvanceDisclaimer', [publishingAdvanceLink])}
                  </Typography>
                </div>
              )}
            </div>
          }
          confirmText={translate('Action.PayAndPublish')}
          cancelText={translate('Action.Cancel')}
        />
      </Dialog>
      <Dialog open={showPublishErrorDialog}>
        <DialogTitle>
          {translate(isOnSale ? 'Message.PublishingUnsuccessful' : 'Message.SavingUnsuccessful')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Typography variant='body1'>
              {translate('Message.PublishErrorMsgPrefix')} {translate(publishErrorMessage)}
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Grid container item direction='column'>
            {publishErrorCode !== undefined && (
              <>
                <Grid item>
                  <Typography variant='body2' color='disabled'>
                    {translate('Label.ErrorCode', { errorCode: publishErrorCode.toString() })}
                  </Typography>
                </Grid>
                <Grid item>
                  <Typography variant='body2' color='disabled'>
                    {publishErrorTimestamp?.toISOString()}
                  </Typography>
                </Grid>
              </>
            )}
          </Grid>
          <Button
            size='large'
            variant='contained'
            aria-label={translate('Action.Ok')}
            color='primaryBrand'
            onClick={() => setShowPublishErrorDialog(false)}>
            {translate('Action.Ok')}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={showPublishFeeInfoDialog}>
        <DialogTemplate
          onConfirm={() => setShowPublishFeeInfoDialog(false)}
          onCancel={() => {
            window.open(
              `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/en-us/art/marketplace/marketplace-fees-and-commissions#per-unit-fee`,
              '_blank',
            );
            setShowPublishFeeInfoDialog(false);
          }}
          title={translate('Label.PublishFeeInfoDialogTitle')}
          content={translate('Label.PublishFeeInfoDialogDescription')}
          confirmText={translate('Action.Ok')}
          cancelText={translate('Action.LearnMore')}
        />
      </Dialog>
      <Dialog open={showPublishAdvanceInfoDialog}>
        <DialogTemplate
          onConfirm={() => setShowPublishAdvanceInfoDialog(false)}
          onCancel={() => {
            window.open(
              `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/en-us/art/marketplace/marketplace-fees-and-commissions#publishing-advance`,
              '_blank',
            );
            setShowPublishAdvanceInfoDialog(false);
          }}
          title=''
          content={
            <div
              style={{
                minWidth: '580px',
                padding: '0 10px 10px 10px',
                color: theme.palette.mode === 'light' ? 'black' : 'white',
              }}>
              <Typography style={{ fontWeight: '450', fontSize: '20px' }}>
                {translate('Label.PublishAdvanceInfoDialogTitle')}
              </Typography>
              <Divider style={{ margin: '24px 0' }} />
              <Typography>{translate('Label.PublishAdvanceInfoDialogInfo')}</Typography>
              <br />
              <br />
              <Typography>{translate('Label.PublishAdvanceInfoDialogExample')}</Typography>
              <img
                src={`${process.env.assetPathPrefix}/unifiedFeeSystem/PublishAdvanceInfoTable.png`}
                alt='publish-advance-info-table'
                style={{ maxWidth: '100%', height: 'auto', marginTop: '16px' }}
              />
            </div>
          }
          confirmText={translate('Action.Done')}
          cancelText={translate('Action.LearnMore')}
        />
      </Dialog>
    </div>
  );
}

export default PublishPanel;
