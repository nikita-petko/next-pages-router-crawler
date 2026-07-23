import type { FunctionComponent } from 'react';
import React from 'react';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Alert, Card, Grid, Typography, Button } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { formatBytes, formatNumberToKMB, storageCost } from '../../common';
import type { UniverseStorage } from '../../types';
import useStorageSummaryStyles from './StorageSummary.styles';

interface StorageSummaryProps {
  displayDSStorage: boolean;
  universeStorage: UniverseStorage;
}

const StorageSummary: FunctionComponent<StorageSummaryProps> = ({
  displayDSStorage,
  universeStorage,
}) => {
  const {
    classes: {
      page,
      cardSize,
      errorCard,
      warningCard,
      storageCard,
      alertContainer,
      storageLimitButton,
    },
  } = useStorageSummaryStyles();
  const { translate } = useTranslation();

  return (
    <Grid container direction='row' XSmall={12} className={page}>
      <Grid item XSmall={12}>
        {universeStorage.bytesTotalPermanent > universeStorage.storageLimitBytes && (
          <Grid item XSmall={12} className={alertContainer}>
            <Alert
              variant='outlined'
              severity='error'
              action={
                <Button
                  className={storageLimitButton}
                  onClick={() =>
                    window.open(
                      `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/cloud-services/extended-services#service-pricing`,
                    )
                  }
                  color='inherit'
                  size='small'>
                  {translate('Action.ViewCostDetails')}
                </Button>
              }>
              {translate('Description.StorageQuotaExceeded')}
            </Alert>
          </Grid>
        )}
      </Grid>
      {!displayDSStorage && universeStorage.numDataStores !== '--' && (
        <Grid item XSmall={12} className={alertContainer}>
          <Alert data-testid='missing-ds-metrics' variant='outlined' severity='info'>
            {Number(universeStorage.numDataStores) >= 100
              ? translate('Description.MissingDataStoreMetrics')
              : translate('Description.Previously100DS')}
          </Alert>
        </Grid>
      )}
      {Number(universeStorage.bytesTotalPermanent) > Number(universeStorage.storageLimitBytes) && (
        <Grid item XSmall={2} className={storageCard}>
          <Card variant='outlined' data-testid='estimated-cost' className={errorCard}>
            <Grid item>
              <Typography variant='captionBody' color='secondary'>
                {translate('Label.EstMonthlyCost')}
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant='subtitle1'>
                {storageCost(
                  Number(universeStorage.bytesTotalPermanent) -
                    Number(universeStorage.storageLimitBytes),
                )}
              </Typography>
            </Grid>
          </Card>
        </Grid>
      )}
      <Grid item XSmall={2} className={storageCard}>
        <Card
          variant='outlined'
          data-testid='total-size'
          className={
            universeStorage.bytesTotalPermanent > universeStorage.storageLimitBytes
              ? warningCard
              : cardSize
          }>
          <Grid item>
            <Typography variant='captionBody' color='secondary'>
              {translate('Label.TotalSize')}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant='subtitle1'>
              {formatBytes(universeStorage.bytesTotalPermanent)}
            </Typography>
          </Grid>
        </Card>
      </Grid>
      <Grid item XSmall={2} className={storageCard}>
        <Card variant='outlined' data-testid='storage-limits' className={cardSize}>
          <Grid item>
            <Typography variant='captionBody' color='secondary'>
              {translate('Label.StorageLimit')}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant='subtitle1'>
              {formatBytes(universeStorage.storageLimitBytes)}
            </Typography>
          </Grid>
        </Card>
      </Grid>
      <Grid item XSmall={2} className={storageCard}>
        <Card variant='outlined' data-testid='num-datastores' className={cardSize}>
          <Grid item>
            <Typography variant='captionBody' color='secondary'>
              {translate('Label.NumDataStores')}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant='subtitle1'>
              {formatNumberToKMB(universeStorage.numDataStores)}
            </Typography>
          </Grid>
        </Card>
      </Grid>
      <Grid item XSmall={2} className={storageCard}>
        <Card variant='outlined' data-testid='num-keys' className={cardSize}>
          <Grid item>
            <Typography variant='captionBody' color='secondary'>
              {translate('Label.NumKeys')}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant='subtitle1'>
              {formatNumberToKMB(universeStorage.numKeys)}
            </Typography>
          </Grid>
        </Card>
      </Grid>
    </Grid>
  );
};

export default withTranslation(StorageSummary, [TranslationNamespace.DataStoresManager]);
