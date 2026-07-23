import { Icon, TableCell, type TTableCellAlign } from '@rbx/foundation-ui';
import { Grid, Tooltip } from '@rbx/ui';
import { forwardRef } from 'react';

import EntityIdTooltip from '@components/reporting/EntityIdTooltip';
import useTableNameCellStyles from '@components/reporting/TableNameCell.styles';
import { defaultAlign } from '@constants/genericManagementTableStyles';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

interface TableNameCellProps {
  align: TTableCellAlign;
  className: string;
  copyToClipboardContent: string;
  isAutoReload?: boolean;
  isOffPlatformRequest?: boolean;
  isReportingEnabled?: boolean;
  minWidthPx?: number;
  name: string;
  onNameClicked: () => void;
}

/**
 * Wraps `<TableCell>` (the `<td>`) with the name-column-specific content.
 */
const TableNameCell = forwardRef<HTMLTableCellElement, TableNameCellProps>(
  (
    {
      align = defaultAlign,
      className,
      copyToClipboardContent,
      isAutoReload = false,
      isOffPlatformRequest = false,
      isReportingEnabled = false,
      minWidthPx,
      name,
      onNameClicked,
    },
    ref,
  ) => {
    const { translate } = useNamespacedTranslation(TranslationNamespace.Report);
    const { classes, cx } = useTableNameCellStyles({ minWidthPx });
    const {
      autoReloadIcon,
      autoReloadIconTooltip,
      nameCellMinWidth,
      nameTextGridItem,
      textEllipsisTypography,
      textEllipsisTypographyMeasured,
    } = classes;
    const typographyClass =
      minWidthPx != null && minWidthPx > 0
        ? textEllipsisTypographyMeasured
        : textEllipsisTypography;

    const textToRender = (
      <Grid alignItems='center' container wrap='nowrap'>
        {isAutoReload && (
          <Tooltip
            arrow
            componentsProps={{
              tooltip: {
                className: autoReloadIconTooltip,
              },
            }}
            placement='top'
            title={translate('Description.AutoReloadEnabledForCampaign')}>
            <Grid className={autoReloadIcon} item>
              <Icon name='icon-regular-two-arrows-spin-clockwise' size='Medium' />
            </Grid>
          </Tooltip>
        )}
        {isOffPlatformRequest && !isReportingEnabled && (
          <Tooltip
            arrow
            componentsProps={{
              tooltip: {
                className: autoReloadIconTooltip,
              },
            }}
            placement='top'
            title={translate('Description.ReportingDisabledOffPlatform')}>
            <Grid className={autoReloadIcon} item>
              <Icon name='icon-regular-eye-slash' size='Medium' />
            </Grid>
          </Tooltip>
        )}
        <Grid className={nameTextGridItem} item>
          <EntityIdTooltip copyToClipboardContent={copyToClipboardContent}>
            <span
              className={`text-body-medium ${typographyClass}`}
              onClick={() => onNameClicked()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onNameClicked();
                }
              }}
              role='button'
              tabIndex={0}>
              {name}
            </span>
          </EntityIdTooltip>
        </Grid>
      </Grid>
    );

    return (
      <TableCell align={align} className={cx(className, nameCellMinWidth)} ref={ref}>
        {textToRender}
      </TableCell>
    );
  },
);

export default TableNameCell;
