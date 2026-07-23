import React, { FunctionComponent, useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogContentText,
  Button,
  IconButton,
  CloseIcon,
  useSnackbar,
  makeStyles,
} from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Asset, toastDurationTime } from '@modules/miscellaneous/common';
import { Flex } from '@modules/miscellaneous/common/components';
import { itemconfigurationClient, tryParseResponseError } from '@modules/clients';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { uuidService } from '@rbx/core';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import getTranslationKeyForItemConfigurationError from '../../unifiedFeeSystem/helper/ItemConfigurationErrorHelper';
import {
  ACCESSORY_ASSET_TYPES,
  CLOTHING_ASSET_TYPES,
  MAKEUP_ASSET_TYPES,
  ORIGINAL_TIMED_OPTIONS_ASSET_TYPES,
} from '../../avatarItem/constants/avatarItemConstants';
import {
  getValidTimedOptionsTypes,
  ValidTimedOptionsAssetTypes,
} from '../../unifiedFeeSystem/helper/UnifiedFeeSystemConstants';
import TimedOptionsAllBulkUpdate, {
  TimedOptionsAllBulkUpdateAssetTypesByCategory,
} from './TimedOptionsAllBulkUpdate';

function normalizeAssetType(assetType: string): Asset {
  if (assetType === 'Tshirt') return Asset.TShirt;
  if (assetType === 'TshirtAccessory') return Asset.TShirtAccessory;
  return assetType as Asset;
}

const useStyles = makeStyles()((theme) => ({
  dialogContent: {
    padding: theme.spacing(3),
    minWidth: 300,
  },
  buttonContainer: {
    gap: theme.spacing(2),
    width: '100%',
  },
  actionButton: {
    width: '100%',
  },
  dialogTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  descriptionText: {
    marginBottom: theme.spacing(2),
  },
  closeButton: {
    marginLeft: 'auto',
  },
}));

export interface TimedOptionsBulkUpdateProps {
  open: boolean;
  onClose: () => void;
}

const TimedOptionsBulkUpdate: FunctionComponent<TimedOptionsBulkUpdateProps> = ({
  open,
  onClose,
}) => {
  const { translate, translateHTML } = useTranslation();
  const { classes } = useStyles();
  const { enqueue, close } = useSnackbar();
  const currentGroup = useCurrentGroup();
  // true if bulk on, false if bulk off, null if no action selected
  const [selectedAction, setSelectedAction] = useState<boolean | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() =>
    uuidService.generateRandomUuid(),
  );
  /** Which category checkboxes to show, derived from allowed timed-options asset types. */
  const [categoryFlags, setCategoryFlags] = useState<{
    showClothing: boolean;
    showMakeup: boolean;
    showAccessories: boolean;
    showCategorySubtypeDropdowns: boolean;
  }>({
    showClothing: false,
    showMakeup: false,
    showAccessories: false,
    showCategorySubtypeDropdowns: true,
  });
  /** True when getAllowedAssetTypes returned only [64, 66, 68]; use classic Turn All On/Off flow so we can control when new types are released. */
  const [originalOnly, setOriginalOnly] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedAction(null);
      setIdempotencyKey(uuidService.generateRandomUuid());
      getValidTimedOptionsTypes().then(() => {
        const allowed = ValidTimedOptionsAssetTypes;
        const normalized = allowed.map((t) => normalizeAssetType(t));
        const normalizedSet = new Set(normalized);
        const isOriginalOnly =
          normalizedSet.size === 3 &&
          Array.from(ORIGINAL_TIMED_OPTIONS_ASSET_TYPES).every((a) => normalizedSet.has(a));
        setOriginalOnly(isOriginalOnly);

        if (isOriginalOnly) {
          setCategoryFlags({
            showClothing: false,
            showMakeup: false,
            showAccessories: false,
            showCategorySubtypeDropdowns: true,
          });
        } else {
          const allowedOnlyOriginalClothingAndMakeup = [...normalizedSet].every(
            (a) => ORIGINAL_TIMED_OPTIONS_ASSET_TYPES.has(a) || MAKEUP_ASSET_TYPES.includes(a),
          );
          const showMakeup = normalizedSet.has(Asset.EyeMakeup);
          const hasExpandedClothingAllowed = CLOTHING_ASSET_TYPES.some(
            (a) => normalizedSet.has(a) && !ORIGINAL_TIMED_OPTIONS_ASSET_TYPES.has(a),
          );
          const hasOriginalClothingAllowed = Array.from(ORIGINAL_TIMED_OPTIONS_ASSET_TYPES).some(
            (a) => normalizedSet.has(a),
          );
          const showClothing = hasExpandedClothingAllowed || hasOriginalClothingAllowed;
          const showAccessories = normalizedSet.has(Asset.Hat);
          setCategoryFlags({
            showClothing,
            showMakeup,
            showAccessories,
            showCategorySubtypeDropdowns: !allowedOnlyOriginalClothingAndMakeup,
          });
        }
      });
    } else {
      setIdempotencyKey(uuidService.generateRandomUuid());
    }
  }, [open]);

  const handleTurnOn = () => {
    setSelectedAction(true);
  };

  const handleTurnOff = () => {
    setSelectedAction(false);
  };

  const handleConfirm = useCallback(async () => {
    try {
      await itemconfigurationClient.bulkUpdateCollectible(
        idempotencyKey,
        currentGroup?.id,
        [64, 66, 68], // TShirtAccessory, PantsAccessory, SweaterAccessory
        selectedAction === true,
      );
      enqueue({
        message: translate('Message.TimedOptionSettingsApplied'),
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        autoHideDuration: toastDurationTime,
        autoHide: true,
        onClose: close,
      });
      window.location.reload();
      onClose();
    } catch (e) {
      const error = await tryParseResponseError(e);
      const errorTranslationKey = getTranslationKeyForItemConfigurationError(
        error,
        'Error.Unknown',
      );
      enqueue({
        message: translate(errorTranslationKey),
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        autoHideDuration: toastDurationTime,
        autoHide: true,
        onClose: close,
      });
    }
  }, [enqueue, close, translate, onClose, idempotencyKey, currentGroup?.id, selectedAction]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  /** Use new flow (checkboxes) whenever allowed types are not exactly [64, 66, 68]. */
  const showAllTimedOptions = !originalOnly;

  const assetTypesByCategory: TimedOptionsAllBulkUpdateAssetTypesByCategory | undefined =
    showAllTimedOptions
      ? (() => {
          const allowedSet = new Set(
            ValidTimedOptionsAssetTypes.map((t) => normalizeAssetType(t as string)),
          );
          const hasExpandedClothingAllowed = CLOTHING_ASSET_TYPES.some(
            (a) => allowedSet.has(a) && !ORIGINAL_TIMED_OPTIONS_ASSET_TYPES.has(a),
          );
          const hasOriginalClothingAllowed = Array.from(ORIGINAL_TIMED_OPTIONS_ASSET_TYPES).some(
            (a) => allowedSet.has(a),
          );
          const useFilteredOriginalClothing =
            categoryFlags.showCategorySubtypeDropdowns === false ||
            (hasOriginalClothingAllowed && !hasExpandedClothingAllowed);
          const clothing = useFilteredOriginalClothing
            ? Array.from(ORIGINAL_TIMED_OPTIONS_ASSET_TYPES).filter((a) => allowedSet.has(a))
            : CLOTHING_ASSET_TYPES.filter((a) => allowedSet.has(a));
          const makeup = MAKEUP_ASSET_TYPES.filter((a) => allowedSet.has(a));
          const accessories =
            categoryFlags.showCategorySubtypeDropdowns === false
              ? []
              : ACCESSORY_ASSET_TYPES.filter((a) => allowedSet.has(a));
          return {
            clothing,
            makeup,
            accessories,
          };
        })()
      : undefined;

  if (showAllTimedOptions) {
    return (
      <TimedOptionsAllBulkUpdate
        open={open}
        onClose={handleClose}
        categoryFlags={categoryFlags}
        assetTypesByCategory={assetTypesByCategory}
      />
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='Small' color='primaryBrand'>
      <DialogTitle className={classes.dialogTitle}>
        <span>
          {selectedAction === null ? translate('Action.TimedOptions') : translate('Action.Confirm')}
        </span>
        <IconButton
          aria-label='Close'
          onClick={handleClose}
          size='small'
          className={classes.closeButton}
          color='inherit'>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent className={classes.dialogContent}>
        {selectedAction === null ? (
          <React.Fragment>
            <DialogContentText className={classes.descriptionText}>
              {translate(
                'Description.BulkUpdateTimedOptions' /* TranslationNamespace.ConfigureItem */,
              )}
            </DialogContentText>
            <Flex flexDirection='column' classes={{ root: classes.buttonContainer }}>
              <Button
                variant='contained'
                color='secondary'
                onClick={handleTurnOn}
                size='large'
                className={classes.actionButton}>
                {translate('Action.TurnAllOn')}
              </Button>
              <Button
                variant='contained'
                color='secondary'
                onClick={handleTurnOff}
                size='large'
                className={classes.actionButton}>
                {translate('Action.TurnAllOff')}
              </Button>
            </Flex>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <DialogContentText className={classes.descriptionText}>
              {selectedAction === true
                ? translateHTML('Description.BulkUpdateOnConfirmation', [
                    {
                      opening: 'boldStart',
                      closing: 'boldEnd',
                      content(chunks) {
                        return <strong>{chunks}</strong>;
                      },
                    },
                  ])
                : translateHTML('Description.BulkUpdateOffConfirmation', [
                    {
                      opening: 'boldStart',
                      closing: 'boldEnd',
                      content(chunks) {
                        return <strong>{chunks}</strong>;
                      },
                    },
                  ])}
            </DialogContentText>
            <Flex flexDirection='column' classes={{ root: classes.buttonContainer }}>
              <Button
                variant='contained'
                color='primaryBrand'
                onClick={handleConfirm}
                size='large'
                className={classes.actionButton}>
                {translate('Action.Confirm')}
              </Button>
              <Button
                variant='contained'
                color='secondary'
                onClick={handleClose}
                size='large'
                className={classes.actionButton}>
                {translate('Action.Cancel')}
              </Button>
            </Flex>
          </React.Fragment>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default withTranslation(TimedOptionsBulkUpdate, [
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Creations,
]);
