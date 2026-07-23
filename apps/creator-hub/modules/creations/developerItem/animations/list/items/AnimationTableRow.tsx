import { useRouter } from 'next/router';
import type { FunctionComponent, MouseEventHandler } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { TableCell, TableRow } from '@rbx/ui';
import { creatorHub } from '@modules/miscellaneous/urls';
import CopyBaseMenuItem from '../../../common/list/menuItems/CopyBaseMenuItem/CopyBaseMenuItem';
import OpenAssetDetails from '../../../common/list/menuItems/OpenAssetDetails/OpenAssetDetails';
import OperationMenu from '../../../common/list/operationMenu/OperationMenu';
import useTableListStyles from '../../../common/list/useTableListStyles';
import type { TAnimationTableItem } from '../../types';
import useAnimationTableRowStyles from './AnimationTableRow.styles';

const { dashboard } = creatorHub;
export type TAnimationTableRowProps = {
  item: TAnimationTableItem;
};

const AnimationTableRow: FunctionComponent<React.PropsWithChildren<TAnimationTableRowProps>> = (
  props,
) => {
  const { item } = props;
  const { translate } = useTranslation();
  const { push } = useRouter();
  const { locale } = useLocalization();
  const dateFormatter = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale ?? Locale.English, {
      dateStyle: 'medium',
    });
    return formatter.format;
  }, [locale]);
  const handleRowClick = useCallback<MouseEventHandler<HTMLElement>>(
    async (e) => {
      if (e.target instanceof Element) {
        const tagNameLowerCase = e.target.tagName.toLowerCase();
        if (tagNameLowerCase === 'tr' || tagNameLowerCase === 'td') {
          await push(dashboard.getConfigureCreatorStoreItemUrl(item.assetId));
        }
      }
    },
    [item.assetId, push],
  );
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const {
    classes: { tableRow, iconColumn, operationIcon, xsInvisibleColumn, smInvisibleColumn },

    cx,
  } = useTableListStyles();
  const {
    classes: { dateColumn },
  } = useAnimationTableRowStyles();
  return (
    <TableRow onClick={handleRowClick} hover key={item.assetId} className={tableRow} role='button'>
      <TableCell>{item.name}</TableCell>
      <TableCell className={cx(dateColumn, xsInvisibleColumn)}>
        {item.created && dateFormatter(item.created)}
      </TableCell>
      <TableCell className={cx(dateColumn, smInvisibleColumn)}>
        {item.updated && dateFormatter(item.updated)}
      </TableCell>
      <TableCell className={iconColumn}>
        <OperationMenu
          iconClass={operationIcon}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          menuItems={[
            [
              <OpenAssetDetails
                key='open_asset_detail'
                assetId={item.assetId}
                onCloseMenu={() => setMenuOpen(false)}
              />,
              <CopyBaseMenuItem
                key='copy_asset_id'
                actionName={translate('Action.CopyAssetID')}
                textToCopy={item.assetId.toString()}
                onCloseMenu={() => setMenuOpen(false)}
                itemName={translate('Label.AssetID')}
                actionKey='CopyAssetID'
              />,
            ],
          ]}
        />
      </TableCell>
    </TableRow>
  );
};

export default AnimationTableRow;
