import type { FC } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Chip, Grid, Link, Typography, useMediaQuery } from '@rbx/ui';
import { Asset } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { docs } from '@modules/miscellaneous/urls/creatorHub';
import useHeaderStyles from './Header.styles';

interface AssetsHeaderProps {
  assetType: Asset;
  setAssetType: (assetType: Asset) => void;
}

const AssetsHeader: FC<AssetsHeaderProps> = ({ assetType, setAssetType }) => {
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('Large'));
  const {
    classes: { container },
  } = useHeaderStyles();
  const { translate, translateHTML } = useTranslation();
  return (
    <div className={container} data-testid='assets-header-container'>
      {!isSm && (
        <Typography marginBottom={4} variant='body1' component='p'>
          {translateHTML('Description.Products2', [
            {
              opening: 'linkStart',
              closing: 'linkEnd',
              content(chunks) {
                return (
                  <Link href={docs.getSellingOnCreatorStoreUrl()} data-testid='selling-link'>
                    {chunks}
                  </Link>
                );
              },
            },
          ])}
        </Typography>
      )}
      <Grid container justifyContent='space-between' alignItems='top' marginY={2}>
        <Grid item XSmall={2}>
          <Grid container columnSpacing={1}>
            <Grid item>
              <Chip
                data-testid='chip-models'
                label={translate('Label.Models')}
                clickable
                color={assetType === Asset.Model ? 'primary' : 'secondary'}
                onClick={() => setAssetType(Asset.Model)}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
};

export default withTranslation(AssetsHeader, [TranslationNamespace.DataSharingSettingsV2]);
