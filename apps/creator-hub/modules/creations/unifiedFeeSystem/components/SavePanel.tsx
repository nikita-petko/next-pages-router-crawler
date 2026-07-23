import React, { useCallback, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogTemplate,
  Divider,
  Grid,
  makeStyles,
  RobuxIcon,
  Typography,
  useSnackbar,
  useTheme,
} from '@rbx/ui';
import type { ItemConfigurationCollectiblesMetadataResponse } from '@modules/clients/itemconfiguration';
import itemConfigurationClient from '@modules/clients/itemconfiguration';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import { buildSaleLocationModel, computePriceInRobux } from '../helper/savePanelRequestBuilder';
import { DefaultMaxCollectiblePrice, SaleLocationEnum } from '../helper/UnifiedFeeSystemConstants';
import RestockConfirmDialog, { CONFIRM_DIALOG_MIN_WIDTH } from './RestockConfirmDialog';

interface SavePanelProps {
  updateDisplayInfoOnly: boolean;
  isBundle: boolean;
  targetId: number;
  name: string;
  description: string;
  collectibleItemId: string;
  isOnSale: boolean;
  limit: number | undefined;
  isResellable: boolean;
  originalIsResellable: boolean;
  optionalPriceFloor: number | undefined;
  priceOffset: number | undefined;
  price: number | undefined;
  isFree: boolean;
  saleLocation: SaleLocationEnum;
  selectedPlaces: string[];
  isSaveDisabled: boolean;
  collectiblesMetadata?: ItemConfigurationCollectiblesMetadataResponse;
  scheduledStartDate?: Date | null;
  scheduledEndDate?: Date | null;
  scheduledSaleChanged?: boolean;
  setOriginalSaleStatus?: (isOnSale: boolean) => void;
  setOriginalIsResellable?: (isResellable: boolean) => void;
  setPreSaveScheduledStartDate?: (originalStartDate: Date | null) => void;
  setPreSaveScheduledEndDate?: (originalEndDate: Date | null) => void;
  optOutFromRegionalPricing: boolean;
  isRentableOptIn: boolean | undefined;
  displayInfoChanged: boolean;
  quantity?: number;
  originalQuantity?: number;
  restockingFee?: number;
  setQuantity?: (quantity: number) => void;
  setOriginalQuantity?: (quantity: number) => void;
  setLastRestockedTime?: (time: string) => void;
  maxRestockQuantityPerOp?: number;
}

const useStyles = makeStyles()(() => ({
  saveButton: {
    whiteSpace: 'nowrap',
    minWidth: '130px',
  },
}));

function SavePanel(props: SavePanelProps) {
  const {
    updateDisplayInfoOnly,
    isBundle,
    targetId,
    name,
    description,
    collectibleItemId,
    isOnSale,
    limit,
    isResellable,
    originalIsResellable,
    optionalPriceFloor,
    priceOffset,
    price,
    isFree,
    saleLocation,
    selectedPlaces,
    isSaveDisabled,
    collectiblesMetadata,
    scheduledStartDate,
    scheduledEndDate,
    scheduledSaleChanged,
    setOriginalSaleStatus,
    setOriginalIsResellable,
    setPreSaveScheduledStartDate,
    setPreSaveScheduledEndDate,
    optOutFromRegionalPricing,
    isRentableOptIn,
    displayInfoChanged,
    quantity,
    originalQuantity,
    restockingFee,
    setOriginalQuantity,
    setLastRestockedTime,
    maxRestockQuantityPerOp,
  } = props;
  const [saveErrorMessage, setSaveErrorMessage] = useState('');
  const [showSaveErrorDialog, setShowSaveErrorDialog] = useState(false);
  const [showPresaveDialog, setShowPresaveDialog] = useState(false);
  const [showRestockDialog, setShowRestockDialog] = useState(false);
  const [isRestocking, setIsRestocking] = useState(false);
  const { translate } = useTranslation();
  const theme = useTheme();
  const {
    classes: { saveButton },
  } = useStyles();

  const { enqueue } = useSnackbar();
  const showSuccessToast = useCallback(() => {
    enqueue(
      {
        message: (
          <span data-testid='success-message'>{translate('Message.ChangesSuccessfullySaved')}</span>
        ),
        autoHide: true,
      },
      (reason) => reason === 'timeout',
    );
  }, [enqueue, translate]);

  const maxCollectiblePrice =
    collectiblesMetadata?.maxCollectiblePrice ?? DefaultMaxCollectiblePrice;
  const priceValid =
    (optionalPriceFloor === undefined || optionalPriceFloor <= maxCollectiblePrice) &&
    (priceOffset === undefined || priceOffset <= maxCollectiblePrice);
  const additionalQty =
    quantity !== undefined && originalQuantity !== undefined ? quantity - originalQuantity : 0;
  const restockQuantityValid =
    additionalQty <= 0 ||
    maxRestockQuantityPerOp === undefined ||
    additionalQty <= maxRestockQuantityPerOp;
  const isSaveAllowed = !isSaveDisabled && priceValid && restockQuantityValid;

  const pendingRestock =
    quantity !== undefined && originalQuantity !== undefined && quantity > originalQuantity;

  const handleSaveChanges = async () => {
    setShowPresaveDialog(false);
    setShowRestockDialog(false);
    if (saleLocation === SaleLocationEnum.Invalid) {
      setSaveErrorMessage('Message.MissingSaleLocations');
      setShowSaveErrorDialog(true);
      return;
    }

    const saleLocationModel = buildSaleLocationModel(saleLocation, selectedPlaces);

    let restockSucceeded = false;

    try {
      if (displayInfoChanged) {
        await itemConfigurationClient.updateCollectibleItemDisplayInfo(
          isBundle,
          targetId,
          name,
          description,
        );
      }

      if (updateDisplayInfoOnly) {
        showSuccessToast();
        return;
      }

      // Perform restock first, then config update. Track restock success separately
      // so we can surface partial-success if the config update fails afterward.
      if (pendingRestock && restockingFee !== undefined) {
        setIsRestocking(true);
        const newTotalQuantity = quantity;
        await itemConfigurationClient.restockCollectible(
          collectibleItemId,
          newTotalQuantity,
          restockingFee,
        );
        restockSucceeded = true;
        if (setOriginalQuantity) {
          setOriginalQuantity(quantity);
        }
        if (setLastRestockedTime) {
          setLastRestockedTime(new Date().toISOString());
        }
        setIsRestocking(false);
      }

      const priceInRobux = computePriceInRobux({
        isFree,
        isBundle,
        collectiblesMetadata,
        optionalPriceFloor,
        price,
      });

      // Don't need to call cancel if just updating the scheduled sale
      if (scheduledSaleChanged && scheduledStartDate === null && scheduledEndDate === null) {
        await itemConfigurationClient.cancelScheduledSaleStatus(collectibleItemId);
      }
      await itemConfigurationClient.updateCollectibleInformation(
        collectibleItemId,
        saleLocationModel,
        isOnSale,
        limit ?? 0,
        isResellable,
        priceInRobux,
        priceOffset ?? 0,
        isFree,
        scheduledStartDate,
        scheduledEndDate,
        optOutFromRegionalPricing,
        isRentableOptIn,
      );
      if (setOriginalSaleStatus) {
        setOriginalSaleStatus(isOnSale);
      }
      if (setOriginalIsResellable) {
        setOriginalIsResellable(isResellable);
      }
      if (setPreSaveScheduledStartDate) {
        setPreSaveScheduledStartDate(scheduledStartDate ?? null);
      }
      if (setPreSaveScheduledEndDate) {
        setPreSaveScheduledEndDate(scheduledEndDate ?? null);
      }
      showSuccessToast();
    } catch (e) {
      if (restockSucceeded) {
        setSaveErrorMessage('Message.RestockSucceededButConfigFailed');
        setIsRestocking(false);
        setShowSaveErrorDialog(true);
        return;
      }

      const error = await tryParseResponseError(e);
      switch (error?.code) {
        case undefined:
          setSaveErrorMessage('Message.UnknownError');
          break;
        case 12:
          setSaveErrorMessage('Message.MissingGroupPermission');
          break;
        case 18:
          setSaveErrorMessage('Message.UserDoesNotOwnItem');
          break;
        case 26:
          setSaveErrorMessage('Message.NameOrDescriptionModerated');
          break;
        case 61:
          setSaveErrorMessage('Message.InvalidSaleStatus');
          break;
        case 72:
          setSaveErrorMessage('Message.ItemIsModeratedOrPendingReview');
          break;
        case 75:
          setSaveErrorMessage('Message.ItemHasArchivedDependencies');
          break;
        case 76:
          setSaveErrorMessage('Message.ItemIsDelisted');
          break;
        case 79:
          setSaveErrorMessage('Message.InvalidSaleLocation');
          break;
        case 106:
          setSaveErrorMessage('Message.MissingIdVerification');
          break;
        case 125:
          setSaveErrorMessage('Message.MissingTwoStepVerification');
          break;
        case 107:
          setSaveErrorMessage('Message.CreationAccessBlocked');
          break;
        case 108:
          setSaveErrorMessage('Message.MissingPremiumSubscription');
          break;
        case 109:
          setSaveErrorMessage('Message.GroupOwnerMissingPremiumSubscription');
          break;
        case 118:
          setSaveErrorMessage('Message.GrantedItemCannotBePublished');
          break;
        case 70:
          setSaveErrorMessage('Message.NotEnoughRobuxForRestock');
          break;
        case 135:
          setSaveErrorMessage('Message.RestockingNotEnabled');
          break;
        case 136:
          setSaveErrorMessage('Message.ItemNotEligibleForRestocking');
          break;
        case 137:
          setSaveErrorMessage('Message.InvalidAgreedRestockingFee');
          break;
        case 138:
          setSaveErrorMessage('Message.FailedToRestock');
          break;
        case 139:
          setSaveErrorMessage('Message.InvalidRestockQuantity');
          break;
        case 140:
          setSaveErrorMessage('Message.FailedToFetchRestockingFee');
          break;
        case 142:
          setSaveErrorMessage('Message.ResaleLockedAfterRestock');
          break;
        default:
          setSaveErrorMessage('Message.UnknownError');
      }
      setIsRestocking(false);
      setShowSaveErrorDialog(true);
    }
  };

  return (
    <div>
      <Grid container item XSmall={12} marginTop='40px' alignItems='center'>
        {pendingRestock ? (
          <>
            <Grid item XSmall={12} Large={9} alignItems='center' container paddingRight={12}>
              <Typography
                variant='h5'
                style={{ fontSize: '24px', fontWeight: '450', marginRight: '12px' }}>
                {translate('Label.RestockingFee')}
              </Typography>
              <RobuxIcon />
              <Typography style={{ fontSize: '24px', fontWeight: '425', margin: '0 8px' }}>
                {restockingFee !== undefined
                  ? restockingFee.toLocaleString()
                  : translate('Label.Calculating')}
              </Typography>
            </Grid>
            <Grid item XSmall={12} Large={3}>
              <Button
                variant='contained'
                disabled={!isSaveAllowed || isRestocking || restockingFee === undefined}
                onClick={() => {
                  if (pendingRestock) {
                    setShowRestockDialog(true);
                  } else if (originalIsResellable !== isResellable) {
                    setShowPresaveDialog(true);
                  } else {
                    void handleSaveChanges();
                  }
                }}
                classes={{ root: saveButton }}>
                {isRestocking ? translate('Action.Restocking') : translate('Action.SaveChanges')}
              </Button>
            </Grid>
          </>
        ) : (
          <Grid item XSmall={9} alignItems='center' container paddingRight={12}>
            <Button
              variant='contained'
              disabled={!isSaveAllowed || isRestocking}
              onClick={() => {
                if (pendingRestock) {
                  setShowRestockDialog(true);
                } else if (originalIsResellable !== isResellable) {
                  setShowPresaveDialog(true);
                } else {
                  void handleSaveChanges();
                }
              }}
              classes={{ root: saveButton }}>
              {isRestocking ? translate('Action.Restocking') : translate('Action.SaveChanges')}
            </Button>
          </Grid>
        )}
      </Grid>
      <Dialog open={showSaveErrorDialog}>
        <DialogTemplate
          onConfirm={() => setShowSaveErrorDialog(false)}
          onCancel={() => setShowSaveErrorDialog(false)}
          title={translate('Message.SavingUnsuccessful')}
          content={`${translate('Message.SaveErrorMsgPrefix')} ${translate(saveErrorMessage)}`}
          confirmText={translate('Action.Ok')}
          cancelText={translate('Action.Cancel')}
        />
      </Dialog>
      <Dialog open={showPresaveDialog}>
        <DialogTemplate
          onConfirm={handleSaveChanges}
          onCancel={() => setShowPresaveDialog(false)}
          title=''
          content={
            <div
              style={{
                minWidth: CONFIRM_DIALOG_MIN_WIDTH,
                padding: '0 10px 10px 10px',
                color: theme.palette.mode === 'light' ? 'black' : 'white',
              }}>
              <div style={{ textAlign: 'center' }}>
                <Typography style={{ fontSize: '20px', fontWeight: '450' }}>
                  {translate('Label.ConfirmChanges')}
                </Typography>
              </div>
              <Divider style={{ margin: '24px 0' }} />
              <Typography>{translate('Message.PresaveDialogInfo')}</Typography>

              {isResellable && (
                <>
                  <Grid container item XSmall={12} alignItems='center' padding='16px'>
                    <Grid item XSmall={6}>
                      <Typography style={{ fontSize: '14px', fontWeight: '400' }}>
                        {translate('Label.Resellable')}
                      </Typography>
                    </Grid>
                    <Grid item XSmall={6}>
                      <Typography variant='body2' style={{ color: theme.palette.content.muted }}>
                        {translate('Action.Yes')}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Divider />
                </>
              )}
            </div>
          }
          confirmText={translate('Action.SaveChanges')}
          cancelText={translate('Action.Cancel')}
        />
      </Dialog>
      <RestockConfirmDialog
        open={showRestockDialog}
        onConfirm={handleSaveChanges}
        onCancel={() => setShowRestockDialog(false)}
        quantity={quantity}
        originalQuantity={originalQuantity}
        restockingFee={restockingFee}
      />
    </div>
  );
}

export default SavePanel;
