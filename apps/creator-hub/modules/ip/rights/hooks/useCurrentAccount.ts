import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { rightsClient } from '@modules/clients';
import { AccountFlag, AccountFlagFlagNameEnum } from '@rbx/clients/rightsV1';
// import { Account, User } from '@rbx/clients/rightsV1';

export const currentAccountKey = 'rightsClient/currentAccount';

export interface AccountFeatures {
  enableClaimsAndDisputes: boolean;
  enableAgreements: boolean;
  enableTopExperienceMatch: boolean;
}

const getAccountFeatures = (accountFlags?: AccountFlag[]): AccountFeatures => ({
  enableClaimsAndDisputes: !!accountFlags?.some(
    (flag) => flag.flagName === AccountFlagFlagNameEnum.EnableClaimsAndDisputes,
  ),
  enableAgreements: !!accountFlags?.some(
    (flag) => flag.flagName === AccountFlagFlagNameEnum.EnableAgreements,
  ),
  enableTopExperienceMatch: !!accountFlags?.some(
    (flag) => flag.flagName === AccountFlagFlagNameEnum.EnableTopExperienceMatch,
  ),
});

export const useCurrentAccount = (enabled?: boolean) => {
  // TODO @aaronchen keep for testing for now

  // const placeholderaccount = {
  //   id: 'b7e1f1c6-ef7f-4193-b3d8-1f572816a792',
  //   name: 'aaron chen',
  //   organizationName: 'aaron chen',
  //   notes: '',
  //   verificationDocumentIds: [],
  //   accountType: 'Individual',
  //   status: 'Pending',
  //   signature: 'Aaron Chen',
  // };
  // const placeholderuser = {
  //   id: '48c4d262-02f5-4b72-b729-b3e17d70d1e6',
  //   accountId: 'b7e1f1c6-ef7f-4193-b3d8-1f572816a792',
  //   email: 'placeholder',
  //   role: 'Owner',
  //   fullName: 'aaron chen',
  //   phone: 'placeholder',
  //   address: 'my house',
  //   address2: '',
  //   city: 'san mateo',
  //   state: 'ca',
  //   postalCode: '94403',
  //   country: 'United States',
  // };
  // // // rejected
  // placeholderaccount.status = 'Rejected';
  // return {
  //   account: placeholderaccount as Account,
  //   user: placeholderuser as User,
  //   acks: [],
  //   isLoading: false,
  //   error: null
  // };
  // // // pending
  // placeholderaccount.status = 'Pending';
  // return {
  //   account: placeholderaccount as Account,
  //   user: placeholderuser as User,
  //   acks: [],
  //   isLoading: false,
  //   error: null
  // };
  // // verified
  // placeholderaccount.status = AccountStatusEnum.Verified;
  // return {
  //   account: placeholderaccount as Account,
  //   user: placeholderuser as User,
  //   acks: [],
  //   isLoading: false,
  //   error: null
  // };
  // new user
  // return {
  //   account: {} as Account,
  //   user: {} as User,
  //   acks: [],
  //   isLoading: false,
  //   error: { response: {status: 404 } }
  // };

  const response = useQuery({
    queryKey: [currentAccountKey],
    queryFn: async () => {
      return rightsClient.getCurrentAccount();
    },
    // On this API we expect errors (404) as normal.
    // However, useQuery will immediately retry on mount if
    // we hit error previously, so we'll disable that.
    // Otherwise, if we have nested `useCurrentAccount`
    // calls, we can run into infinite loops.
    retryOnMount: false,
    enabled,
  });

  const account = response.data?.account || {};
  const user = response.data?.user || {};
  const acks = response.data?.acks || [];
  const accountStatus = account?.status;

  const features = useMemo(() => getAccountFeatures(account?.flags), [account?.flags]);

  return {
    account,
    user,
    acks,
    accountStatus,
    features,
    ...response,
  };
};
export default useCurrentAccount;
