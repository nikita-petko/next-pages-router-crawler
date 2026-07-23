import { useTranslation } from '@rbx/intl';
import { EditOutlinedIcon, Grid, IconButton, TableCell, TableRow, Typography } from '@rbx/ui';
import React, { useCallback, useMemo, useState } from 'react';
import Order from '../../enums/Order';
import { HeaderCell } from '../../types/TableAttributes';
import {
  dataTypeTranslationKeys,
  getBooleanValueTypeTranslation,
  serverAttributeHeadersTranslationKeys,
} from '../../utils/translationGetter';
import MatchmakingTableContainer from './MatchmakingTableContainer';
import comparator from '../../utils/TableUtils';
import PlayerAttributeHeader from '../../enums/PlayerAttributeHeader';
import { PlayerAttributesBriefInfo } from '../../types/AttributesInfo';
import AttributeDataType from '../../enums/AttributeDataType';

export type MatchmakingPlayerAttributeTableProps = {
  playerAttributes: PlayerAttributesBriefInfo[] | undefined;
  onEdit: (id: string) => void;
};

const MatchmakingPlayerAttributeTable = function MatchmakingPlayerAttributeTableContainer({
  playerAttributes,
  onEdit,
}: MatchmakingPlayerAttributeTableProps): React.JSX.Element {
  const { translate } = useTranslation();
  const [order, setOrder] = useState<Order>(Order.Asc);
  const [orderBy, setOrderBy] = useState<string>(PlayerAttributeHeader.Name);

  const handleEditClick = useCallback(
    (configId: string) => {
      onEdit(configId);
    },
    [onEdit],
  );

  const headers: HeaderCell[] = Object.values(PlayerAttributeHeader).map((type) => {
    return {
      id: type,
      label: translate(serverAttributeHeadersTranslationKeys[type]),
    };
  });
  const handleSortRequest = (property: string) => {
    const isAsc = orderBy === property && order === Order.Asc;
    setOrder(isAsc ? Order.Desc : Order.Asc);
    setOrderBy(property);
  };

  const sortedAttributes = useMemo(() => {
    const sortFunction = (a: PlayerAttributesBriefInfo, b: PlayerAttributesBriefInfo) => {
      const orderByEnum = orderBy as keyof typeof PlayerAttributeHeader;
      switch (orderByEnum) {
        case PlayerAttributeHeader.Name:
          return comparator(a?.name, b?.name);
        case PlayerAttributeHeader.DataType:
          return comparator(a?.dataType, b?.dataType);
        case PlayerAttributeHeader.DefaultValue:
          return comparator(a?.constantValue, b?.constantValue);
        case PlayerAttributeHeader.Edit:
        default:
          return 0;
      }
    };
    if (order === Order.Desc) {
      return playerAttributes?.sort(sortFunction);
    }
    return playerAttributes?.sort(sortFunction)?.reverse();
  }, [order, orderBy, playerAttributes]);

  const getTableRows =
    sortedAttributes?.length === 0
      ? [
          <TableRow key='0'>
            <TableCell colSpan={5} align='center'>
              <Grid>{translate('Description.NoAttribute')}</Grid>
            </TableCell>
          </TableRow>,
        ]
      : sortedAttributes?.map((attr) => {
          const tableRow = Object.values(PlayerAttributeHeader).map((type) => {
            switch (type) {
              case PlayerAttributeHeader.Name:
                return (
                  <TableCell>
                    <Typography variant='body2'>{attr?.name ?? ''}</Typography>
                  </TableCell>
                );
              case PlayerAttributeHeader.DataType:
                return (
                  <TableCell>
                    <Typography variant='body2'>
                      {attr?.dataType !== undefined
                        ? translate(dataTypeTranslationKeys[attr?.dataType])
                        : ''}
                    </Typography>
                  </TableCell>
                );
              case PlayerAttributeHeader.DefaultValue:
                return (
                  <TableCell>
                    <Typography variant='body2'>
                      {attr?.dataType === AttributeDataType.Boolean
                        ? translate(getBooleanValueTypeTranslation(attr?.constantValue))
                        : (attr?.constantValue ?? '')}
                    </Typography>
                  </TableCell>
                );
              case PlayerAttributeHeader.Edit:
                return (
                  <TableCell align='right'>
                    <IconButton
                      onClick={() => handleEditClick(attr?.id ?? '')}
                      aria-label='edit'
                      disableRipple
                      size='small'
                      color='secondary'>
                      <EditOutlinedIcon />
                    </IconButton>
                  </TableCell>
                );
              default:
                return <TableCell />;
            }
          });
          return <TableRow key={attr.id}>{tableRow}</TableRow>;
        });

  return (
    <MatchmakingTableContainer
      tableTitle={translate('Label.PlayerAttribute')}
      rows={getTableRows ?? []}
      order={order}
      orderBy={orderBy}
      headers={headers}
      handleSortRequest={handleSortRequest}
    />
  );
};

export default MatchmakingPlayerAttributeTable;
