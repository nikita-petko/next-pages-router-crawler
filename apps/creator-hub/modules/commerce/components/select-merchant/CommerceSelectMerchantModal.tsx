import { useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  makeStyles,
  OpenInNewIcon,
  Typography,
} from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Merchant, merchantConfigs } from '../../configs/merchantConfigs';
import CommerceSelectMerchantCard from './CommerceSelectMerchantCard';

interface CommerceSelectMerchantModalProps {
  onCancel: () => void;
  onConfirm: (merchant: Merchant) => void;
  isShopifyEnabled: boolean;
}

const useStyles = makeStyles()((theme) => ({
  merchantContainer: {
    display: 'flex',
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(0.5),
    columnGap: theme.spacing(2),
    rowGap: theme.spacing(2.5),
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'stretch',
    justifyContent: 'center',

    [theme.breakpoints.down('Medium')]: {
      flexDirection: 'column',
      flexWrap: 'wrap',
      alignItems: 'center',
      paddingLeft: theme.spacing(1.5),
      paddingRight: theme.spacing(1.5),
    },
  },
  merchantItem: {
    width: '50%',
    maxWidth: 500,
    [theme.breakpoints.down('Medium')]: {
      width: '100%',
    },
  },
  lastDialogActionButton: {
    marginLeft: '8px',
  },
}));

const CommerceSelectMerchantModal = ({
  onCancel,
  onConfirm,
  isShopifyEnabled,
}: CommerceSelectMerchantModalProps) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);

  const merchantDetails = Object.values(merchantConfigs).filter((merchantDetail) => {
    return merchantDetail.merchant === Merchant.Shopify && isShopifyEnabled;
  });

  // Auto-select when only one merchant is available (derived during render to avoid EffectSetState)
  const effectiveSelectedMerchant =
    selectedMerchant ?? (merchantDetails.length === 1 ? merchantDetails[0].merchant : null);

  const selectedMerchantDetail = effectiveSelectedMerchant
    ? merchantDetails.find((detail) => detail.merchant === effectiveSelectedMerchant)
    : null;

  return (
    <>
      <DialogTitle>{translate('Heading.SelectMerchant')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <Typography variant='body1' color='primary'>
            {translate('Description.SelectMerchant')}
          </Typography>
        </DialogContentText>
        <Grid className={classes.merchantContainer}>
          {merchantDetails.map((merchantDetail) => {
            return (
              <Grid key={merchantDetail.merchant} item className={classes.merchantItem}>
                <CommerceSelectMerchantCard
                  selected={effectiveSelectedMerchant === merchantDetail.merchant}
                  merchantDetail={merchantDetail}
                  onClick={() => {
                    setSelectedMerchant(merchantDetail.merchant);
                  }}
                />
              </Grid>
            );
          })}
        </Grid>
      </DialogContent>
      <DialogActions disableSpacing={false}>
        <Button variant='contained' color='secondary' onClick={onCancel} size='large'>
          {translate('Action.Cancel')}
        </Button>
        <Button
          className={classes.lastDialogActionButton}
          variant='contained'
          color='primaryBrand'
          component='a'
          href={selectedMerchantDetail?.importCatalogHref}
          target='_blank'
          onClick={() => {
            if (effectiveSelectedMerchant !== null) {
              onConfirm(effectiveSelectedMerchant);
            }
          }}
          disabled={effectiveSelectedMerchant === null}
          size='large'
          endIcon={selectedMerchantDetail?.importCatalogHref ? <OpenInNewIcon /> : null}>
          {translate('Action.Connect')}
        </Button>
      </DialogActions>
    </>
  );
};

export default withTranslation(CommerceSelectMerchantModal, [TranslationNamespace.Commerce]);
