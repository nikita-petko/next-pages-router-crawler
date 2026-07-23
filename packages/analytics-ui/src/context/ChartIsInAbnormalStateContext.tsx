import React, { useContext } from 'react';

const ChartIsInAbnormalStateContext = React.createContext<boolean>(false);

export const useChartIsInAbnormalState = (): boolean => {
  return useContext(ChartIsInAbnormalStateContext);
};

export const ChartIsInAbnormalStateProvider: React.FC<
  React.PropsWithChildren<{ value: boolean }>
> = ({ value, children }) => {
  return (
    <ChartIsInAbnormalStateContext.Provider value={value}>
      {children}
    </ChartIsInAbnormalStateContext.Provider>
  );
};
