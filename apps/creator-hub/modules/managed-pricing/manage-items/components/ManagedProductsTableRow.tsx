import { memo } from 'react';
import NextLink from 'next/link';
import { Badge, Icon } from '@rbx/foundation-ui';
import type { Locale } from '@rbx/intl';
import { useLocalization, useTranslation } from '@rbx/intl';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Avatar, TableCell, TableRow } from '@rbx/ui';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { FROM_MANAGED_PRICING } from '../../constants/links';
import type { ManagedProduct, ManagedProductWithRevenue } from '../../types';
import { ManagedProductsTableRowCheckbox } from './ManagedProductsTableCheckbox';

type PropsWithRevenue = {
  universeId: number;
  product: ManagedProductWithRevenue;
  showRevenue: true;
};

type PropsWithoutRevenue = {
  universeId: number;
  product: ManagedProduct;
  showRevenue?: false;
};

type Props = PropsWithRevenue | PropsWithoutRevenue;

function formatDate(date: Date, locale?: Locale | null): string {
  // Default to browser locale if not set
  return new Date(date).toLocaleDateString(locale ?? undefined, {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit',
  });
}

const getConfigureDeveloperProductLink = dashboard.getConfigureDeveloperProductUrl;
const getConfigurePassSalesLink = dashboard.getConfigurePassSalesUrl;

function getProductConfigureLink(universeId: number, product: ManagedProduct) {
  if (product.type === 'DeveloperProduct') {
    return getConfigureDeveloperProductLink(universeId, product.id);
  }
  return getConfigurePassSalesLink(universeId, product.id);
}

function ManagedProductsTableRow({ product, universeId, showRevenue }: Props) {
  const { translate } = useTranslation();
  const { locale } = useLocalization();

  const numberFormatter = new Intl.NumberFormat(locale ?? undefined);

  const configureLink = getProductConfigureLink(universeId, product);

  const typeLabel =
    product.type === 'DeveloperProduct'
      ? translate('Label.DeveloperProduct' /* TranslationNamespace.ManagedPricing */)
      : translate('Label.GamePass' /* TranslationNamespace.ManagedPricing */);

  return (
    <TableRow hover>
      <TableCell padding='checkbox' align='center' className='padding-xlarge'>
        <ManagedProductsTableRowCheckbox
          product={product}
          aria-label={translate('Action.SelectProduct' /* TranslationNamespace.ManagedPricing */, {
            productName: product.name,
          })}
        />
      </TableCell>

      <TableCell className='max-width-0'>
        <NextLink
          href={{ pathname: configureLink, query: { from: FROM_MANAGED_PRICING } }}
          as={configureLink}
          className='flex items-center min-width-0 gap-small content-inherit no-underline hover:underline'>
          <Avatar variant='rounded' alt={product.name}>
            <Thumbnail2d
              targetId={product.imageAssetId}
              type={ThumbnailTypes.assetThumbnail}
              returnPolicy={ReturnPolicy.PlaceHolder}
              alt=''
            />
          </Avatar>
          <div className='flex flex-col min-width-0'>
            <span className='text-body-medium text-no-wrap text-truncate-end'>{product.name}</span>
            <span className='text-body-small content-muted'>{typeLabel}</span>
          </div>
        </NextLink>
      </TableCell>

      {!showRevenue && (
        <TableCell>
          <Badge
            label={translate(product.isManagedPricingEnabled ? 'Label.Enabled' : 'Label.Disabled')}
            variant={product.isManagedPricingEnabled ? 'Neutral' : 'Warning'}
            className='flex justify-center min-width-1600'
          />
        </TableCell>
      )}

      <TableCell>
        <span className='flex items-center justify-start gap-xsmall'>
          <Icon name='icon-filled-robux' size='Small' aria-label='Robux' />
          {product.defaultPriceInRobux}
        </span>
      </TableCell>

      {showRevenue && (
        <TableCell>
          <span className='flex items-center justify-start gap-xsmall'>
            <Icon name='icon-filled-robux' size='Small' aria-label='Robux' />
            {numberFormatter.format(product.revenueLast30Days)}
          </span>
        </TableCell>
      )}

      <TableCell>
        <span className='text-body-medium'>{formatDate(product.updatedTimestamp, locale)}</span>
      </TableCell>
    </TableRow>
  );
}

export default memo(ManagedProductsTableRow);
