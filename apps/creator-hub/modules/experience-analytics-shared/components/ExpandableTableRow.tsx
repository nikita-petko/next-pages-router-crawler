import React, { FC, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { Collapse, TableCell, TableRow, ExpandMoreIcon, ExpandLessIcon, Paper } from '@rbx/ui';
import { logAnalyticsError } from '@modules/charts-generic';
import useExpandableTableRowStyles from './ExpandableTableRow.styles';

type ExpandableTableRowProps = React.ComponentProps<typeof TableRow> & {
  hiddenContent?: ReactNode;
  isExpanded?: boolean;
  onToggle?: (isExpanded: boolean) => void;
};

const ExpandableTableRow: FC<ExpandableTableRowProps> = ({
  hiddenContent,
  children,
  onToggle,
  isExpanded: isExpandedProps = false,
  ...tableRowProps
}) => {
  const [isExpanded, setExpanded] = useState<boolean>(isExpandedProps);
  const onClick = useCallback(() => {
    if (hiddenContent === undefined) {
      return;
    }

    setExpanded((previousValue) => {
      const newValue = !previousValue;
      if (onToggle !== undefined) {
        onToggle(newValue);
      }

      return newValue;
    });
  }, [hiddenContent, onToggle]);

  const {
    classes: { cellsWrapperRow, contentWrapperRow },
  } = useExpandableTableRowStyles({
    hasContent: hiddenContent !== undefined,
  });

  useEffect(() => {
    if (hiddenContent === undefined) {
      return;
    }

    if (isExpandedProps !== undefined) {
      setExpanded(isExpandedProps);
    }
  }, [hiddenContent, isExpandedProps]);

  // Need to add one for the extra column used to contain the arrow
  const numColumns = useMemo(() => React.Children.count(children) + 1, [children]);

  const expandIcon = useMemo(
    () =>
      isExpanded ? (
        <ExpandLessIcon data-testid='expandLessIcon' />
      ) : (
        <ExpandMoreIcon data-testid='expandMoreIcon' />
      ),
    [isExpanded],
  );

  // If no children components are passed, we decide that this is probably an invalid usage of the component,
  // and we skip rendering completely.
  if (React.Children.count(children) === 0) {
    logAnalyticsError(
      'Invalid usage of ExpandableTableRow: at least 1 TableCell must be passed as children',
    );

    return null;
  }

  return (
    <React.Fragment>
      <TableRow className={cellsWrapperRow} onClick={onClick} data-testid='cellsContainer'>
        {children}
        <TableCell data-testid='iconContainer'>{hiddenContent && expandIcon}</TableCell>
      </TableRow>
      {hiddenContent && (
        <TableRow {...tableRowProps} data-testid='hiddenContentContainer'>
          <TableCell className={contentWrapperRow} colSpan={numColumns}>
            <Collapse in={isExpanded} timeout='auto' unmountOnExit>
              <Paper>{hiddenContent}</Paper>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
};

export default ExpandableTableRow;
