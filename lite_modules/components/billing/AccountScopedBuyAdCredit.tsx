import { ReactElement, useEffect, useRef, useState } from 'react';

import { BuyAdCredit } from '@components/billing/BuyAdCredit';
import type { BuyAdCreditProps } from '@components/billing/BuyAdCredit';
import { WatermarkedBuyAdCredit } from '@components/billing/WatermarkedBuyAdCredit';
import { AdCreditBalanceScope } from '@constants/billing';

const resolveInitialBalanceScope = (
  showGroupBalanceOption: boolean,
  initialBalanceScope?: AdCreditBalanceScope,
): AdCreditBalanceScope => {
  if (initialBalanceScope === AdCreditBalanceScope.Group && showGroupBalanceOption) {
    return AdCreditBalanceScope.Group;
  }
  if (initialBalanceScope === AdCreditBalanceScope.Personal) {
    return AdCreditBalanceScope.Personal;
  }
  return showGroupBalanceOption ? AdCreditBalanceScope.Group : AdCreditBalanceScope.Personal;
};

interface AccountScopedBuyAdCreditProps extends Omit<
  BuyAdCreditProps,
  'controlledBalanceScope' | 'onBalanceScopeChange'
> {
  groupWatermarkedRobuxConversionEnabled: boolean;
  isGroupSpendPermissionDenied?: boolean;
  personalWatermarkedRobuxConversionEnabled: boolean;
}

const AccountScopedBuyAdCredit = ({
  groupWatermarkedRobuxConversionEnabled,
  initialBalanceScope,
  isGroupSpendPermissionDenied = false,
  personalWatermarkedRobuxConversionEnabled,
  showGroupBalanceOption = false,
  ...props
}: AccountScopedBuyAdCreditProps): ReactElement => {
  const canUseGroupBalance = showGroupBalanceOption && !isGroupSpendPermissionDenied;
  const [balanceScope, setBalanceScope] = useState<AdCreditBalanceScope>(() =>
    resolveInitialBalanceScope(canUseGroupBalance, initialBalanceScope),
  );
  const [isPurchaseInFlight, setIsPurchaseInFlight] = useState<boolean>(false);
  const userSelectedBalanceScope = useRef<AdCreditBalanceScope | undefined>(undefined);
  const previousInitialBalanceScope = useRef<AdCreditBalanceScope | undefined>(initialBalanceScope);

  useEffect(() => {
    const initialBalanceScopeChanged = previousInitialBalanceScope.current !== initialBalanceScope;
    previousInitialBalanceScope.current = initialBalanceScope;
    if (initialBalanceScopeChanged) {
      userSelectedBalanceScope.current = undefined;
    }

    setBalanceScope((currentBalanceScope) => {
      if (initialBalanceScopeChanged) {
        return resolveInitialBalanceScope(canUseGroupBalance, initialBalanceScope);
      }
      if (!canUseGroupBalance && currentBalanceScope === AdCreditBalanceScope.Group) {
        return AdCreditBalanceScope.Personal;
      }
      if (userSelectedBalanceScope.current) {
        return userSelectedBalanceScope.current;
      }
      return resolveInitialBalanceScope(canUseGroupBalance, initialBalanceScope);
    });
  }, [canUseGroupBalance, initialBalanceScope]);

  const isWatermarkedRobuxConversionEnabled =
    balanceScope === AdCreditBalanceScope.Group
      ? groupWatermarkedRobuxConversionEnabled
      : personalWatermarkedRobuxConversionEnabled;
  const BuyAdCreditComponent = isWatermarkedRobuxConversionEnabled
    ? WatermarkedBuyAdCredit
    : BuyAdCredit;

  const handleBalanceScopeChange = (nextBalanceScope: AdCreditBalanceScope): void => {
    if (isPurchaseInFlight) {
      return;
    }
    userSelectedBalanceScope.current = nextBalanceScope;
    setBalanceScope(nextBalanceScope);
  };

  return (
    <BuyAdCreditComponent
      {...props}
      controlledBalanceScope={balanceScope}
      initialBalanceScope={initialBalanceScope}
      isGroupSpendPermissionDenied={isGroupSpendPermissionDenied}
      onBalanceScopeChange={handleBalanceScopeChange}
      onPurchaseStateChange={setIsPurchaseInFlight}
      showGroupBalanceOption={showGroupBalanceOption}
    />
  );
};

export default AccountScopedBuyAdCredit;
