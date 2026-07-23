import React from 'react';
import type { TTableRowProps } from '@rbx/ui';
import { TableRow, makeStyles } from '@rbx/ui';

const useStyles = makeStyles()((theme) => ({
  row: {
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: theme.palette.states.hover,
    },
  },
  clickableRow: {
    cursor: 'pointer',
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.components.input.outlined.focusBorder}`,
      outlineOffset: -2,
    },
  },
  selectedRow: {
    backgroundColor: theme.palette.states.selected,
    '&:hover': {
      backgroundColor: theme.palette.states.selected,
    },
  },
}));

interface IpTableRowProps extends Omit<TTableRowProps, 'onClick' | 'onKeyDown'> {
  onActivate?: () => void;
  isSelected?: boolean;
}

/**
 * A table row component that can be made clickable by providing an onActivate prop.
 * When onActivate is provided, it handles both click and keyboard events, along with focus outline.
 */
const IpTableRow: React.FC<IpTableRowProps> = ({
  onActivate,
  isSelected,
  children,
  className,
  ...props
}) => {
  const { classes, cx } = useStyles();

  const handleClick = () => {
    if (onActivate) {
      onActivate();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (onActivate && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onActivate();
    }
  };

  const rowClassName = cx(
    classes.row,
    onActivate && classes.clickableRow,
    isSelected && classes.selectedRow,
    className,
  );

  return (
    <TableRow
      className={rowClassName}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={onActivate ? 0 : undefined}
      data-ip-table-row-activatable={onActivate ? true : undefined}
      {...props}>
      {children}
    </TableRow>
  );
};

export default IpTableRow;
