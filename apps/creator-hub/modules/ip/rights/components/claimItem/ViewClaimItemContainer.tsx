import { useRouter } from 'next/router';
import React from 'react';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { PageNotFound } from '@modules/miscellaneous/error';
import { PageLoading } from '@modules/miscellaneous/common';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import ViewIncomingClaimItem from './ViewIncomingClaimItem';
import ViewMyClaimItem from './ViewMyClaimItem';

export const ViewClaimItemURL = (claimID: string, claimItemID: string) =>
  `/dashboard/rights-manager/claims/${claimID}/items/${claimItemID}`;

export enum ClaimPages {
  ByMe = 'ByMe',
  AgainstMe = 'AgainstMe',
}

// ViewClaimItemContainer displays the claim item detail page
const ViewClaimItemContainer = () => {
  const router = useRouter();
  const { account } = useCurrentAccountContext();
  const claimId = (router.query.caseId as string) ?? '';
  const claimItemId = router.query.claimItemId ? (router.query.claimItemId as string) : '';

  const [{ claim }] = useQueryParams(['claim']);
  const claimPage = claim as ClaimPages;

  if (!account) {
    return <PageLoading />;
  }

  let claimPageView;
  switch (claimPage) {
    case ClaimPages.ByMe:
      claimPageView = (
        <ViewMyClaimItem account={account} claimId={claimId} claimItemId={claimItemId} />
      );
      break;
    case ClaimPages.AgainstMe:
      claimPageView = (
        <ViewIncomingClaimItem account={account} claimId={claimId} claimItemId={claimItemId} />
      );
      break;
    default:
      return <PageNotFound />;
  }

  return <React.Fragment>{claimPageView}</React.Fragment>;
};

export default ViewClaimItemContainer;
