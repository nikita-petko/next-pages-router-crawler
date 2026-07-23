import { Button } from '@rbx/foundation-ui';
import { ReactElement } from 'react';

import useAccountFormStyles from '@components/account/AccountForm.styles';
import AccountSummaryLineItem from '@components/account/AccountSummaryLineItem';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import useTimezones from '@hooks/useTimezones';
import { AccountSummaryItem } from '@type/groupScopedAccount';

interface AccountSummaryProps {
  accounts: AccountSummaryItem[];
  onSetUpAccount?: () => void;
}

const AccountSummary = ({ accounts, onSetUpAccount }: AccountSummaryProps): ReactElement => {
  const { translate: translateAccount } = useNamespacedTranslation(TranslationNamespace.Account);
  const { getTimezoneByEnum } = useTimezones();
  const {
    classes: { accountSummaryWrapper, section, sectionWrapper },
  } = useAccountFormStyles();

  return (
    <div className={accountSummaryWrapper}>
      <div className={sectionWrapper}>
        {accounts.map(({ adAccountId, isLoading, needsSetup, ownerName, timeZone }) => (
          <div className={section} key={`${ownerName ?? 'account'}-${adAccountId ?? 'loading'}`}>
            {ownerName ? <span className='text-heading-small'>{ownerName}</span> : null}
            {needsSetup ? (
              <div>
                <Button onClick={onSetUpAccount} size='Medium' variant='Standard'>
                  {translateAccount('Action.SetUp')}
                </Button>
              </div>
            ) : (
              <>
                <AccountSummaryLineItem
                  isLoading={isLoading}
                  label={translateAccount('Label.AdAccountId')}
                  value={adAccountId}
                />
                <AccountSummaryLineItem
                  isLoading={isLoading}
                  label={translateAccount('Label.Timezone')}
                  value={timeZone ? getTimezoneByEnum(timeZone)?.title : undefined}
                />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccountSummary;
