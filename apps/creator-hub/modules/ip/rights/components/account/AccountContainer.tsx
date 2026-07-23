import { useState } from 'react';
import type { Account, User } from '@rbx/client-rights/v1';
import { AccountStatusEnum } from '@rbx/client-rights/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Tab, Tabs } from '@rbx/ui';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import rightsClient from '@modules/clients/rights';
import { PageLoading } from '@modules/miscellaneous/components';
import { useIXPParameters, useQueryParams } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import { usePaginatedIpFamiliesQuery } from '../../../ipFamilies/hooks/ipFamily';
import ErrorType from '../../enums/ErrorType';
import useEligibility from '../../hooks/useEligibility';
import AuthFailureView from '../error/AuthFailureView';
import RightsApiErrorView from '../error/RightsApiErrorView';
import DetailsFormView from './DetailsFormView';
import DetailsHeader from './DetailsHeader';
import StaticFormView from './DetailsStaticView';
import EditDialog from './EditDialog';
import EligibilityAdvancedTooling from './EligibilityAdvancedTooling';

export enum AccountContainerTabs {
  Eligibility = 'Eligibility',
  RegistrationDetails = 'RegistrationDetails',
}

type TabItem = { id: AccountContainerTabs; tabLabel: string };

const eligibilityTab: TabItem = {
  id: AccountContainerTabs.Eligibility,
  tabLabel: 'Heading.Eligibility',
};

const registrationTab: TabItem = {
  id: AccountContainerTabs.RegistrationDetails,
  tabLabel: 'Heading.RegistrationDetails',
};

const defaultTab = registrationTab;

/**
 * AccountContainer shows an editable view of the account details from registration.
 */
const AccountContainer = () => {
  const { ready, translate } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [unobfuscatedAccount, setUnobfuscatedAccount] = useState<Account>({});
  const [unobfuscatedUser, setUnobfuscatedUser] = useState<User>({});
  const [getCurrentAccountDetailsLoading, setGetCurrentAccountDetailsLoading] = useState(false);
  const [getCurrentAccountDetailsError, setGetCurrentAccountDetailsError] = useState<Error>();
  const { auth, error: authError, isLoading: authLoading } = useEligibility();
  const { account, user } = useCurrentAccountContext();

  const {
    isFetched: isIXPFetched,
    params: { enableEditRegistration },
  } = useIXPParameters(IXPLayers.RightsManager, { restoreInitialValueFromCache: true });
  const { data: ipFamiliesData } = usePaginatedIpFamiliesQuery({
    pageSize: 1,
  });

  const [queryParams, setQueryParams] = useQueryParams(['tab']);

  const ipFamilies = ipFamiliesData?.ipFamilies;
  const isEligible =
    account &&
    account.status === AccountStatusEnum.Verified &&
    (!ipFamilies || ipFamilies.length === 0);

  const tabs: TabItem[] = [];
  if (isEligible) {
    tabs.push(eligibilityTab);
  }
  tabs.push(registrationTab);

  const activeTab = tabs.find((tab) => tab.id === queryParams.tab) ?? defaultTab;

  const onEditHandler = async () => {
    try {
      setGetCurrentAccountDetailsLoading(true);
      const response = await rightsClient.getCurrentAccountDetails();
      setIsEditing(true);
      setDialogOpen(false);
      setUnobfuscatedAccount(response.account || {});
      setUnobfuscatedUser(response.user || {});
    } catch (e) {
      if (e instanceof Error) {
        // NOTE(npatel, 2024-03-25): Match with ChallengeError once that type can be exported. We
        // do not want to show any error message if there is a challenge error.
        if (e.message.includes('challenge error')) {
          return;
        }
        setGetCurrentAccountDetailsError(e);
      }
    } finally {
      setGetCurrentAccountDetailsLoading(false);
    }
  };

  // handle eligibility request
  if (
    !account ||
    !user ||
    !ready ||
    authLoading ||
    getCurrentAccountDetailsLoading ||
    !isIXPFetched
  ) {
    return <PageLoading />;
  }
  if (authError !== ErrorType.None) {
    return <RightsApiErrorView errorType={authError} />;
  }

  if (!(auth?.emailVerified && auth?.idVerified)) {
    return <AuthFailureView errorViewComponent={RightsApiErrorView} />;
  }

  if (getCurrentAccountDetailsError) {
    return <RightsApiErrorView errorType={ErrorType.ServerError} />;
  }

  const onEdit = () => {
    if (account.status === AccountStatusEnum.Verified) {
      setDialogOpen(true);
    } else {
      onEditHandler();
    }
  };

  const editable =
    account.status === AccountStatusEnum.Rejected ||
    account.status === AccountStatusEnum.RejectedByTtl ||
    (account.status === AccountStatusEnum.Verified && enableEditRegistration === true);
  return (
    <Grid container item direction='column' spacing={3}>
      <DetailsHeader account={account} editable={editable} onEdit={onEdit} />
      <Grid item>
        <Tabs
          value={activeTab}
          onChange={(_, tab) => setQueryParams({ tab: tab.id })}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          hidden={tabs.length === 0}>
          {tabs.map((curTab) => (
            <Tab key={curTab.id} label={translate(curTab.tabLabel)} value={curTab} />
          ))}
        </Tabs>
      </Grid>
      <Grid item display={activeTab === registrationTab ? 'none' : ''}>
        {account ? (
          <EligibilityAdvancedTooling accountStatus={account.status ?? ''} />
        ) : (
          <PageLoading />
        )}
      </Grid>
      <Grid
        item
        display={activeTab === registrationTab ? '' : 'none'}
        paddingBottom={3}
        XSmall={12}>
        {isEditing ? (
          <DetailsFormView
            onBack={() => setIsEditing(false)}
            account={unobfuscatedAccount}
            user={unobfuscatedUser}
          />
        ) : (
          <StaticFormView editable={editable} onEdit={onEdit} account={account} user={user} />
        )}
        <EditDialog
          open={isDialogOpen}
          onClose={() => {
            setDialogOpen(false);
          }}
          onSuccess={onEditHandler}
        />
      </Grid>
    </Grid>
  );
};

export default withTranslation(AccountContainer, [TranslationNamespace.RightsPortal]);
