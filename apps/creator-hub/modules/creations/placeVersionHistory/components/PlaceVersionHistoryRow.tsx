import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo } from 'react';
import type { RobloxApiDevelopAssetVersion } from '@rbx/client-develop/v1';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { TableRow, TableCell, Button, RestoreIcon, CheckIcon } from '@rbx/ui';
import usePlaceVersionHistoryStyles from './PlaceVersionHistory.styles';

export interface VersionHistoryRowProps {
  version: RobloxApiDevelopAssetVersion;
  showRestore: boolean;
  openDialog: (assetVersionNumber: number | null) => void;
}

const VersionHistoryRow: FunctionComponent<React.PropsWithChildren<VersionHistoryRowProps>> = ({
  version,
  showRestore,
  openDialog,
}) => {
  const {
    classes: { icon },
  } = usePlaceVersionHistoryStyles();
  const { locale } = useLocalization();
  const { translate } = useTranslation();

  const dateFormatter = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale ?? Locale.English, {
      dateStyle: 'long',
      timeStyle: 'short',
    });
    return formatter.format;
  }, [locale]);

  const onClick = useCallback(() => {
    if (version.assetVersionNumber) {
      openDialog(version.assetVersionNumber);
    }
  }, [openDialog, version.assetVersionNumber]);

  return (
    <TableRow data-testid={`version-history-${version.assetVersionNumber}`}>
      <TableCell>{version.assetVersionNumber}</TableCell>
      <TableCell>{dateFormatter(version.created)}</TableCell>
      <TableCell align='center'>{version.isPublished && <CheckIcon fontSize='small' />}</TableCell>
      <TableCell align='right'>
        {showRestore && (
          <Button size='small' color='primary' onClick={onClick}>
            <RestoreIcon className={icon} /> {translate('Label.Restore')}
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};

export default VersionHistoryRow;
