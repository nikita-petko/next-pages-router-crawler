import React, { FC, useMemo } from 'react';
import {
  getOrderedThumbnailTableColumnKeys,
  PersonalizedThumbnailsTableColumnConfigs,
  TPersonalizedThumbnailsTableColumnKey,
} from '@modules/experience-analytics-shared';
import {
  GenericTableExporter,
  CellDataType,
  resolveTableColumnTitle,
  TableExportButton,
  useDownloadAction,
} from '@modules/charts-generic';
import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, DownloadIcon, makeStyles } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  ThumbnailPersonalizationTableTitleKey,
  useThumbnailPersonalizationFormattedDateRange,
} from '../hooks/useThumbnailPersonalizationFormattedDateRange';

const useThumbnailPersonalizationTableExportButtonProps = (
  tableRowData: Map<TPersonalizedThumbnailsTableColumnKey, CellDataType>[],
  startTimeUTC: Date,
  endTimeUTC: Date,
) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const formattedDateRange = useThumbnailPersonalizationFormattedDateRange(
    startTimeUTC,
    endTimeUTC,
  );

  const orderedThumbnailTableColumnKeys = useMemo(
    () =>
      getOrderedThumbnailTableColumnKeys({
        inCompactView: false,
        inEditingMode: false,
        allowAssetIdColumn: false,
      }),
    [],
  );

  return useMemo(() => {
    const columnNames = new Map(
      orderedThumbnailTableColumnKeys.map((columnKey) => [
        columnKey,
        resolveTableColumnTitle(
          translate,
          PersonalizedThumbnailsTableColumnConfigs[columnKey].titleKey,
        ),
      ]),
    );
    return {
      telemetryContext: {
        kpiType: orderedThumbnailTableColumnKeys.join(','),
      },
      columns: orderedThumbnailTableColumnKeys,
      columnNames,
      rowData: tableRowData,
      columnConfigs: orderedThumbnailTableColumnKeys.map(
        (columnKey) => PersonalizedThumbnailsTableColumnConfigs[columnKey],
      ),
      fileName: translate(ThumbnailPersonalizationTableTitleKey, { dateRange: formattedDateRange }),
    };
  }, [formattedDateRange, orderedThumbnailTableColumnKeys, tableRowData, translate]);
};

type TPersonalizedThumbnailExportButtonProps = {
  tableRowData: Map<TPersonalizedThumbnailsTableColumnKey, CellDataType>[];
  startTimeUTC: Date;
  endTimeUTC: Date;
  displayType?: PersonalizedThumbnailExportButtonType;
};

export enum PersonalizedThumbnailExportButtonType {
  ExportIcon = 'ExportIcon',
  ExportButton = 'ExportButton',
}

const useStyles = makeStyles()(() => {
  return {
    downloadIcon: {
      marginRight: '8px',
    },
  };
});

const PersonalizedThumbnailExportButton: FC<TPersonalizedThumbnailExportButtonProps> = ({
  tableRowData,
  startTimeUTC,
  endTimeUTC,
  displayType = PersonalizedThumbnailExportButtonType.ExportIcon,
}: TPersonalizedThumbnailExportButtonProps) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const {
    classes: { downloadIcon },
  } = useStyles();
  const exportButtonProps = useThumbnailPersonalizationTableExportButtonProps(
    tableRowData,
    startTimeUTC,
    endTimeUTC,
  );
  const { telemetryContext, columns, columnConfigs, columnNames, rowData, fileName } =
    exportButtonProps;
  const tableExporter = useMemo(() => {
    return new GenericTableExporter(columns, columnConfigs, columnNames, rowData, fileName);
  }, [columnConfigs, columnNames, columns, fileName, rowData]);
  const downloadAction = useDownloadAction({
    kpiType: telemetryContext.kpiType,
    exporter: tableExporter,
  });

  if (tableExporter.hasEmptyData || !downloadAction) {
    return null;
  }

  if (displayType === PersonalizedThumbnailExportButtonType.ExportButton) {
    return (
      <Button variant='outlined' color='secondary' size='large' onClick={downloadAction.onClick}>
        <DownloadIcon classes={{ root: downloadIcon }} />
        {translate(translationKey('Action.DownloadData', TranslationNamespace.PlaceThumbnails))}
      </Button>
    );
  }
  return <TableExportButton {...exportButtonProps} />;
};

export default withTranslation(PersonalizedThumbnailExportButton, [
  TranslationNamespace.PlaceThumbnails,
  TranslationNamespace.Analytics,
]);
