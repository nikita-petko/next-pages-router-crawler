import { memo } from 'react';
import NextLink from 'next/link';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  IconButton,
  Menu,
  MenuItem,
  MenuSection,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@rbx/foundation-ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard } from '@modules/miscellaneous/common/urls/creatorHub';
import useGetPriceExperimentationEligibility from '@modules/price-optimization/queries/useGetPriceExperimentationEligibility';

type Props = {
  universeId: number;
};

const getPriceOptimizationLink = dashboard.getMonetizationPriceOptimizationUrl;
const getPriceCheckLink = dashboard.getMonetizationDynamicPriceCheckUrl;

function PassesOptionsMenu({ universeId }: Props) {
  const { translate } = useTranslation();

  const { isEligible: isEligibleForPriceOptimization } = useGetPriceExperimentationEligibility();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <IconButton
          icon='icon-filled-three-dots-horizontal'
          variant='Utility' // TODO: switch to Standard with full page migration
          size='Medium'
          ariaLabel={translate('Label.OpenOptions')}
          className='shrink-0'
        />
      </PopoverTrigger>
      <PopoverContent side='bottom' align='end' ariaLabel={translate('Label.OpenOptions')}>
        <Menu size='Medium'>
          <MenuSection>
            {isEligibleForPriceOptimization ? (
              <MenuItem
                asChild
                title={translate('Heading.PriceOptimization')}
                value='price-optimization'>
                <NextLink href={getPriceOptimizationLink(universeId)} className='no-underline' />
              </MenuItem>
            ) : null}

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
