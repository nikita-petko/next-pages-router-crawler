import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { EditOutlinedIcon, Grid, IconButton, TableCell, TableRow, Typography } from '@rbx/ui';
import AttributeDataType from '../../enums/AttributeDataType';
import Order from '../../enums/Order';
import ServerAttributeHeader from '../../enums/ServerAttributeHeader';
import type { ServerAttributesInfo } from '../../types/AttributesInfo';
import type { HeaderCell } from '../../types/TableAttributes';
import comparator from '../../utils/TableUtils';
import {
  dataTypeTranslationKeys,
  getBooleanValueTypeTranslation,
  serverAttributeHeadersTranslationKeys,
} from '../../utils/translationGetter';
import MatchmakingTableContainer from './MatchmakingTableContainer';

export type MatchmakingServerAttributeTableProps = {
  serverAttributes: ServerAttributesInfo[] | undefined;
  onEdit: (id: string) => void;
};

const MatchmakingServerAttributeTable = function MatchmakingServerAttributeTableContainer({
  serverAttributes,
  onEdit,
}: MatchmakingServerAttributeTableProps): React.JSX.Element {
  const { translate } = useTranslation();
  const [order, setOrder] = useState<Order>(Order.Asc);
  const [orderBy, setOrderBy] = useState<string>(ServerAttributeHeader.Name);

  const handleEditClick = useCallback(
    (configId: string) => {
      onEdit(configId);
    },
    [onEdit],
  );

  const headers: HeaderCell[] = Object.values(ServerAttributeHeader).map((type) => {
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
    const sortFunction = (a: ServerAttributesInfo, b: ServerAttributesInfo) => {
      const orderByEnum = orderBy as keyof typeof ServerAttributeHeader;
      switch (orderByEnum) {
        case ServerAttributeHeader.Name:
          return comparator(a?.name, b?.name);
        case ServerAttributeHeader.DataType:
          return comparator(a?.dataType, b?.dataType);
        case ServerAttributeHeader.DefaultValueType:
          return comparator(a?.defaultValueType, b?.defaultValueType);
        case ServerAttributeHeader.DefaultValue:
          return comparator(a?.constantValue, b?.constantValue);
        case ServerAttributeHeader.Edit:
        default:
          return 0;
      }
    };
    if (order === Order.Desc) {
      return serverAttributes?.sort(sortFunction);
    }
    return serverAttributes?.sort(sortFunction)?.toReversed();
  }, [order, orderBy, serverAttributes]);

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
          const tableRow = Object.values(ServerAttributeHeader).map((type) => {
            switch (type) {
              case ServerAttributeHeader.Name:
                return (
                  <TableCell>
                    <Typography variant='body2'>{attr?.name ?? ''}</Typography>
                  </TableCell>
                );
              case ServerAttributeHeader.DataType:
                return (
                  <TableCell>
                    <Typography variant='body2'>
                      {attr?.dataType !== undefined
                        ? translate(dataTypeTranslationKeys[attr?.dataType])
                        : ''}
                    </Typography>
                  </TableCell>
                );
              case ServerAttributeHeader.DefaultValueType:
                return (
                  <TableCell>
                    <Typography variant='body2'>{attr?.defaultValueType}</Typography>
                  </TableCell>
                );
              case ServerAttributeHeader.DefaultValue:
                return (
                  <TableCell>
                    <Typography variant='body2'>
                      {attr?.dataType === AttributeDataType.Boolean
                        ? translate(getBooleanValueTypeTranslation(attr?.constantValue))
                        : (attr?.constantValue ?? '')}
                    </Typography>
                  </TableCell>
                );
              case ServerAttributeHeader.Edit:
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
      tableTitle={translate('Label.ServerAttribute')}
      rows={getTableRows ?? []}
      order={order}
      orderBy={orderBy}
      headers={headers}
      handleSortRequest={handleSortRequest}
    />
  );
};

export default MatchmakingServerAttributeTable;
