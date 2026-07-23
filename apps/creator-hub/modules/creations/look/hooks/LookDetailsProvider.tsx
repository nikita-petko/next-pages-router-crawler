import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { LookDetailV2 } from '@rbx/client-look-api/v1';
import lookClient from '@modules/clients/look';
import { getLookSalesData } from '../utils/lookUtils';
import LookDetailsContext from './LookDetailsContext';

const LookDetailsProvider: FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const router = useRouter();

  const [lookDetail, setLookDetail] = useState<LookDetailV2 | null>();
  const [isLoadingLook, setIsLoadingLook] = useState<boolean>(true);

  const fetchDetails = useCallback(async () => {
    const { isReady } = router;
    if (!isReady) {
      return;
    }
    const { id } = router.query;

    const lookDetailResponse = await lookClient.getLookDetail(id as string);
    setLookDetail(lookDetailResponse.look);
    setIsLoadingLook(false);
  }, [router]);

  const lookSalesData = useMemo(() => {
    return lookDetail ? getLookSalesData(lookDetail) : null;
  }, [lookDetail]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const refreshLookDetails = useCallback(() => {
    fetchDetails();
  }, [fetchDetails]);

  const contextValue = useMemo(
    () => ({
      lookDetail,
      isLoadingLook,
      refreshLookDetails,
      lookSalesData,
    }),
    [lookDetail, isLoadingLook, refreshLookDetails, lookSalesData],
  );

  return <LookDetailsContext.Provider value={contextValue}>{children}</LookDetailsContext.Provider>;
};

export default LookDetailsProvider;
