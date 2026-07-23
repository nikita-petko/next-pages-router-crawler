import {
  tryParseResponseError,
  ItemConfigurationCollectiblesMetadataResponse,
} from '@modules/clients';
import itemConfigurationClient from '@modules/clients/itemconfiguration';
import { RobloxItemConfigurationApiModelsRequestCollectiblesSaleLocationConfigurationModel } from '@rbx/client-itemconfiguration/v1';
import {
  Button,
  Dialog,
  DialogTemplate,
  Divider,
  Grid,
  makeStyles,
  Typography,
  useSnackbar,
  useTheme,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import React, { useCallback, useEffect, useState } from 'react';
import {
  DefaultMaxCollectiblePrice,
  SaleLocationEnum,
  mapSaleLocationToType,
} from '../helper/UnifiedFeeSystemConstants';

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
  setPreSaveScheduledStartDate?: (originalStartDate: Date | null) => void;
  setPreSaveScheduledEndDate?: (originalEndDate: Date | null) => void;
  optOutFromRegionalPricing: boolean;
  isRentableOptIn: boolean | undefined;
  displayInfoChanged: boolean;
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
    setPreSaveScheduledStartDate,
    setPreSaveScheduledEndDate,
    optOutFromRegionalPricing,
    isRentableOptIn,
    displayInfoChanged,
  } = props;
  const [saveErrorMessage, setSaveErrorMessage] = useState('');
  const [showSaveErrorDialog, setShowSaveErrorDialog] = useState(false);
  const [showPresaveDialog, setShowPresaveDialog] = useState(false);
  const [isSaveAllowed, setIsSaveAllowed] = useState(false);
  const { translate } = useTranslation();
  const theme = useTheme();
  const {
    classes: { saveButton },
  } = useStyles();

  const { enqueue } = useSnackbar();
  const showSuccessToast = useCallback(() => {
    enqueue(
      {
        message: <span data-testid='success-message'>Changes successfully saved</span>,
        autoHide: true,
      },
      (reason) => reason === 'timeout',
    );
  }, [enqueue]);

  useEffect(() => {
    const maxCollectiblePrice =
      collectiblesMetadata?.maxCollectiblePrice ?? DefaultMaxCollectiblePrice;
    const priceValid =
      (optionalPriceFloor === undefined || optionalPriceFloor <= maxCollectiblePrice) &&
      (priceOffset === undefined || priceOffset <= maxCollectiblePrice);
    setIsSaveAllowed(!isSaveDisabled && priceValid);
  }, [isSaveDisabled, optionalPriceFloor, priceOffset, collectiblesMetadata]);

  const handleSaveChanges = async () => {
    setShowPresaveDialog(false);
    if (saleLocation === SaleLocationEnum.Invalid) {
      setSaveErrorMessage('Message.MissingSaleLocations');
      setShowSaveErrorDialog(true);
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
      if (setPreSaveScheduledStartDate) {
        setPreSaveScheduledStartDate(scheduledStartDate ?? null);
      }
      if (setPreSaveScheduledEndDate) {
        setPreSaveScheduledEndDate(scheduledEndDate ?? null);
      }
      showSuccessToast();
    } catch (e) {
      const error = await tryParseResponseError(e);
      switch (error?.code) {
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
        default:
          setSaveErrorMessage('Message.UnknownError');
      }
      setShowSaveErrorDialog(true);
    }
  };

  return (
    <div>
      <Grid container item XSmall={12} marginTop='40px' alignItems='center'>
        <Grid item XSmall={9} alignItems='center' container paddingRight={12}>
          <Button
            variant='contained'
            disabled={!isSaveAllowed}
            onClick={
              originalIsResellable !== isResellable
                ? () => setShowPresaveDialog(true)
                : handleSaveChanges
            }
            classes={{ root: saveButton }}>
            {translate('Action.SaveChanges')}
          </Button>
        </Grid>
      </Grid>
      <Dialog open={showSaveErrorDialog}>
        <DialogTemplate
          onConfirm={() => setShowSaveErrorDialog(false)}
          onCancel={() => setShowSaveErrorDialog(false)}
          title='Saving Unsuccessful'
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
                minWidth: '580px',
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
                <React.Fragment>
                  <Grid container item XSmall={12} alignItems='center' padding='16px'>
                    <Grid item XSmall={6}>
                      <Typography style={{ fontSize: '14px', fontWeight: '400' }}>
                        {translate('Label.Resellable')}
                      </Typography>
                    </Grid>
                    <Grid item XSmall={6}>
                      <Typography variant='body2' style={{ color: '#CBCBCB' }}>
                        {translate('Action.Yes')}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Divider />
                </React.Fragment>
              )}
            </div>
          }
          confirmText={translate('Action.SaveChanges')}
          cancelText={translate('Action.Cancel')}
        />
      </Dialog>
    </div>
  );
}

export default SavePanel;
