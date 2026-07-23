import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import type { CSVData } from '@rbx/core';
import { downloadBlob } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import { Grid, Button, GetAppIcon, Tooltip } from '@rbx/ui';
import UseAssetPermissionsStyles from './AssetPermissionsContainer.styles';
import { ASSET_HEADER, ASSET_TYPE_HEADER, ID_HEADER, OWNER_HEADER } from './common';
import type { TAssetDetails } from './types';

type ExportButtonProps = {
  universeId: number;
  existingAssetIdsList: Map<number, TAssetDetails>;
  onShowToast: (messages: { isSuccess: boolean; title: string; description?: string }[]) => void;
};

const ExportButton: FunctionComponent<React.PropsWithChildren<ExportButtonProps>> = ({
  universeId,
  existingAssetIdsList,
  onShowToast,
}) => {
  const {
    classes: { button },
  } = UseAssetPermissionsStyles();
  const { translate } = useTranslation();
  const chartExportEnabledTooltip = translate('Description.ChartExportEnabled');
  const chartExportErrorMessage = translate('Description.ChartExportError');

  const getCSVData: () => { csvData: CSVData; filename: string } = useCallback(() => {
    const headers = `${translate(ASSET_HEADER)},${translate(ID_HEADER)},${translate(
      OWNER_HEADER,
    )},${translate(ASSET_TYPE_HEADER)}`;
    const rows = [headers];
    existingAssetIdsList.forEach((value) => {
      const row = `${value.name ?? 'Private'},${value.assetId},${value.creatorName ?? 'Private'},${
        value.assetType ?? 'Private'
      }`;
      rows.push(row);
    });
    const csvData = rows.join('\n') as CSVData;
    const filename = `${universeId}_asset_permissions.csv`;
    return { csvData, filename };
  }, [translate, existingAssetIdsList, universeId]);

  const handleExport = useCallback(async () => {
    try {
      const { csvData, filename } = getCSVData();
      const bytes = new TextEncoder().encode(csvData);
      const exportBlob = new Blob([bytes], {
        type: 'text/csv;charset=utf-8',
      });
      downloadBlob(exportBlob, filename);
    } catch {
      onShowToast([{ isSuccess: false, title: chartExportErrorMessage }]);
    }
  }, [getCSVData, onShowToast, chartExportErrorMessage]);

  return (
    <Grid item XSmall={12}>
      {existingAssetIdsList.size > 0 && (
        <Tooltip
          arrow
          title={chartExportEnabledTooltip}
          placement='right'
          data-testid='tooltip'
          enterDelay={0}>
          <Button
            aria-label={chartExportEnabledTooltip}
            color='inherit'
            size='small'
            className={button}>
            <GetAppIcon aria-label='GetApp' onClick={handleExport} fontSize='small' />
          </Button>
        </Tooltip>
      )}
    </Grid>
  );
};

export default ExportButton;
