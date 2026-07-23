import React, { Fragment, FunctionComponent, useEffect, useState } from 'react';
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
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Merchant, merchantConfigs } from '../../configs/merchantConfigs';
import CommerceSelectMerchantCard from './CommerceSelectMerchantCard';

export interface CommerceSelectMerchantModalProps {
  onCancel: () => void;
  onConfirm: (merchant: Merchant) => void;
  isShopifyEnabled: boolean;
  isAmazonEnabled: boolean;
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

const CommerceSelectMerchantModal: FunctionComponent<CommerceSelectMerchantModalProps> = ({
  onCancel,
  onConfirm,
  isShopifyEnabled,
  isAmazonEnabled,
}) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);

  const merchantDetails = Object.values(merchantConfigs).filter((merchantDetail) => {
    return (
      (merchantDetail.merchant === Merchant.Shopify && isShopifyEnabled) ||
      (merchantDetail.merchant === Merchant.Amazon && isAmazonEnabled)
    );
  });

  const selectedMerchantDetail = selectedMerchant
    ? merchantDetails.find((detail) => detail.merchant === selectedMerchant)
    : null;

  useEffect(() => {
    if (merchantDetails.length === 1) {
      setSelectedMerchant(merchantDetails[0].merchant);
    }
  }, [merchantDetails]);

  return (
    <Fragment>
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
                  selected={selectedMerchant === merchantDetail.merchant}
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
            if (selectedMerchant !== null) {
              onConfirm(selectedMerchant);
            }
          }}
          disabled={selectedMerchant === null}
          size='large'
          endIcon={selectedMerchantDetail?.importCatalogHref ? <OpenInNewIcon /> : null}>
          {selectedMerchantDetail?.merchant === Merchant.Shopify
            ? translate('Action.Connect')
            : translate('Action.ImportCatalog')}
        </Button>
      </DialogActions>
    </Fragment>
  );
};

export default withTranslation(CommerceSelectMerchantModal, [TranslationNamespace.Commerce]);
