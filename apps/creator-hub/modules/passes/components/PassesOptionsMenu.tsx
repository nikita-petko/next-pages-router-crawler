import { memo } from 'react';
import NextLink from 'next/link';
import {
  IconButton,
  Menu,
  MenuItem,
  MenuSection,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@rbx/foundation-ui';
import { useTranslationWithNamespace, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';

type Props = {
  universeId: number;
};

const getManagedPricingLink = dashboard.getManagedPricingUrl;
const getPriceCheckLink = dashboard.getMonetizationDynamicPriceCheckUrl;
const getPersonalizedShopLink = dashboard.getPersonalizedShopsUrl;

function PassesOptionsMenu({ universeId }: Props) {
  const { translate } = useTranslationWithNamespace(TranslationNamespace.Navigation);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <IconButton
          icon='icon-filled-three-dots-horizontal'
          variant='Standard'
          size='Medium'
          ariaLabel={translate('Label.OpenOptions')}
          className='shrink-0'
        />
      </PopoverTrigger>
      <PopoverContent
        // Note: adding explicitly specified offsets for design layout
        sideOffset={8} // 8px away from trigger
        collisionPadding={32} // 32px away from edges of screen
        ariaLabel={translate('Label.OpenOptions')}>
        <Menu size='Medium'>
          <MenuSection>
            <MenuItem asChild title={translate('Heading.ManagedPricing')} value='managed-pricing'>
              <NextLink href={getManagedPricingLink(universeId)} className='no-underline' />
            </MenuItem>

            <MenuItem
              asChild
              title={translate('Heading.DynamicPriceCheck')}
              value='dynamic-price-check'>
              <NextLink href={getPriceCheckLink(universeId)} className='no-underline' />
            </MenuItem>

            <MenuItem asChild title={translate('Heading.PersonalizedShop')} value='shop'>
              <NextLink href={getPersonalizedShopLink(universeId)} className='no-underline' />
            </MenuItem>
          </MenuSection>
        </Menu>
      </PopoverContent>
    </Popover>
  );
}

export default withTranslation(memo(PassesOptionsMenu), [TranslationNamespace.Navigation]);
