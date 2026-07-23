import React from 'react';
import {
  Typography,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  TextField,
  Grid,
  Link,
  ToggleButtonGroup,
  ToggleButton,
  CheckCircleIcon,
  Tooltip,
  makeStyles,
  alpha,
} from '@rbx/ui';
import { Toggle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { ItemConfigurationCollectiblesMetadataResponse } from '@modules/clients';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useSettings } from '@modules/settings';
import {
  mapDurationToString,
  DurationOptionsEnum,
  DurationOptions,
} from '../helper/UnifiedFeeSystemConstants';

const useStyles = makeStyles()((theme) => ({
  toggleButtonSelected: {
    flex: '0 0 calc(50% - 6px)',
    maxWidth: 'calc(50% - 6px)',
    position: 'relative',
    padding: '8px 16px',
    border: `1px solid ${theme.palette.actionV2.primaryBrand.fill}`,
    borderLeft: `1px solid ${theme.palette.actionV2.primaryBrand.fill} !important`,
    justifyContent: 'flex-start',
  },
  nonLimitedToggleButtonUnselected: {
    flex: '0 0 calc(50% - 6px)',
    maxWidth: 'calc(50% - 6px)',
    position: 'relative',
    padding: '8px 16px',
    border: `1px solid ${alpha(theme.palette.actionV2.primary.fill, 51)}`,
    justifyContent: 'flex-start',
  },
  limitedToggleButtonUnselected: {
    flex: '0 0 calc(50% - 6px)',
    maxWidth: 'calc(50% - 6px)',
    position: 'relative',
    padding: '8px 16px',
    border: `1px solid ${alpha(theme.palette.actionV2.primary.fill, 51)}`,
    borderLeft: `1px solid ${alpha(theme.palette.actionV2.primary.fill, 51)} !important`,
    justifyContent: 'flex-start',
  },
  checkCircleIcon: {
    position: 'absolute',
    right: '5%',
    top: '40%',
    transform: 'translateY(-50%)',
    color: theme.palette.actionV2.primaryBrand.fill,
  },
  limited: {
    color: 'inherit',
  },
  nonLimited: {
    color: alpha(theme.palette.actionV2.primary.fill, 100),
  },
  description: {
    color: alpha(theme.palette.actionV2.primary.fill, 200),
  },
  wearTimeLabel: {
    color: theme.palette.actionV2.primary.fill,
  },
}));

interface ItemAttributesProps {
  isBundle: boolean;
  isLimited: boolean;
  setIsLimited: (isLimited: boolean) => void;
  quantity: number | undefined;
  setQuantity: (quantity: number | undefined) => void;
  limit: number | undefined;
  setLimit: (limit: number | undefined) => void;
  isFree: boolean;
  setIsFree: (isFree: boolean) => void;
  setPriceOffset: (priceOffset: number | undefined) => void;
  setOptionalPriceFloor: (optionalPriceFloor: number | undefined) => void;
  isResellable: boolean;
  setIsResellable: (isResellable: boolean) => void;
  collectiblesMetadata?: ItemConfigurationCollectiblesMetadataResponse;
  wearTime: DurationOptionsEnum;
  setWearTime: (wearTime: DurationOptionsEnum) => void;
  usedWearTimes: DurationOptionsEnum[];
  isDurableType: boolean;
  isCollectible: boolean;
  isRentableType: boolean;
  isRentableOptIn: boolean | undefined;
  setIsRentableOptIn: (isRentableOptIn: boolean) => void;
}

function ItemAttributes(props: ItemAttributesProps) {
  const {
    isBundle,
    isLimited,
    setIsLimited,
    quantity,
    setQuantity,
    limit,
    setLimit,
    isFree,
    setIsFree,
    setPriceOffset,
    setOptionalPriceFloor,
    isResellable,
    setIsResellable,
    collectiblesMetadata,
    wearTime,
    setWearTime,
    usedWearTimes,
    isDurableType,
    isCollectible,
    isRentableType,
    isRentableOptIn,
    setIsRentableOptIn,
  } = props;
  const { translate } = useTranslation();
  const { classes } = useStyles();
  const { settings } = useSettings();

  // Only show "Non-limited" for availability if publishing a variant and the item has been published before
  const displayNonLimited = isDurableType && !isLimited && isCollectible;
  const isRentablesEnabled = settings?.enableRentables;

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
      <Grid container marginTop={4} spacing={3}>
        <Grid container item XSmall={12} rowGap={2} alignItems='center'>
          <Grid item XSmall={12} Large={5}>
            <Typography style={{ fontSize: '18px', fontWeight: '450' }}>
              {translate('Label.Availability')}
            </Typography>
          </Grid>
          {displayNonLimited ? (
            <Grid item XSmall={12} Large={7}>
              <Typography style={{ fontSize: '16px', fontWeight: '450' }}>
                {isLimited ? translate('Label.Limited') : translate('Label.NonLimited')}
              </Typography>
            </Grid>
          ) : (
            <Grid item XSmall={12} Large={7}>
              <ToggleButtonGroup
                value={isLimited}
                exclusive
                onChange={(event, newIsLimited) => {
                  setIsLimited(newIsLimited);
                  if (!newIsLimited) {
                    setQuantity(undefined);
                    setLimit(undefined);
                    setIsFree(false);
                    setIsResellable(false);
                  }
                }}
                aria-label='availability'
                style={{ display: 'flex', width: '100%', justifyContent: 'flex-start', gap: 12 }}>
                <ToggleButton
                  value={false}
                  aria-label='nonlimited'
                  selected={!isLimited}
                  className={
                    !isLimited
                      ? classes.toggleButtonSelected
                      : classes.nonLimitedToggleButtonUnselected
                  }>
                  {!isLimited && <CheckCircleIcon className={classes.checkCircleIcon} />}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'flex-start',
                    }}>
                    <Typography variant='h6' style={{ textTransform: 'none' }}>
                      {translate('Label.NonLimited')}
                    </Typography>
                    <Typography variant='body1' style={{ textTransform: 'none' }}>
                      {translate('Label.UnlimitedQuantity')}
                    </Typography>
                  </div>
                </ToggleButton>

                <ToggleButton
                  value
                  aria-label='limited'
                  disabled={
                    isBundle && !collectiblesMetadata?.isLimitedCollectibleBundlesPublishingEnabled
                  }
                  selected={isLimited}
                  className={
                    isLimited ? classes.toggleButtonSelected : classes.limitedToggleButtonUnselected
                  }>
                  {isLimited && <CheckCircleIcon className={classes.checkCircleIcon} />}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'flex-start',
                    }}>
                    <Typography variant='h6' style={{ textTransform: 'none' }}>
                      {translate('Label.Limited')}
                    </Typography>
                    <Typography variant='body1' style={{ textTransform: 'none' }}>
                      {translate('Label.FixedQuantity')}
                    </Typography>
                  </div>
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
          )}
        </Grid>

        {isRentablesEnabled && isRentableType && !isLimited && (
          <Grid
            container
            item
            XSmall={12}
            rowGap={2}
            alignItems='center'
            className={isLimited ? classes.nonLimited : classes.limited}>
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
                isDisabled={isLimited}
              />
            </Grid>
          </Grid>
        )}

        {isDurableType && (
          <Grid
            container
            item
            XSmall={12}
            rowGap={2}
            alignItems='center'
            className={isLimited ? classes.nonLimited : classes.limited}>
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
              <FormControl component='fieldset'>
                <RadioGroup
                  row
                  name='wearTime'
                  value={wearTime}
                  onChange={(event) => setWearTime(event.target.value as DurationOptionsEnum)}>
                  {DurationOptions.map((option) => {
                    const isUsed = usedWearTimes.includes(option);

                    if (isUsed) {
                      return (
                        <Tooltip
                          key={option}
                          title='Lorem ipsum' // TODO @mryumae: replace with translation
                          arrow>
                          <FormControlLabel
                            value={option}
                            disabled={isUsed || isLimited}
                            control={<Radio aria-label={`wearTime-${option.toLowerCase()}`} />}
                            label={`${translate(`Action.${mapDurationToString(option)}`)}`}
                          />
                        </Tooltip>
                      );
                    }
                    return (
                      <FormControlLabel
                        key={option}
                        value={option}
                        disabled={isLimited}
                        control={<Radio aria-label={`wearTime-${option.toLowerCase()}`} />}
                        label={`${translate(`Action.${mapDurationToString(option)}`)}`}
                        className={classes.wearTimeLabel}
                      />
                    );
                  })}
                </RadioGroup>
              </FormControl>
            </Grid>
          </Grid>
        )}

        {isLimited ? (
          <React.Fragment>
            <Grid
              container
              item
              XSmall={12}
              rowGap={2}
              className={!isLimited ? classes.nonLimited : classes.limited}>
              <Grid item XSmall={12} Large={5}>
                <Typography style={{ fontSize: '18px', fontWeight: '450' }}>Quantity</Typography>
                <br />
                <Typography
                  variant='body2'
                  className={!isLimited ? classes.nonLimited : classes.description}>
                  {translate('Message.TotalStockAvailable')}
                </Typography>
              </Grid>
              <Grid item XSmall={12} Large={7}>
                <TextField
                  id='quantity'
                  label={translate('Label.QuantityAvailable')}
                  disabled={!isLimited}
                  value={isLimited ? quantity : ''}
                  error={isLimited && (!quantity || (!isFree && quantity! > 3000))}
                  helperText={
                    isLimited && !isFree && (!quantity || quantity! > 3000)
                      ? translate('Message.LimitedItemQuantityRange')
                      : ''
                  }
                  onChange={(event) => {
                    const value = +event.target.value;
                    if (value >= 0 && value <= 1000000) {
                      setQuantity(value);
                    }
                  }}
                  fullWidth
                />
              </Grid>
            </Grid>

            <Grid
              container
              item
              XSmall={12}
              rowGap={2}
              alignItems='center'
              className={!isLimited ? classes.nonLimited : classes.limited}>
              <Grid item XSmall={12} Large={5}>
                <Typography style={{ fontSize: '18px', fontWeight: '450' }}>
                  {translate('Label.LimitCopiesPerUser')}
                </Typography>
              </Grid>
              <Grid item XSmall={12} Large={7}>
                <TextField
                  id='limit'
                  label={translate('Label.LimitOptional')}
                  disabled={!isLimited}
                  error={limit! > quantity! || limit! > 500}
                  value={isLimited && limit! > 0 ? limit : ''}
                  helperText={
                    limit! > quantity! || limit! > 500 ? translate('Label.LimitHelperQuantity') : ''
                  }
                  onChange={(event) => {
                    const value = +event.target.value;
                    if (value >= 0) {
                      setLimit(value);
                    }
                  }}
                  fullWidth
                />
              </Grid>
            </Grid>

            <Grid
              container
              item
              XSmall={12}
              rowGap={2}
              alignItems='center'
              className={!isLimited ? classes.nonLimited : classes.limited}>
              <Grid item XSmall={12} Large={5}>
                <Typography style={{ fontSize: '18px', fontWeight: '450' }}>
                  {translate('Label.FreeItem')}
                </Typography>
              </Grid>
              <Grid item XSmall={12} Large={7}>
                <FormControl component='fieldset' disabled={!isLimited || (isLimited && isBundle)}>
                  <RadioGroup
                    row
                    name='freeItem'
                    value={isFree ? 'yes' : 'no'}
                    onChange={(event) => {
                      setIsFree(event.target.value === 'yes');
                      if (event.target.value === 'yes') {
                        setPriceOffset(undefined);
                        setOptionalPriceFloor(undefined);
                      }
                    }}>
                    <FormControlLabel
                      value='no'
                      control={<Radio aria-label='free-item-no' />}
                      label={translate('Action.No')}
                    />
                    <FormControlLabel
                      value='yes'
                      control={<Radio aria-label='free-item-yes' />}
                      label={translate('Action.Yes')}
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
            </Grid>

            <Grid
              container
              item
              XSmall={12}
              rowGap={2}
              alignItems='center'
              className={
                !isLimited || collectiblesMetadata?.isResellabilityEnabled === false
                  ? classes.nonLimited
                  : classes.limited
              }>
              <Grid item XSmall={12} Large={5}>
                <Typography style={{ fontSize: '18px', fontWeight: '450' }}>
                  {translate('Label.Resellable')}
                </Typography>
                <br />
                <Typography variant='body2' className={classes.description}>
                  {translate('Message.ResaleEligibility')}
                </Typography>
              </Grid>
              <Grid item XSmall={12} Large={7}>
                <FormControl
                  component='fieldset'
                  disabled={!isLimited || collectiblesMetadata?.isResellabilityEnabled === false}>
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
            </Grid>
          </React.Fragment>
        ) : null}
      </Grid>
    </div>
  );
}

export default ItemAttributes;
