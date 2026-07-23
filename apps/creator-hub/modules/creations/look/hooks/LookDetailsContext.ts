import { createContext } from 'react';
import type { LookDetailV2 } from '@rbx/client-look-api/v1';
import type { LookSalesData } from '../utils/lookUtils';

export interface LookDetailsContextValue {
  isLoadingLook: boolean;
  refreshLookDetails: () => void;
  lookSalesData: LookSalesData | undefined | null;
  lookDetail: LookDetailV2 | undefined | null;
}
const defaultDetails: LookDetailsContextValue = {
  isLoadingLook: false,
  refreshLookDetails: () => {
    throw new Error('function is not implemented');
  },
  lookSalesData: undefined,
  lookDetail: undefined,
};

const lookDetailsContext = createContext<LookDetailsContextValue>(defaultDetails);
lookDetailsContext.displayName = 'LookDetails';

export default lookDetailsContext;
