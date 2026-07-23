import { useRouter } from 'next/router';
import React from 'react';
import { PageLoading } from '@modules/miscellaneous/components';
import { PageNotFound } from '@modules/miscellaneous/error';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import ViewIncomingClaimItem from './ViewIncomingClaimItem';
import ViewMyClaimItem from './ViewMyClaimItem';

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

  return <>{claimPageView}</>;
};

export default ViewClaimItemContainer;
