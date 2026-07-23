import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { clsx, Icon } from '@rbx/foundation-ui';
import { FoundationBasedMultiSelect } from '@modules/monetization-shared/foundation-multiselect/FoundationBasedMultiSelect';
import {
  Menu,
  MenuSection,
  MenuItem,
} from '@modules/monetization-shared/foundation-multiselect/FoundationBasedMultiSelectMenu';
import type { ManagedProductType } from '../../manage-items/types';

const TYPE_DEV_PRODUCT_VALUE: ManagedProductType = 'DeveloperProduct';
const TYPE_GAME_PASS_VALUE: ManagedProductType = 'GamePass';

export type ExperimentProductsFilterDropdownProps = {
  typeFilter: ManagedProductType | null;
  onTypeFilterChange: (type: ManagedProductType | null) => void;
  isDisabled?: boolean;
  className?: string;
};

// Using multiselect for now, we may switch to adding more group options, or switch to a sider filter
export const ExperimentProductsFilterDropdown = memo(
  ({
    typeFilter,
    onTypeFilterChange,
    isDisabled,
    className,
  }: ExperimentProductsFilterDropdownProps) => {
    const { translate } = useTranslation();

    const selectedValues = useMemo(() => (typeFilter ? [typeFilter] : []), [typeFilter]);

    const handleValueChange = useCallback(
      (newValues: string[]) => {
        if (newValues.length === 0) {
          onTypeFilterChange(null);
          return;
        }

        const added = newValues.find((v) => v !== typeFilter);
        if (added) {
          onTypeFilterChange(added as ManagedProductType);
        } else {
          onTypeFilterChange(null);
        }
      },
      [typeFilter, onTypeFilterChange],
    );

    const formatFilterLabel = useCallback(
      (values: string[]) => {
        if (values.length === 0) return '';
        if (values.includes(TYPE_DEV_PRODUCT_VALUE)) {
          return translate('Label.DeveloperProduct' /* TranslationNamespace.ManagedPricing */);
        }
        if (values.includes(TYPE_GAME_PASS_VALUE)) {
          return translate('Label.GamePass' /* TranslationNamespace.ManagedPricing */);
        }
        return '';
      },
      [translate],
    );

    return (
      <FoundationBasedMultiSelect
        className={clsx('small:min-width-[160px]', className)}
        size='Medium'
        variant='Standard'
        value={selectedValues}
        onValueChange={handleValueChange}
        placeholder={translate('Label.FilterBy' /* TranslationNamespace.Creations */)}
        isDisabled={isDisabled}
        formatValue={formatFilterLabel}
        leading={<Icon name='icon-filled-three-bars-horizontal-narrowing' size='Medium' />}
        placeholderClassName='hidden small:block'
        trailingClassName='hidden small:block'
        menuAlign='end'
        ariaLabel={translate('Label.OpenItemFilters' /* TranslationNamespace.Creations */)}>
        <Menu className='min-width-[160px]'>
          <MenuSection>
            <MenuItem
              value={TYPE_DEV_PRODUCT_VALUE}
              title={translate('Label.DeveloperProduct' /* TranslationNamespace.ManagedPricing */)}
            />
            <MenuItem
              value={TYPE_GAME_PASS_VALUE}
              title={translate('Label.GamePass' /* TranslationNamespace.ManagedPricing */)}
            />
          </MenuSection>
        </Menu>
      </FoundationBasedMultiSelect>
    );
  },
);

ExperimentProductsFilterDropdown.displayName = 'ExperimentProductsFilterDropdown';
