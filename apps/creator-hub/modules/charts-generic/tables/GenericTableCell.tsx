import type { ForwardRefRenderFunction, ReactNode } from 'react';
import React, { forwardRef } from 'react';
import type { TTableCellProps } from '@rbx/ui';
import { TableCell, Typography, useMediaQuery } from '@rbx/ui';
import useGenericTableCellStyles from './GenericTableCell.styles';

export type GenericTableCellProps = TTableCellProps & {
  mobileLabel?: ReactNode;
  stickLeft?: boolean;
  'data-testid'?: string;
};

const GenericTableCell: ForwardRefRenderFunction<HTMLTableCellElement, GenericTableCellProps> = (
  props,
  ref,
) => {
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const { mobileLabel, children, className, ...otherProps } = props;
  const {
    classes: { mobileTableCell, titleCell, tableCell, mobileCell, mobileTableCellContent },

    cx,
  } = useGenericTableCellStyles();

  if (isCompactView) {
    // NOTE(@yhe-cn 03/14/2024): we don't pass otherProps when isCompactView true
    // because props like align, width, etc. should not apply to mobile view.
    if (!mobileLabel) {
      return (
        <TableCell
          className={cx(className, tableCell, titleCell, mobileTableCell)}
          ref={ref}
          data-testid={otherProps['data-testid']}>
          <Typography variant='tableHead' component='div' width='100%'>
            {children}
          </Typography>
        </TableCell>
      );
    }
    return (
      <TableCell
        className={cx(className, tableCell, mobileTableCell)}
        ref={ref}
        data-testid={otherProps['data-testid']}>
        <div className={mobileCell}>{mobileLabel}</div>
        <div className={cx(mobileCell, mobileTableCellContent)}>{children}</div>
      </TableCell>
    );
  }

  return (
    <TableCell {...otherProps} className={cx(className, tableCell)} ref={ref}>
      {children}
    </TableCell>
  );
};

export default forwardRef(GenericTableCell);
