import React, { FC, useMemo } from 'react';
import { TableCell, ErrorOutlineOutlinedIcon, ReportProblemOutlinedIcon } from '@rbx/ui';
import {
  ChartUnit,
  ChartUnitAggregationType,
  NumberContext,
  formatNumber,
  useLocale,
} from '@modules/charts-generic';
import {
  ExpandableTableRow,
  ErrorLoggingDimensionOption,
  useRAQIV2TranslationDependencies,
} from '@modules/experience-analytics-shared';
import HighlightedText from './HighlightedText';

import useErrorLogTableRowStyles from './ErrorLogTableRow.styles';

type ErrorLogTableRowProps = {
  count: number;
  // TODO: (bxu) where are these defined?
  severity: 'warning' | 'error';
  type: ErrorLoggingDimensionOption;
  message: string;
  stackTrace: string;
};

const ErrorLogTableRow: FC<ErrorLogTableRowProps> = ({
  count,
  severity,
  type,
  message,
  stackTrace,
}) => {
  const locale = useLocale();
  const { translate } = useRAQIV2TranslationDependencies();
  const {
    classes: { content, stackTraceContainer, warningIcon, tableCell },
  } = useErrorLogTableRowStyles();
  const icon = useMemo(() => {
    switch (severity) {
      case 'warning':
        return (
          <ReportProblemOutlinedIcon
            fontSize='small'
            className={warningIcon}
            data-testid='warningIcon'
          />
        );
      case 'error':
        return <ErrorOutlineOutlinedIcon fontSize='small' color='error' data-testid='errorIcon' />;
      default: {
        const exhaustiveCheck: never = severity;
        throw new Error(`Unhandled severity ${exhaustiveCheck}`);
      }
    }
  }, [severity, warningIcon]);

  // We don't want numbers that are too big to be displayed as a long digit, reduce it to the
  // abbreviated version with T, M, B, K.
  const formattedCount = useMemo(() => {
    return formatNumber({
      value: count,
      unit: ChartUnit.Results,
      type: ChartUnitAggregationType.Sum,
      context: NumberContext.TableSummary,
      locale,
      translate,
    });
  }, [count, locale, translate]);

  return (
    <ExpandableTableRow
      hiddenContent={
        stackTrace.length > 0 ? (
          <div className={content}>
            <code className={stackTraceContainer}>{stackTrace}</code>
          </div>
        ) : undefined
      }>
      <TableCell>{formattedCount}</TableCell>
      <TableCell className={tableCell}>{icon}</TableCell>
      <TableCell>{type}</TableCell>
      <TableCell>
        <HighlightedText text={message} />
      </TableCell>
    </ExpandableTableRow>
  );
};

export default ErrorLogTableRow;
