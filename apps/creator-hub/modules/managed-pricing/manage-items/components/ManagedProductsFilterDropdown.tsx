import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { clsx, Icon } from '@rbx/foundation-ui';
import { FoundationBasedMultiSelect } from '@modules/monetization-shared/foundation-multiselect/FoundationBasedMultiSelect';
import {
  Menu,
  MenuSection,
  MenuItem,
  MenuSeparator,
} from '@modules/monetization-shared/foundation-multiselect/FoundationBasedMultiSelectMenu';
import type { ManagedProductType, ManagedPricingStatusFilter } from '../types';

const TYPE_PREFIX = 'type:';
const STATUS_PREFIX = 'status:';

const TYPE_DEV_PRODUCT_VALUE = `${TYPE_PREFIX}DeveloperProduct`;
const TYPE_GAME_PASS_VALUE = `${TYPE_PREFIX}GamePass`;
const STATUS_ENABLED_VALUE = `${STATUS_PREFIX}enabled`;
const STATUS_DISABLED_VALUE = `${STATUS_PREFIX}disabled`;

export type ManagedProductsFilterDropdownProps = {
  typeFilter: ManagedProductType | null;
  statusFilter: ManagedPricingStatusFilter | null;
  onTypeFilterChange: (type: ManagedProductType | null) => void;
  onStatusFilterChange: (status: ManagedPricingStatusFilter | null) => void;
  isDisabled?: boolean;
  className?: string;
};

function toMultiSelectValue(
  typeFilter: ManagedProductType | null,
  statusFilter: ManagedPricingStatusFilter | null,
): string[] {
  const values: string[] = [];
  if (typeFilter) values.push(`${TYPE_PREFIX}${typeFilter}`);
  if (statusFilter) values.push(`${STATUS_PREFIX}${statusFilter}`);
  return values;
}

export const ManagedProductsFilterDropdown = memo(
  ({
    typeFilter,
    statusFilter,
    onTypeFilterChange,
    onStatusFilterChange,
    isDisabled,
    className,
  }: ManagedProductsFilterDropdownProps) => {
    const { translate } = useTranslation();

    const selectedValues = useMemo(
      () => toMultiSelectValue(typeFilter, statusFilter),
      [typeFilter, statusFilter],
    );

    const handleValueChange = useCallback(
      (newValues: string[]) => {
        const added = newValues.find((v) => !selectedValues.includes(v));

        if (!added) {
          const removed = selectedValues.find((v) => !newValues.includes(v));
          if (removed?.startsWith(TYPE_PREFIX)) {
            onTypeFilterChange(null);
          } else if (removed?.startsWith(STATUS_PREFIX)) {
            onStatusFilterChange(null);
          }
          return;
        }

        if (added.startsWith(TYPE_PREFIX)) {
          onTypeFilterChange(added.slice(TYPE_PREFIX.length) as ManagedProductType);
        } else if (added.startsWith(STATUS_PREFIX)) {
          onStatusFilterChange(added.slice(STATUS_PREFIX.length) as ManagedPricingStatusFilter);
        }
      },
      [selectedValues, onTypeFilterChange, onStatusFilterChange],
    );

    const formatFilterLabel = useCallback(
      (values: string[]) => {
        if (values.length === 0) return '';
        const labels: string[] = [];
        if (values.includes(TYPE_DEV_PRODUCT_VALUE)) {
          labels.push(
            translate('Label.DeveloperProduct' /* TranslationNamespace.ManagedPricing */),
          );
        }
        if (values.includes(TYPE_GAME_PASS_VALUE)) {
          labels.push(translate('Label.GamePass' /* TranslationNamespace.ManagedPricing */));
        }
        if (values.includes(STATUS_ENABLED_VALUE)) {
          labels.push(translate('Label.Enabled' /* TranslationNamespace.Creations */));
        }
        if (values.includes(STATUS_DISABLED_VALUE)) {
          labels.push(translate('Label.Disabled' /* TranslationNamespace.Creations */));
        }

        if (labels.length > 1) {
          return translate('Label.CountSelected', { count: labels.length.toString() });
        }
        return labels.at(0) ?? '';
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
            {/* TODO: add menu labels? */}
            <MenuItem
              value={TYPE_DEV_PRODUCT_VALUE}
              title={translate('Label.DeveloperProduct' /* TranslationNamespace.ManagedPricing */)}
            />
            <MenuItem
              value={TYPE_GAME_PASS_VALUE}
              title={translate('Label.GamePass' /* TranslationNamespace.ManagedPricing */)}
            />
          </MenuSection>
          <MenuSeparator />
          <MenuSection>
            {/* TODO: add menu labels? */}
            <MenuItem
              value={STATUS_ENABLED_VALUE}
              title={translate('Label.Enabled' /* TranslationNamespace.Creations */)}
            />
            <MenuItem
              value={STATUS_DISABLED_VALUE}
              title={translate('Label.Disabled' /* TranslationNamespace.Creations */)}
            />
          </MenuSection>
        </Menu>
      </FoundationBasedMultiSelect>
    );
  },
);

ManagedProductsFilterDropdown.displayName = 'ManagedProductsFilterDropdown';
