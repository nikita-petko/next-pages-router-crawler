import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, RobuxIcon, Typography, makeStyles } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const useLookTotalPriceStyles = makeStyles()((theme) => ({
  totalPriceTextColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    minWidth: 0,
  },
  totalPriceDescription: {
    color: theme.palette.content.muted,
    marginTop: 8,
  },
  totalPriceAmountRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  robuxIcon: {
    paddingRight: 4,
  },
}));

export interface LookTotalPriceProps {
  totalValue: number;
}

const LookTotalPrice: FunctionComponent<LookTotalPriceProps> = ({ totalValue }) => {
  const { translate } = useTranslation();
  const {
    classes: { totalPriceTextColumn, totalPriceDescription, totalPriceAmountRow, robuxIcon },
  } = useLookTotalPriceStyles();
  return (
    <div>
      <Typography variant='h5' style={{ fontSize: '24px', fontWeight: '450' }}>
        {translate('Label.Pricing')}
      </Typography>
      <Grid
        container
        item
        XSmall={12}
        alignItems='center'
        style={{ marginTop: '32px' }}
        data-testid='look-total-price-section'>
        <Grid item XSmall={12} Large={5} style={{ paddingRight: '20px' }}>
          <div className={totalPriceTextColumn}>
            <Typography style={{ fontSize: '18px', fontWeight: '450' }} component='div'>
              {translate('Label.TotalPrice')}
            </Typography>
            <Typography variant='body2' component='div' className={totalPriceDescription}>
              {translate('Message.TotalPriceDescription')}
            </Typography>
          </div>
        </Grid>
        <Grid item XSmall={12} Large={7}>
          <div className={totalPriceAmountRow}>
            <RobuxIcon fontSize='large' className={robuxIcon} />
            <Typography
              style={{ fontSize: '18px', fontWeight: '425' }}
              data-testid='look-total-price-robux'>
              {totalValue}
            </Typography>
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

export default withTranslation(LookTotalPrice, [TranslationNamespace.ConfigureItem]);
