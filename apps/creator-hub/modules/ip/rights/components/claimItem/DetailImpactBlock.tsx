import type { FunctionComponent } from 'react';
import React from 'react';
import { withTranslation } from '@rbx/intl';
import { Grid, Typography, Divider } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

interface DetailImpactBlockProps {
  isImpacted: boolean;
  isDevMarketplace: boolean;
  translate: (key: string) => string;
}

const DetailImpactBlock: FunctionComponent<DetailImpactBlockProps> = ({
  isImpacted,
  isDevMarketplace,
  translate,
}) => (
  <Grid item XSmall={12} container direction='column' rowSpacing={3}>
    <Grid item>
      <Divider />
    </Grid>
    <Grid item>
      <Typography variant='h6'>{translate('Heading.Impact')}</Typography>
    </Grid>
    <Grid item container>
      <Grid item XSmall={12}>
        <Typography variant='body2' color='secondary'>
          {translate('Description.Monetization')}
        </Typography>
      </Grid>
      <Grid item XSmall={12}>
        <Typography variant='body2'>
          {isImpacted ? translate('Description.Offsale') : translate('Description.OnSale')}
        </Typography>
      </Grid>
    </Grid>
    <Grid item container>
      <Grid item XSmall={12}>
        <Typography variant='body2' color='secondary'>
          {translate('Description.Discoverability')}
        </Typography>
      </Grid>
      <Grid item XSmall={12}>
        <Typography variant='body2'>
          {isImpacted
            ? translate('Description.NotDiscoverable')
            : translate('Description.Discoverable')}
        </Typography>
      </Grid>
    </Grid>
    <Grid item container>
      <Grid item XSmall={12}>
        <Typography variant='body2' color='secondary'>
          {translate('Description.Usability')}
        </Typography>
      </Grid>
      <Grid item XSmall={12}>
        <Typography variant='body2'>
          {isDevMarketplace
            ? translate('Description.Visible')
            : translate('Description.UsabilityWearable')}
        </Typography>
      </Grid>
    </Grid>
  </Grid>
);

export default withTranslation(DetailImpactBlock, [TranslationNamespace.RightsPortal]);
