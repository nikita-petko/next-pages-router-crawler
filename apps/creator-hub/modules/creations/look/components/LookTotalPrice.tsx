import React, { FunctionComponent } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Grid, RobuxIcon, Typography, makeStyles } from '@rbx/ui';

const useLookTotalPriceStyles = makeStyles()(() => ({
  totalPriceSection: {
    marginTop: 32,
  },
  totalPriceTextColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    minWidth: 0,
  },
  totalPriceDescription: {
    color: '#CBCBCB',
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
    classes: {
      totalPriceSection,
      totalPriceTextColumn,
      totalPriceDescription,
      totalPriceAmountRow,
      robuxIcon,
    },
  } = useLookTotalPriceStyles();

  return (
    <Grid
      container
      item
      XSmall={12}
      alignItems='center'
      className={totalPriceSection}
      data-testid='look-total-price-section'>
      <Grid item XSmall={12} Large={5} style={{ paddingRight: '20px' }}>
        <div className={totalPriceTextColumn}>
          <Typography variant='h6' component='div'>
            {translate('Label.TotalPrice')}
          </Typography>
          <Typography variant='body2' component='div' className={totalPriceDescription}>
            {translate('Message.TotalPriceDescription')}
          </Typography>
        </div>
      </Grid>
      <Grid item XSmall={12} Large={7}>
        <div className={totalPriceAmountRow}>
          <RobuxIcon fontSize='small' className={robuxIcon} />
          <Typography variant='h6' data-testid='look-total-price-robux'>
            {totalValue}
          </Typography>
        </div>
      </Grid>
    </Grid>
  );
};

export default withTranslation(LookTotalPrice, [TranslationNamespace.ConfigureItem]);
