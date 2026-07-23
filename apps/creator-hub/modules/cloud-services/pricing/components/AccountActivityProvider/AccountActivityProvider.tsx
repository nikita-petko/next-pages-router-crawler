import type { FunctionComponent } from 'react';
import React, { createContext, useContext, useState, useMemo } from 'react';
import { convertToYearMonthFormat } from '@modules/miscellaneous/utils/dateUtils';
import type { YearMonth } from '@modules/miscellaneous/utils/dateUtils';

export type TAccountActivityContext = {
  startMonth: YearMonth; // format 'YYYY-MM'
  endMonth: YearMonth; // format 'YYYY-MM'
  onChangeStartMonth: (month: YearMonth) => void;
  onChangeEndMonth: (month: YearMonth) => void;
};

const AccountActivityContext = createContext<TAccountActivityContext>({
  startMonth: '0000-00',
  endMonth: '0000-00',
  onChangeStartMonth: () => {
    throw new Error('not implemented yet');
  },
  onChangeEndMonth: () => {
    throw new Error('not implemented yet');
  },
});

export const useAccountActivityFilter = () => useContext(AccountActivityContext);

const getDefaultYearMonthRange = (): { start: YearMonth; end: YearMonth } => {
  const today = new Date(Date.now());
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  return {
    start: convertToYearMonthFormat(oneMonthAgo),
    end: convertToYearMonthFormat(today),
  };
};

export const AccountActivityProvider: FunctionComponent<React.PropsWithChildren> = ({
  children,
}) => {
  const { start, end } = getDefaultYearMonthRange();
  const [startMonth, setStartMonth] = useState<YearMonth>(start);
  const [endMonth, setEndMonth] = useState<YearMonth>(end);

  const contextValue = useMemo(
    () => ({
      startMonth,
      endMonth,
      onChangeStartMonth: setStartMonth,
      onChangeEndMonth: setEndMonth,
    }),
    [startMonth, endMonth, setStartMonth, setEndMonth],
  );

  return (
    <AccountActivityContext.Provider value={contextValue}>
      {children}
    </AccountActivityContext.Provider>
  );
};

export default AccountActivityProvider;
