import React, { FC } from 'react';
import {
  Grid,
  InfoOutlinedIcon,
  InputAdornment,
  Link,
  RobuxIcon,
  TextField,
  Tooltip,
  Typography,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { Asset } from '@modules/miscellaneous/common';
import useAvatarCreationTokenStyles from './Styles/AvatarCreationTokenStyles.styles';
import {
  TAvatarCreationTokenSaleInformation,
  TItemTypeMetadata,
} from '../constants/AvatarCreationTokenConstants';
import { priceFloorLink } from '../constants/LinkConstants';
import { BundleType } from '../../avatarItem/constants/avatarItemConstants';

export type TSaleInformationComponentProps = {
  onChange: (inputs: TAvatarCreationTokenSaleInformation) => void;
  value: TAvatarCreationTokenSaleInformation;
  itemType: Asset | BundleType | null;
  priceFloor: number | undefined;
  enabledItemTypesMetadata: { [key: string]: TItemTypeMetadata };
};

const SaleInformationComponent: FC<React.PropsWithChildren<TSaleInformationComponentProps>> = ({
  onChange,
  value,
  itemType,
  priceFloor,
  enabledItemTypesMetadata,
}) => {
  const {
    classes: { inputForm },
  } = useAvatarCreationTokenStyles();

  const { priceOffset, minimumPrice } = value;

  const handleValueChange = (newValues: TAvatarCreationTokenSaleInformation) => {
    onChange(newValues);
  };

  const handlePriceOffsetChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    const newPriceOffset = +e.target.value;
    if (newPriceOffset >= 0 && newPriceOffset <= Number.MAX_SAFE_INTEGER) {
      handleValueChange({ ...value, priceOffset: newPriceOffset });
    }
  };

  const handleMinimumPriceChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    const newMinimumPrice = +e.target.value;
    if (newMinimumPrice >= 0 && newMinimumPrice <= Number.MAX_SAFE_INTEGER) {
      handleValueChange({ ...value, minimumPrice: newMinimumPrice });
    }
  };

  function calculatePrice() {
    const floor = priceFloor !== undefined ? priceFloor : 0;
    const offset = priceOffset !== undefined ? priceOffset : 0;
    const minPrice = minimumPrice !== undefined ? minimumPrice : 0;
    return Math.max(+floor + +offset, minPrice);
  }

  const { translate } = useTranslation();

  return (
    <Grid container item direction='column' XSmall={12} XLarge={6} className={inputForm}>
      {/* Current Price Floor */}
      <Grid container item XSmall={12} rowGap={2} style={{ marginTop: '32px' }}>
        <Grid item XSmall={12} Large={5} style={{ paddingRight: '20px' }}>
          <Typography style={{ fontSize: '18px', fontWeight: '450' }}>
            {translate('Label.CurrentTypePriceFloor', {
              type: itemType ? translate(enabledItemTypesMetadata[itemType].displayName) : '',
            })}
          </Typography>
          <br />
          <Typography variant='body2' style={{ color: '#CBCBCB' }}>
            {translate('Message.ItemMinimumPrice')}{' '}
            <Link href={priceFloorLink} target='_blank'>
              {translate('Action.LearnMore')}
            </Link>
          </Typography>
        </Grid>
        <Grid item XSmall={12} Large={7} alignItems='center' container>
          <RobuxIcon />
          <Typography
            data-testid='price-floor'
            style={{ fontSize: '18px', fontWeight: '425', marginLeft: '6px' }}>
            {priceFloor}
          </Typography>
        </Grid>
      </Grid>
      {/* Offset */}
      <Grid container item XSmall={12} rowGap={2} style={{ marginTop: '16px' }}>
        <Grid item XSmall={12} Large={5} style={{ paddingRight: '64px' }}>
          <Typography style={{ fontSize: '18px', fontWeight: '450' }}>
            {translate('Label.PriceConfigurations')}
          </Typography>
          <br />
          <Typography variant='body2' style={{ color: '#CBCBCB' }}>
            {translate('Message.SetPrice')}
          </Typography>
        </Grid>
        <Grid item XSmall={12} Large={7}>
          <TextField
            fullWidth
            id='amountAbovePriceFloor'
            onChange={handlePriceOffsetChange}
            label={translate('Label.AmountAbovePriceFloor')}
            style={{ marginRight: '4%', marginBottom: '30px' }}
            value={priceOffset}
            InputProps={{
              inputProps: { inputMode: 'numeric' },
              startAdornment: (
                <InputAdornment position='start'>
                  <RobuxIcon fontSize='small' />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position='end'>
                  <Tooltip
                    arrow
                    placement='right'
                    title={translate('Label.DynamicFloorAboveAmountTooltip')}>
                    <InfoOutlinedIcon fontSize='small' />
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            id='minimumSalePrice'
            label={translate('Label.DoNotPriceBelow')}
            style={{ marginBottom: '4px' }}
            value={minimumPrice || ''}
            onChange={handleMinimumPriceChange}
            InputProps={{
              inputProps: { inputMode: 'numeric' },
              startAdornment: (
                <InputAdornment position='start'>
                  <RobuxIcon fontSize='small' />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position='end'>
                  <Tooltip
                    arrow
                    placement='right'
                    title={translate('Label.DynamicFloorMinSalePriceToolTip')}>
                    <InfoOutlinedIcon fontSize='small' />
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>
      {/* Calculated Price */}
      <Grid container item XSmall={12} rowGap={2} alignItems='center' marginTop='40px'>
        <Grid item XSmall={12} Large={5}>
          <Typography style={{ fontSize: '18px', fontWeight: '450' }}>
            {translate('Label.ItemPriceTitle')}
          </Typography>
        </Grid>
        <Grid item XSmall={12} Large={7}>
          <Grid item XSmall={12} Large={7} alignItems='center' marginBottom='3px' container>
            <RobuxIcon />
            <Typography
              data-testid='calculated-price'
              style={{ fontSize: '18px', fontWeight: '425', marginLeft: '6px' }}>
              {calculatePrice()}
            </Typography>
          </Grid>
          <Typography variant='body2' style={{ color: '#CBCBCB' }}>
            {translate('Label.PriceFloorBreakdown')}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default SaleInformationComponent;
