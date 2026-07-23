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
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { useGetPriceExperimentationEligibility } from '@modules/price-optimization/queries/useGetPriceExperimentationEligibility';

type Props = {
  universeId: number;
  variant: 'Utility' | 'Standard'; // Temporary until full page migration is complete
  showManagedPricing?: boolean;
};

const getManagedPricingLink = dashboard.getManagedPricingUrl;
const getPriceOptimizationLink = dashboard.getMonetizationPriceOptimizationUrl;
const getPriceCheckLink = dashboard.getMonetizationDynamicPriceCheckUrl;

function PassesOptionsMenu({ universeId, variant, showManagedPricing }: Props) {
  const { translate } = useTranslation();

  const { isEligible: isEligibleForPriceOptimization } = useGetPriceExperimentationEligibility({
    enabled: !showManagedPricing,
  });

  // Note: due to the layout also fetching price optimization, the above query will end up fetching regardless
  // We need a separate flag to determine if we should show the price optimization menu item
  const showPriceOptimization = isEligibleForPriceOptimization && !showManagedPricing;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <IconButton
          icon='icon-filled-three-dots-horizontal'
          variant={variant}
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
            {showPriceOptimization && (
              <MenuItem
                asChild
                title={translate('Heading.PriceOptimization')}
                value='price-optimization'>
                <NextLink href={getPriceOptimizationLink(universeId)} className='no-underline' />
              </MenuItem>
            )}

            {showManagedPricing && (
              <MenuItem asChild title={translate('Heading.ManagedPricing')} value='managed-pricing'>
                <NextLink href={getManagedPricingLink(universeId)} className='no-underline' />
              </MenuItem>
            )}

            <MenuItem
              asChild
              title={translate('Heading.DynamicPriceCheck')}
              value='dynamic-price-check'>
              <NextLink href={getPriceCheckLink(universeId)} className='no-underline' />
            </MenuItem>
          </MenuSection>
        </Menu>
      </PopoverContent>
    </Popover>
  );
}

export default withTranslation(memo(PassesOptionsMenu), [TranslationNamespace.Navigation]);
