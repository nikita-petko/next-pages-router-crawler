import { NextRouter } from 'next/router';

import { openGroupAdAccountSetupDialog } from '@components/billing/dialogs/GroupAdAccountSetupDialog';
import { AdCreditBalanceScope, PaymentMethodActionEnum } from '@constants/billing';
import Routes from '@constants/routes';
import { AdvertiserType } from '@type/advertiser';
import { isGroupAdAccountMissing } from '@utils/groupAdAccountSetup';
import { EmptyRequestStateWithErrorType } from '@utils/zustandUtils';

interface NavigateToGroupReloadAdCreditParams {
  entryPoint: string;
  groupAdvertiserState: EmptyRequestStateWithErrorType<AdvertiserType> | undefined;
  groupId: number;
  groupName: string;
  router: NextRouter;
}

const pushReloadAdCredit = (router: NextRouter): void => {
  router.push({
    pathname: Routes.ADD_PAYMENT,
    query: {
      action: PaymentMethodActionEnum.RELOAD_AD_CREDIT,
      balanceScope: AdCreditBalanceScope.Group,
    },
  });
};

/**
 * Opens group ad-account setup when needed, otherwise navigates to reload ad credit.
 */
export const navigateToGroupReloadAdCredit = ({
  entryPoint,
  groupAdvertiserState,
  groupId,
  groupName,
  router,
}: NavigateToGroupReloadAdCreditParams): void => {
  if (isGroupAdAccountMissing(groupAdvertiserState)) {
    openGroupAdAccountSetupDialog({
      entryPoint,
      groupId,
      groupName,
      onComplete: () => {
        pushReloadAdCredit(router);
      },
    });
    return;
  }

  pushReloadAdCredit(router);
};
