import { useRouter } from 'next/router';
import type { FunctionComponent, MouseEventHandler } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { TableCell, TableRow, CheckIcon } from '@rbx/ui';
import { Asset } from '@modules/miscellaneous/common';
import { Link } from '@modules/miscellaneous/components';
import { creatorHub } from '@modules/miscellaneous/urls';
import ArchiveOperations from '../../../common/list/menuItems/ArchiveOperation/ArchiveOperations';
import CopyBaseMenuItem from '../../../common/list/menuItems/CopyBaseMenuItem/CopyBaseMenuItem';
import OpenAssetDetails from '../../../common/list/menuItems/OpenAssetDetails/OpenAssetDetails';
import OperationMenu from '../../../common/list/operationMenu/OperationMenu';
import useTableListStyles from '../../../common/list/useTableListStyles';
import type { TMediaTableItem } from '../../types';
import useMediaTableRowStyles from './MediaTableRow.styles';

const { dashboard } = creatorHub;
export type TAnimationTableRowProps = {
  item: TMediaTableItem;
  onRemove: () => void;
};

const maxNameLength = 43;
const maxDescriptionLength = 73;
function truncateStringByLength(maxLength: number, targetString: string) {
  if (targetString.length > maxLength) {
    return `${targetString.slice(0, maxLength)}...`;
  }
  return targetString;
}

const MediaTableRow: FunctionComponent<React.PropsWithChildren<TAnimationTableRowProps>> = (
  props,
) => {
  const { item, onRemove } = props;
  const { push } = useRouter();
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const dateFormatter = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale ?? Locale.English, {
      dateStyle: 'medium',
    });
    return formatter.format;
  }, [locale]);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const {
    classes: {
      iconColumn,
      mdInvisibleColumn,
      operationIcon,
      smInvisibleColumn,
      tableRow,
      xsInvisibleColumn,
    },

    cx,
  } = useTableListStyles();
  const {
    classes: { fixWidthColumn, tableLink },
  } = useMediaTableRowStyles();
  const durationString = useMemo(() => {
    const minutes = Math.floor(item.durationSeconds / 60);
    const seconds = item.durationSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [item.durationSeconds]);
  const createUrl = dashboard.getConfigureCreatorStoreItemUrl(item.assetId);
  const handleRowClick = useCallback<MouseEventHandler<HTMLElement>>(
    async (e) => {
      if (e.target instanceof Element) {
        const tagNameLowerCase = e.target.tagName.toLowerCase();
        if (['tr', 'td', 'th'].includes(tagNameLowerCase)) {
          await push(dashboard.getConfigureCreatorStoreItemUrl(item.assetId));
        }
      }
    },
    [item.assetId, push],
  );
  const menuNodes = useMemo(() => {
    const nodes = [
      [
        <OpenAssetDetails
          key='open-asset-detail'
          assetId={item.assetId}
          onCloseMenu={() => setMenuOpen(false)}
        />,
        <CopyBaseMenuItem
          actionKey='CopyAssetID'
          actionName={translate('Action.CopyAssetID')}
          itemName={translate('Label.AssetID')}
          key='copy-asset-id'
          onCloseMenu={() => setMenuOpen(false)}
          textToCopy={item.assetId.toString()}
        />,
      ],
    ];
    if (item.isArchivable) {
      nodes.push([
        <ArchiveOperations
          assetId={item.assetId}
          isArchived={item.isArchived}
          key='archive'
          onRemove={onRemove}
        />,
      ]);
    }
    return nodes;
  }, [item.assetId, item.isArchivable, item.isArchived, onRemove, translate]);

  // NOTE(nkachkovsky 08/22/2023): Remove conditional rendering for the duration field on video once video length is supported
  return (
    <TableRow onClick={handleRowClick} hover key={item.assetId} className={tableRow} role='button'>
      <Link href={createUrl} underline='none' className={tableLink}>
        <TableCell component='th' scope='row'>
          {truncateStringByLength(maxNameLength, item.name)}
        </TableCell>
        <TableCell className={mdInvisibleColumn}>
          {truncateStringByLength(maxDescriptionLength, item.description)}
        </TableCell>
        {item.assetType !== Asset.Video && (
          <TableCell className={cx(fixWidthColumn, mdInvisibleColumn)}>{durationString}</TableCell>
        )}
        <TableCell className={cx(fixWidthColumn, xsInvisibleColumn)}>
          {item.created && dateFormatter(item.created)}
        </TableCell>
        <TableCell className={cx(fixWidthColumn, smInvisibleColumn)}>
          {item.isOnMarketplace && <CheckIcon />}
        </TableCell>
      </Link>
      <TableCell className={iconColumn}>
        <OperationMenu
          iconClass={operationIcon}
          menuItems={menuNodes}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
        />
      </TableCell>
    </TableRow>
  );
};

export default MediaTableRow;
