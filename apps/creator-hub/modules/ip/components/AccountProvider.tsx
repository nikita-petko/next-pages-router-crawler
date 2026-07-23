import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { PageLoading } from '@modules/miscellaneous/common';
import { Account, Ack, User } from '@rbx/clients/rightsV1';
import { PageNotFound } from '@modules/miscellaneous/error';
import RightsApiErrorView from '../rights/components/error/RightsApiErrorView';
import useCurrentAccount, { AccountFeatures } from '../rights/hooks/useCurrentAccount';

interface AccountContextProps {
  account?: Account;
  user?: User;
  /**
   * Any acks that have not been acknowledged by the user.
   */
  pendingAcks?: Ack[];
  /**
   * Feature flags derived from the account flags.
   */
  features?: AccountFeatures;
}

export const AccountContext = createContext<AccountContextProps | undefined>(undefined);

/**
 * Gets the similar data as `useCurrentAccount` but guaranteed to be loaded.
 */
export const useCurrentAccountContext = (): AccountContextProps => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
};

type AccountProviderProps = {
  children: ReactNode;
  /**
   * Show a error page unless the user has a rights manager account.
   */
  requireRightsAccount?: boolean;
  /**
   * If requireAccount is true, also requires the account to have the enableAm (agreements manager) flag set to true.
   * If not set to true, will show an error page.
   */
  requireAgreementsManager?: boolean;
};

/**
 * Many (most?) rights API calls require the account ID, so we'll fetch it here and only
 * render the children once we have it (since they might make immediate API calls).
 */
export const AccountProvider = ({
  children,
  requireRightsAccount,
  requireAgreementsManager,
}: AccountProviderProps) => {
  const { account, user, acks, isPending, error, features } = useCurrentAccount();

  const data = useMemo(() => {
    return { account, user, pendingAcks: acks, features };
  }, [account, user, acks, features]);

  if (isPending) {
    return <PageLoading />;
  }

  if (requireRightsAccount) {
    if (error) {
      return <RightsApiErrorView errorResponse={error} />;
    }
    if (requireAgreementsManager && !features.enableAgreements) {
      return <PageNotFound />;
    }
  }

  return <AccountContext.Provider value={data}>{children}</AccountContext.Provider>;
};
