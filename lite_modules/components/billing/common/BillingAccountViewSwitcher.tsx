import { Dropdown, Menu, MenuItem, MenuLabel, MenuSection } from '@rbx/foundation-ui';

import AppTooltip from '@components/common/AppTooltip';
import { AdCreditBalanceScope } from '@constants/billing';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

interface BillingAccountViewSwitcherProps {
  groupName: string;
  isGroupOptionDisabled?: boolean;
  onAccountViewChange: (accountView: AdCreditBalanceScope) => void;
  personalAccountName: string;
  value: AdCreditBalanceScope;
}

const BillingAccountViewSwitcher = ({
  groupName,
  isGroupOptionDisabled = false,
  onAccountViewChange,
  personalAccountName,
  value,
}: BillingAccountViewSwitcherProps) => {
  const { translate: translateAccount } = useNamespacedTranslation(TranslationNamespace.Account);
  const { translate: translateBilling } = useNamespacedTranslation(TranslationNamespace.Billing);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);

  return (
    <div className='flex flex-col max-width-[320px]' data-testid='billingAccountViewSwitcher'>
      <Dropdown
        label={translateBilling('Label.SelectAccountView')}
        onValueChange={(selectedValue) => {
          const selectedAccountView = selectedValue as AdCreditBalanceScope;
          if (isGroupOptionDisabled && selectedAccountView === AdCreditBalanceScope.Group) {
            return;
          }
          onAccountViewChange(selectedAccountView);
        }}
        placeholder={translateBilling('Label.SelectAccountView')}
        size='Medium'
        value={value}>
        <Menu>
          <MenuSection>
            <MenuLabel
              className='text-label-medium content-muted'
              title={translateMisc('Label.Group')}
            />
            {isGroupOptionDisabled ? (
              <AppTooltip
                delayDurationMs={0}
                position='right-center'
                title={translateMisc('Description.GroupSpendPermissionDenied')}>
                <span className='block width-full'>
                  <MenuItem
                    data-testid='accountViewGroupOption'
                    disabled
                    title={groupName || translateBilling('Label.RobloxAdCredit')}
                    value={AdCreditBalanceScope.Group}
                  />
                </span>
              </AppTooltip>
            ) : (
              <MenuItem
                data-testid='accountViewGroupOption'
                title={groupName || translateBilling('Label.RobloxAdCredit')}
                value={AdCreditBalanceScope.Group}
              />
            )}
          </MenuSection>
          <MenuSection>
            <MenuLabel
              className='text-label-medium content-muted'
              title={translateAccount('Heading.PersonalAccount')}
            />
            <MenuItem
              data-testid='accountViewPersonalOption'
              title={personalAccountName}
              value={AdCreditBalanceScope.Personal}
            />
          </MenuSection>
        </Menu>
      </Dropdown>
    </div>
  );
};

export default BillingAccountViewSwitcher;
