import type { FunctionComponent } from 'react';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import type { GetBadgeByIdResponse } from '@modules/clients/badges';
import badgesClient from '@modules/clients/badges';
import BadgeContext from './BadgeContext';

const BadgeProvider: FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const router = useRouter();
  const [badgeDetails, setBadgeDetails] = useState<GetBadgeByIdResponse | undefined>();
  const [isRefreshRequired, setIsRefreshRequired] = useState<boolean>(false);
  const [isBadgeLoading, setIsBadgeLoading] = useState<boolean>(false);

  const getBadgeDetails = useCallback(async () => {
    setIsBadgeLoading(true);
    const { badgeId } = router.query;
    if (typeof badgeId === 'undefined') {
      return;
    }

    try {
      const badgeDetailsResponse = await badgesClient.getBadgeDetails(
        parseInt(badgeId as string, 10),
      );
      setBadgeDetails(badgeDetailsResponse);
      setIsRefreshRequired(false); // this is for the thumbnail refresh- keep it in sync with when the badge details refresh
    } catch {
      console.warn(`Could not fetch badge details for universeId ${badgeId}`);
    } finally {
      setIsBadgeLoading(false);
    }
  }, [router.query]);

  const refreshBadgeDetails = () => {
    setIsRefreshRequired(true); // only set the thumbnail refresh cycle on a reload, not initial load
    getBadgeDetails();
  };

  useEffect(() => {
    getBadgeDetails();
  }, [getBadgeDetails]);

  return (
    <BadgeContext.Provider
      // eslint-disable-next-line react/jsx-no-constructed-context-values -- preserving existing behavior; refactor tracked separately
      value={{
        badgeDetails,
        refreshBadgeDetails,
        isBadgeRefreshRequired: isRefreshRequired,
        isBadgeLoading,
      }}>
      {children}
    </BadgeContext.Provider>
  );
};

export default BadgeProvider;
