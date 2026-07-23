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
} from '@rbx/ui';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import { ItemConfigurationCollectiblesMetadataResponse } from '@modules/clients';
import { Item as ItemType } from '@modules/miscellaneous/common';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useSettings } from '@modules/settings';
import { Toggle } from '@rbx/foundation-ui';
import AddVariantDialog from '../../itemConfiguration/components/AddVariantDialog';
import { mapDurationToString, DurationOptionsEnum } from '../helper/UnifiedFeeSystemConstants';

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
  isRentableType: boolean;
  isRentableOptIn: boolean | undefined;
  setIsRentableOptIn: (isRentableOptIn: boolean) => void;
}
function ItemAttributesPostPublish(props: ItemAttributesPostPublishProps) {
  const {
    isLimited,
    quantity,
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
    isRentableType,
    isRentableOptIn,
    setIsRentableOptIn,
  } = props;
  const { translate } = useTranslation();
  const { classes } = useStyles();
  const { settings } = useSettings();
  const isRentablesEnabled = settings?.enableRentables;

  const [showAddVariantDialog, setShowAddVariantDialog] = useState(false);

  const helperText = useMemo(() => {
    if (limit! < initialLimit!) {
      return translate('Label.LimitHelperUnder', {
        initialLimit: initialLimit?.toString() ?? '',
      });
    }

    if (isLimited && limit! > quantity!) {
      return translate('Label.LimitHelperQuantity');
    }

    if (limit! > 500) {
      return translate('Label.LimitHelperQuota');
    }

    return '';
  }, [initialLimit, isLimited, limit, quantity, translate]);

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
            target='_blank'
            legacyBehavior>
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
                Lorem ipsum
                {/* TODO @mryumae: replace with translation */}
              </Typography>
              <br />
              <Typography variant='body2' className={classes.description}>
                {/* TODO @mryumae: replace with translation */}
                Lorem ipsum
              </Typography>
            </Grid>
            <Grid item XSmall={12} Large={7}>
              <Typography style={{ fontSize: '16px', fontWeight: '450' }}>
                {`${translate(`Action.${mapDurationToString(wearTime)}`)}`}
              </Typography>
              <Button
                variant='outlined'
                color='primary'
                style={{ marginLeft: '16px' }}
                onClick={() => setShowAddVariantDialog(true)}>
                <Typography>Lorem ipsum</Typography> {/* TODO @mryumae: replace with translation */}
              </Button>
            </Grid>
          </Grid>
        )}

        {isLimited && (
          <React.Fragment>
            <Grid container item XSmall={12} rowGap={2} alignItems='center'>
              <Grid item XSmall={12} Large={5}>
                <Typography style={{ fontSize: '18px', fontWeight: '450' }}>
                  {translate('Label.Quantity')}
                </Typography>
              </Grid>
              <Grid item XSmall={12} Large={7}>
                <Typography style={{ fontSize: '16px', fontWeight: '450' }}>{quantity}</Typography>
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
                      limit! < initialLimit! || (isLimited && limit! > quantity!) || limit! > 500
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
                    disabled={collectiblesMetadata?.isResellabilityEnabled === false}>
                    <RadioGroup
                      row
                      name='resellable'
                      value={isResellable ? 'yes' : 'no'}
                      onChange={(event) => setIsResellable(event.target.value === 'yes')}>
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
                </Grid>
              ) : (
                <Grid item XSmall={12} Large={7}>
                  <Typography style={{ fontSize: '16px', fontWeight: '450' }}>
                    {isResellable ? translate('Action.Yes') : translate('Action.No')}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </React.Fragment>
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
