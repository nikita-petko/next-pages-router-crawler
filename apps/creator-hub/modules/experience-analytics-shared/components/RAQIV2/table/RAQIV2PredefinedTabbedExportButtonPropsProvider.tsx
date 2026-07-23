import React, { createContext, FunctionComponent, useCallback, useMemo, useState } from 'react';
import { TableExportButtonProps } from '@modules/charts-generic';
import { RAQIV2TableColumnKey } from '../../../adapters/genericRAQIV2TableAdapter';

export type TTableExportButtonProps = TableExportButtonProps<RAQIV2TableColumnKey> | null;

type TTableExportButtonPropsContext = {
  tableExportButtonProps: TTableExportButtonProps;
  updateTableExportButtonProps: (data: TTableExportButtonProps) => void;
};

export const TableExportButtonPropsContext = createContext<TTableExportButtonPropsContext>({
  tableExportButtonProps: null,
  updateTableExportButtonProps: () => {
    throw new Error('TableExportButtonPropsContext not properly initialized');
  },
});

const RAQIV2PredefinedTabbedExportButtonPropsProvider: FunctionComponent<
  React.PropsWithChildren
> = ({ children }) => {
  const [tableExportButtonProps, setTableExportButtonProps] =
    useState<TTableExportButtonProps>(null);

  const updateTableExportButtonProps = useCallback((newData: TTableExportButtonProps) => {
    setTableExportButtonProps(newData);
  }, []);

  const context = useMemo(() => {
    return {
      tableExportButtonProps,
      updateTableExportButtonProps,
    };
  }, [tableExportButtonProps, updateTableExportButtonProps]);

  return (
    <TableExportButtonPropsContext.Provider value={context}>
      {children}
    </TableExportButtonPropsContext.Provider>
  );
};

export const useTabbedTableExportButtonProps = () =>
  React.useContext(TableExportButtonPropsContext);

export default RAQIV2PredefinedTabbedExportButtonPropsProvider;
