import type { ForwardedRef, ForwardRefRenderFunction } from 'react';
import React, { forwardRef } from 'react';
import type { TTableRowProps } from '@rbx/ui';
import { TableRow } from '@rbx/ui';
import useGenericTableRowStyles from './GenericTableRow.styles';

type GenericTableRowProps = TTableRowProps;

const GenericTableRow: ForwardRefRenderFunction<HTMLTableRowElement, GenericTableRowProps> = (
  props: TTableRowProps,
  ref: ForwardedRef<HTMLTableRowElement>,
) => {
  const { children, className, hover, ...otherProps } = props;
  const {
    classes: { tableRowContainer, hoverEnabled, selected },
    cx,
  } = useGenericTableRowStyles();

  return (
    <TableRow
      {...otherProps}
      hover={hover}
      classes={{ root: cx(tableRowContainer, hover && hoverEnabled, className), selected }}
      ref={ref}>
      {children}
    </TableRow>
  );
};

export default forwardRef(GenericTableRow);
