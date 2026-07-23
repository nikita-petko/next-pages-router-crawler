import React, { ReactNode } from 'react';

import { Locale } from '@rbx/intl';
import {
  Button,
  Checkbox,
  checkboxClasses,
  Link,
  Tooltip,
  Typography,
  ErrorOutlineOutlinedIcon,
  WarningIcon,
} from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Flex } from '@modules/miscellaneous/common/components';
import { dateTimeFormatter } from '@rbx/core';
import { translationKey, TranslationKeyToFormattedText } from '@modules/analytics-translations';
import { ColumnType, ColumnTypeToAlign, TableColumnConfig } from './types/GenericColumnType';
import { CellDataType } from './types/GenericTableType';
import { ChartUnit } from '../charts/types/ChartTypes';
import { formatNumber, formatNumberWithSpec, NumberIcon } from '../charts/numberFormatters';
import { formatMediumDate, formatMediumDateTime } from '../charts/formatters';
import HighlightingCodeBlock, {
  HighlightingCodeBlockLanguage,
} from '../components/HighlightingCodeBlock/HighlightingCodeBlock';
import GenericCellContentWithTooltip from './GenericCellContentWithTooltip';
import InlinePriceWithRobuxIcon from './InlinePriceWithRobuxIcon';
import StatusChip from './StatusChip';
import logAnalyticsError from '../utils/logAnalyticsError';
import ActionColumnCell from './cells/ActionColumnCell';
import CopyRawJSONButton from './CopyRawJSONButton';
import CodeColumnCell from './cells/CodeColumnCell';
import ComparisonChip from '../charts/ComparisonChip';
import cellAlignmentToJustifyContent from './cells/cellAlignmentToJustifyContent';
import DiffCodeEditor from '../components/CodeEditors/DiffCodeEditor';
import CodeEditorSupportedLanguages from '../components/CodeEditors/CodeEditorSupportedLanguages';
import CodeEditor from '../components/CodeEditors/CodeEditor';

const formatCellContent = <
  TColumnKey extends string | number,
  TActionType extends string,
  TActionOn = string,
>(
  cellValue: CellDataType<TActionType, TActionOn> | undefined,
  config: TableColumnConfig<TColumnKey>,
  locale: Locale,
  translate: TranslationKeyToFormattedText,
  forCellInSummaryRow?: boolean,
  isRowSelected?: boolean,
): ReactNode => {
  if (!cellValue) {
    // NOTE(gperkins@20241105): this probably means some row data map was constructed incorrectly
    logAnalyticsError(
      `Table column ${config.columnKey} was attempting to format without a cellValue`,
    );
    return null;
  }

  const { type } = cellValue;
  if (config.columnType !== type) {
    // NOTE(gperkins@20241105): table cell type mismatch with column type
    throw new Error(
      `Table cell & column type mismatch: ${config.columnKey} has cell type ${type}, column type ${config.columnType}`,
    );
  }

  const cellContentAlignment = config.columnAlignment ?? ColumnTypeToAlign[config.columnType];
  switch (type) {
    case ColumnType.BoldText:
      return (
        <Typography variant='tableHead' data-testid='boldtext-cell'>
          {cellValue.value}
        </Typography>
      );
    case ColumnType.Text: {
      return cellValue.value;
    }
    case ColumnType.Number: {
      const { value, comparisonChipSpec } = cellValue;
      if (Number.isNaN(value)) {
        return translate(translationKey('Label.NoData', TranslationNamespace.Analytics));
      }

      let formattedNode: ReactNode = value;

      const newFormattingSpec =
        cellValue.analyticsFormattingSpec ?? config.analyticsNumberFormattingSpec;
      // eslint-disable-next-line deprecation/deprecation -- migration in progress. Will be removed in DSA-4660.
      const legacyFormattingSpec = cellValue.formattingSpec ?? config.numericFormattingSpec;

      if (newFormattingSpec) {
        const formattedCellValue = formatNumberWithSpec(value, newFormattingSpec, {
          locale,
          translate,
        });
        formattedNode =
          newFormattingSpec.icon === NumberIcon.Robux ? (
            <InlinePriceWithRobuxIcon price={formattedCellValue} />
          ) : (
            formattedCellValue
          );
      } else if (legacyFormattingSpec) {
        // eslint-disable-next-line deprecation/deprecation -- migration in progress
        const formattedCellValue = formatNumber({
          value,
          unit: legacyFormattingSpec.unit,
          type: legacyFormattingSpec.type,
          context: legacyFormattingSpec.context,
          locale,
          translate,
        });
        formattedNode =
          legacyFormattingSpec.unit === ChartUnit.Robux ? (
            <InlinePriceWithRobuxIcon price={formattedCellValue} />
          ) : (
            formattedCellValue
          );
      }
      const comparisonChip = comparisonChipSpec ? <ComparisonChip {...comparisonChipSpec} /> : null;
      return comparisonChip ? (
        <Flex
          alignItems='center'
          gap={8}
          justifyContent={cellAlignmentToJustifyContent(cellContentAlignment)}>
          {comparisonChip}
          {formattedNode}
        </Flex>
      ) : (
        formattedNode
      );
    }
    case ColumnType.Timestamp: {
      const { value, format } = cellValue;
      const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
      // return em dash if date is invalid
      if (Number.isNaN(date.getTime())) {
        return '\u2014';
      }

      return format
        ? dateTimeFormatter(locale).getCustomDateTime(date, format)
        : formatMediumDateTime(date, locale);
    }
    case ColumnType.Date: {
      return formatMediumDate(cellValue.value, locale);
    }
    case ColumnType.RawJSONString: {
      const parsedJSON = JSON.parse(cellValue.value);
      const fullCode = JSON.stringify(parsedJSON, null, 2);
      const codeSnippet = JSON.stringify(parsedJSON);
      return (
        <HighlightingCodeBlock
          code={fullCode}
          codePreviewSnippet={codeSnippet}
          language={HighlightingCodeBlockLanguage.JSON}
          secondaryActionButton={
            <CopyRawJSONButton
              onClick={() => {
                navigator.clipboard.writeText(fullCode);
              }}
            />
          }
        />
      );
    }
    case ColumnType.TextWithTooltip: {
      return (
        <GenericCellContentWithTooltip
          content={cellValue.text}
          tooltip={cellValue?.tooltip}
          Icon={cellValue?.Icon}
          align={cellContentAlignment}
        />
      );
    }
    case ColumnType.TextWithDisplayValue: {
      return cellValue.displayValue;
    }
    case ColumnType.TextWithLink: {
      return (
        <Link
          target={cellValue.newTab ? '_blank' : ''}
          href={cellValue.href}
          onClick={cellValue.onClick}>
          {cellValue.text}
        </Link>
      );
    }
    case ColumnType.Other:
      return cellValue.value;
    case ColumnType.Selection: {
      const { rowKey, checked, disabled, indeterminate, onChange, tooltip } = cellValue;
      const checkboxComponent = (
        <Checkbox
          size='medium'
          disableRipple
          sx={{
            [`&.${checkboxClasses.root}`]: {
              width: '28px',
              height: '28px',
            },
          }}
          value={rowKey}
          checked={checked}
          indeterminate={indeterminate}
          disabled={disabled}
          color='secondary'
          onChange={
            onChange
              ? (e, givenChecked) => {
                  onChange(e.target.value, givenChecked);
                }
              : undefined
          }
        />
      );
      return tooltip ? (
        <Tooltip title={tooltip} placement='right' arrow>
          {/** Need to wrap Checkbox with a <span> element because
           * Tooltip component does not work on a disabled checkbox with pointer-event: none
           */}
          <span>{checkboxComponent}</span>
        </Tooltip>
      ) : (
        checkboxComponent
      );
    }
    case ColumnType.Actions: {
      return (
        <ActionColumnCell
          cellValue={cellValue}
          align={cellContentAlignment}
          isRowSelected={isRowSelected}
        />
      );
    }
    case ColumnType.Image: {
      const {
        src,
        onClick,
        width,
        height,
        displayTextForSummaryRow,
        dataId,
        description,
        text,
        link,
      } = cellValue;

      if (forCellInSummaryRow) {
        return displayTextForSummaryRow;
      }

      const imageButton = (
        <Button
          disableRipple
          onClick={onClick}
          disabled={!onClick}
          role='img'
          style={{
            backgroundImage: `url(${src})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: 'transparent',
            padding: 0,
            borderRadius: '4px',
            width: width ?? '100%',
            height: height ?? '100%',
            minWidth: 'unset',
            maxWidth: '100%',
            aspectRatio: width && height ? `${width}/${height}` : undefined,
          }}
          data-id={dataId}
        />
      );

      // If we have text, render image and text together
      if (text) {
        return (
          <Flex alignItems='center' gap={8}>
            {imageButton}
            {link ? <Link href={link}>{text}</Link> : <Typography>{text}</Typography>}
          </Flex>
        );
      }

      return description ? (
        <span>
          {imageButton}
          <Typography marginLeft='8px'>{description}</Typography>
        </span>
      ) : (
        imageButton
      );
    }
    case ColumnType.Status: {
      return <StatusChip status={cellValue} />;
    }
    case ColumnType.TextWithIcon: {
      let icon = null;
      const { tooltip, value } = cellValue;
      if (!tooltip) return value;
      const { severity, message } = tooltip;
      switch (severity) {
        case 'error':
          icon = <ErrorOutlineOutlinedIcon color='error' fontSize='small' />;
          break;
        case 'warning':
          icon = <WarningIcon color='warning' fontSize='small' />;
          break;
        default: {
          const exhaustiveCheck: never = severity;
          throw new Error(`Unhandled severity: ${exhaustiveCheck}`);
        }
      }

      return (
        <Flex alignItems='center' gap={8}>
          <Typography>{value}</Typography>
          <Tooltip title={message} placement='bottom' arrow>
            {icon}
          </Tooltip>
        </Flex>
      );
    }
    case ColumnType.Code: {
      if (cellValue.renderMode === 'editor') {
        return (
          <CodeEditor
            value={cellValue.value}
            language={cellValue.language}
            readOnly
            isInDiffContext={cellValue.isInDiffContext}
            height='auto'
          />
        );
      }
      return (
        <CodeColumnCell
          value={cellValue.value}
          language={cellValue.language}
          useMonoFont={cellValue.useMonoFont}
          tooltip={cellValue.tooltip}
        />
      );
    }
    case ColumnType.CodeDiff: {
      return (
        <DiffCodeEditor
          original={cellValue.original}
          modified={cellValue.modified}
          language={cellValue.language ?? CodeEditorSupportedLanguages.Json}
          readOnly
          height='auto'
        />
      );
    }
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unhandled column type: ${exhaustiveCheck}`);
    }
  }
};

export default formatCellContent;
