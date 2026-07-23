import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import lookClient from '@modules/clients/look';
import { LookDetailV2 } from '@rbx/clients/lookApi';
import { getLookSalesData } from '../utils/lookUtils';
import LookDetailsContext from './LookDetailsContext';

const LookDetailsProvider: FunctionComponent<React.PropsWithChildren<unknown>> = ({ children }) => {
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
