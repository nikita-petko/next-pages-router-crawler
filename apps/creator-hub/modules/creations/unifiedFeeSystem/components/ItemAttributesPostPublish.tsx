import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { Toggle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  Grid,
  Typography,
  TextField,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  alpha,
  makeStyles,
  WarningIcon,
} from '@rbx/ui';
import type { ItemConfigurationCollectiblesMetadataResponse } from '@modules/clients/itemconfiguration';
import { Item as ItemType } from '@modules/miscellaneous/common';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import AddVariantDialog from '../../itemConfiguration/components/AddVariantDialog';
import type { DurationOptionsEnum } from '../helper/UnifiedFeeSystemConstants';
import { mapDurationToString } from '../helper/UnifiedFeeSystemConstants';

const useStyles = makeStyles()((theme) => ({
  limited: {
    color: 'inherit',
  },
  nonLimited: {
    color: alpha(theme.palette.actionV2.primary.fill, 100),
  },
  description: {
    color: alpha(theme.palette.actionV2.primary.fill, 200),
  },
}));

interface ItemAttributesPostPublishProps {
  isLimited: boolean;
  quantity?: number;
  setQuantity?: (quantity: number) => void;
  originalQuantity?: number;
  limit: number | undefined;
  setLimit: (limit: number) => void;
  initialLimit: number | undefined;
  isFree: boolean;
  isResellable: boolean;
  setIsResellable: (isResellable: boolean) => void;
  originalIsResellable: boolean;
  collectiblesMetadata?: ItemConfigurationCollectiblesMetadataResponse;
  wearTime: DurationOptionsEnum;
  isBundle: boolean;
  isDurableType: boolean;
  itemId: number;
  enableItemAttributes: boolean;
  isRestockEnabled: boolean;
  hasBeenRestocked: boolean;
  restockIneligibilityReason?: string;
  maxRestockQuantityPerOp?: number;
  resaleUnlockTime?: string;
  restockingFee?: number;
  isRentableType: boolean;
  isRentableOptIn: boolean | undefined;
  setIsRentableOptIn: (isRentableOptIn: boolean) => void;
}
function ItemAttributesPostPublish(props: ItemAttributesPostPublishProps) {
  const {
    isLimited,
    quantity,
    setQuantity,
    originalQuantity,
    limit,
    setLimit,
    initialLimit,
    isFree,
    isResellable,
    setIsResellable,
    originalIsResellable,
    collectiblesMetadata,
    wearTime,
    isBundle,
    isDurableType,
    itemId,
    enableItemAttributes,
    isRestockEnabled,
    hasBeenRestocked,
    restockIneligibilityReason,
    maxRestockQuantityPerOp,
    resaleUnlockTime,
    isRentableType,
    isRentableOptIn,
    setIsRentableOptIn,
  } = props;
  const { translate } = useTranslation();
  const { classes } = useStyles();
  const { settings } = useSettings();
  const isRentablesEnabled = settings?.enableRentables;

  const [showAddVariantDialog, setShowAddVariantDialog] = useState(false);
  const [stashedQuantity, setStashedQuantity] = useState<number | undefined>(undefined);

  // True while the post-restock resale lock is still active (resaleUnlockTime > now).
  // resaleUnlockTime is derived from lastRestockedTime + duration, so it being defined
  // already implies the item has been restocked — no need to check hasBeenRestocked separately.
  const resaleLocked = resaleUnlockTime !== undefined && new Date(resaleUnlockTime) > new Date();

  const helperText = useMemo(() => {
    if (limit !== undefined && initialLimit !== undefined && limit < initialLimit) {
      return translate('Label.LimitHelperUnder', {
        initialLimit: initialLimit.toString(),
      });
    }

    if (isLimited && limit !== undefined && quantity !== undefined && limit > quantity) {
      return translate('Label.LimitHelperQuantity');
    }

    if (limit !== undefined && limit > 500) {
      return translate('Label.LimitHelperQuota');
    }

    return '';
  }, [initialLimit, isLimited, limit, quantity, translate]);

  // Whether the restock quantity field should show an error: either the quantity was lowered
  // below the original, or the requested restock exceeds the per-operation cap.
  const quantityBelowOriginal =
    quantity !== undefined && originalQuantity !== undefined && quantity < originalQuantity;
  const quantityExceedsPerOpCap =
    maxRestockQuantityPerOp !== undefined &&
    quantity !== undefined &&
    originalQuantity !== undefined &&
    quantity - originalQuantity > maxRestockQuantityPerOp;
  const quantityAboveOriginal =
    quantity !== undefined && originalQuantity !== undefined && quantity > originalQuantity;

  const quantityFieldHasError = quantityBelowOriginal || quantityExceedsPerOpCap;

  const quantityFieldHelperText = quantityBelowOriginal
    ? translate('Message.QuantityCanOnlyIncrease')
    : quantityExceedsPerOpCap
      ? translate('Message.RestockExceedsPerOpCap', {
          max: (maxRestockQuantityPerOp ?? 0).toString(),
        })
      : quantityAboveOriginal
        ? translate('Message.RestockAddingUnits', {
            count: ((quantity ?? 0) - (originalQuantity ?? 0)).toString(),
          })
        : '';

  return (
    <div>
      <Grid container justifyContent='space-between' alignItems='center'>
        <Grid item>
          <Typography variant='h5' style={{ fontSize: '24px', fontWeight: '450' }}>
            {translate('Label.ItemAttributes')}
          </Typography>
        </Grid>
        <Grid item>
          <Link
            href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/art/marketplace/marketplace-fees-and-commissions#limiteds`}
            target='_blank'>
            {translate('Action.LearnMore')}
          </Link>
        </Grid>
      </Grid>
      <Grid container marginTop={2} spacing={3}>
        <Grid container item XSmall={12} rowGap={2} alignItems='center'>
          <Grid item XSmall={12} Large={5}>
            <Typography style={{ fontSize: '18px', fontWeight: '450' }}>
              {translate('Label.Availability')}
            </Typography>
          </Grid>
          <Grid item XSmall={12} Large={7}>
            <Typography style={{ fontSize: '16px', fontWeight: '450' }}>
              {isLimited ? translate('Label.Limited') : translate('Label.NonLimited')}
            </Typography>
          </Grid>
        </Grid>

        {isRentablesEnabled && isRentableType && !isLimited && (
          <Grid
            container
            item
            XSmall={12}
            rowGap={2}
            alignItems='center'
            className={isLimited ? classes.nonLimited : classes.limited}
            style={{
              opacity: enableItemAttributes ? '100%' : '24%',
            }}>
            <Grid item XSmall={12} Large={5}>
              <Typography style={{ fontSize: '18px', fontWeight: '450' }}>
                {translate('Title.TimedOptions')}
              </Typography>
              <br />
              <Typography variant='body2' className={classes.description}>
                {translate('Description.TimedOptions')}
              </Typography>
            </Grid>
            <Grid item XSmall={12} Large={7}>
              <Toggle
                label=''
                size='Medium'
                placement='Start'
                isChecked={isRentableOptIn ?? false}
                onCheckedChange={setIsRentableOptIn}
                aria-label='rentable toggle'
              />
            </Grid>
          </Grid>
        )}

        {isDurableType && !isLimited && (
          <Grid container item XSmall={12} rowGap={2} alignItems='center'>
            <Grid item XSmall={12} Large={5}>
              <Typography style={{ fontSize: '18px', fontWeight: '450' }}>
                {/* oxlint-disable-next-line rbx/no-hardcoded-translation-string -- TODO @mryumae: replace with translation */}
                Lorem ipsum
              </Typography>
              <br />
              <Typography variant='body2' className={classes.description}>
                {/* oxlint-disable-next-line rbx/no-hardcoded-translation-string -- TODO @mryumae: replace with translation */}
                Lorem ipsum
              </Typography>
            </Grid>
            <Grid item XSmall={12} Large={7}>
              <Typography style={{ fontSize: '16px', fontWeight: '450' }}>
                {translate(`Action.${mapDurationToString(wearTime)}`)}
              </Typography>
              <Button
                variant='outlined'
                color='primary'
                style={{ marginLeft: '16px' }}
                onClick={() => setShowAddVariantDialog(true)}>
                {/* oxlint-disable-next-line rbx/no-hardcoded-translation-string -- TODO @mryumae: replace with translation */}
                <Typography>Lorem ipsum</Typography>
              </Button>
            </Grid>
          </Grid>
        )}

        {isLimited && (
          <>
            <Grid container item XSmall={12} rowGap={2} alignItems='center'>
              <Grid item XSmall={12} Large={5}>
                <Typography style={{ fontSize: '18px', fontWeight: '450' }}>
                  {translate('Label.Quantity')}
                </Typography>
                {isRestockEnabled && isResellable ? (
                  <>
                    <br />
                    <Typography variant='body2' className={classes.description}>
                      {translate('Message.RestockDisabledResellable')}
                    </Typography>
                  </>
                ) : !isRestockEnabled && restockIneligibilityReason ? (
                  <>
                    <br />
                    <Typography variant='body2' className={classes.description}>
                      {restockIneligibilityReason
                        ? translate(`Message.RestockIneligible.${restockIneligibilityReason}`)
                        : translate('Message.ItemNotEligibleForRestocking')}
                    </Typography>
                  </>
                ) : null}
              </Grid>
              <Grid item XSmall={12} Large={7}>
                {isRestockEnabled && !isResellable ? (
                  <TextField
                    id='quantity'
                    label={translate('Label.Quantity')}
                    value={quantity}
                    error={quantityFieldHasError}
                    helperText={quantityFieldHelperText}
                    InputLabelProps={{ shrink: true }}
                    onChange={(event) => {
                      const value = +event.target.value;
                      if (setQuantity && !Number.isNaN(value) && value >= 0) {
                        setQuantity(value);
                      }
                    }}
                    fullWidth
                  />
                ) : (
                  <Typography style={{ fontSize: '16px', fontWeight: '450' }}>
                    {quantity}
                  </Typography>
                )}
              </Grid>
            </Grid>

            <Grid container item XSmall={12} rowGap={2} alignItems='center'>
              <Grid item XSmall={12} Large={5}>
                <Typography style={{ fontSize: '18px', fontWeight: '450' }}>
                  {translate('Label.LimitCopiesPerUser')}
                </Typography>
              </Grid>
              <Grid item XSmall={12} Large={7}>
                {initialLimit ? (
                  <TextField
                    id='limit'
                    label={translate('Label.LimitOptional')}
                    disabled={!isLimited}
                    value={limit}
                    error={
                      (limit !== undefined && initialLimit !== undefined && limit < initialLimit) ||
                      (isLimited &&
                        limit !== undefined &&
                        quantity !== undefined &&
                        limit > quantity) ||
                      (limit !== undefined && limit > 500)
                    }
                    helperText={helperText}
                    onChange={(event) => setLimit(+event.target.value)}
                    fullWidth
                  />
                ) : (
                  <Typography style={{ fontSize: '16px', fontWeight: '450' }}>
                    {translate('Label.NoLimit')}
                  </Typography>
                )}
              </Grid>
            </Grid>
            <Grid
              container
              item
              XSmall={12}
              rowGap={2}
              alignItems='center'
              style={{
                opacity: enableItemAttributes ? '100%' : '24%',
              }}>
              <Grid item XSmall={12} Large={5}>
                <Typography style={{ fontSize: '18px', fontWeight: '450' }}>
                  {translate('Label.FreeItem')}
                </Typography>
              </Grid>
              <Grid item XSmall={12} Large={7}>
                <Typography style={{ fontSize: '16px', fontWeight: '450' }}>
                  {isFree ? translate('Action.Yes') : translate('Action.No')}
                </Typography>
              </Grid>
            </Grid>

            <Grid
              container
              item
              XSmall={12}
              rowGap={2}
              alignItems='center'
              style={{
                color:
                  collectiblesMetadata?.isResellabilityEnabled === false
                    ? classes.limited
                    : classes.nonLimited,
                opacity: enableItemAttributes ? '100%' : '24%',
              }}>
              <Grid item XSmall={12} Large={5}>
                <Typography style={{ fontSize: '18px', fontWeight: '450' }}>
                  {translate('Label.Resellable')}
                </Typography>
                <br />
                <Typography variant='body2' className={classes.description}>
                  {translate('Message.ResaleEligibility')}
                </Typography>
              </Grid>
              {isLimited && !originalIsResellable ? (
                <Grid item XSmall={12} Large={7}>
                  <FormControl
                    component='fieldset'
                    disabled={
                      resaleLocked || collectiblesMetadata?.isResellabilityEnabled === false
                    }>
                    <RadioGroup
                      row
                      name='resellable'
                      value={resaleLocked ? 'no' : isResellable ? 'yes' : 'no'}
                      onChange={(event) => {
                        const enableResale = event.target.value === 'yes';
                        setIsResellable(enableResale);
                        if (!setQuantity) {
                          return;
                        }
                        if (enableResale) {
                          setStashedQuantity(quantity);
                          if (originalQuantity !== undefined) {
                            setQuantity(originalQuantity);
                          }
                        } else if (stashedQuantity !== undefined) {
                          setQuantity(stashedQuantity);
                        }
                      }}>
                      <FormControlLabel
                        value='no'
                        control={<Radio aria-label='resellable-no' />}
                        label={translate('Action.No')}
                      />
                      <FormControlLabel
                        value='yes'
                        control={<Radio aria-label='resellable-yes' />}
                        label={translate('Action.Yes')}
                      />
                    </RadioGroup>
                  </FormControl>
                  {resaleLocked && (
                    <Typography
                      variant='body2'
                      color='warning'
                      style={{ display: 'flex', marginTop: '5px' }}>
                      <WarningIcon
                        fontSize='small'
                        color='inherit'
                        style={{ marginRight: '5px' }}
                      />
                      {translate('Message.ResaleLockedUntil', {
                        unlockAt: new Date(resaleUnlockTime ?? '').toLocaleString(),
                      })}
                    </Typography>
                  )}
                  {!resaleLocked && isResellable && (isRestockEnabled || hasBeenRestocked) && (
                    <Typography
                      variant='body2'
                      color='warning'
                      style={{ display: 'flex', marginTop: '5px' }}>
                      <WarningIcon
                        fontSize='small'
                        color='inherit'
                        style={{ marginRight: '5px' }}
                      />
                      {translate('Message.ResaleWarningLosesRestock')}
                    </Typography>
                  )}
                </Grid>
              ) : (
                <Grid item XSmall={12} Large={7}>
                  <Typography style={{ fontSize: '16px', fontWeight: '450' }}>
                    {isResellable ? translate('Action.Yes') : translate('Action.No')}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </>
        )}
      </Grid>

      {isDurableType && (
        <AddVariantDialog
          showAddVariantDialog={showAddVariantDialog}
          setShowAddVariantDialog={setShowAddVariantDialog}
          itemType={isBundle ? ItemType.Bundle : ItemType.CatalogAsset}
          itemId={itemId}
        />
      )}
    </div>
  );
}

export default ItemAttributesPostPublish;
