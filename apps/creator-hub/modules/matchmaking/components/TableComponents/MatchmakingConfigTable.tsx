import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Chip, EditOutlinedIcon, Grid, IconButton, TableCell, TableRow, Typography } from '@rbx/ui';
import ConfigurationHeader from '../../enums/ConfigurationHeader';
import Order from '../../enums/Order';
import type { ConfigurationBriefInfo } from '../../types/ConfigurationInfo';
import type { HeaderCell } from '../../types/TableAttributes';
import comparator from '../../utils/TableUtils';
import { configurationHeadersTranslationKeys } from '../../utils/translationGetter';
import PlacesChip from '../PlacesChip';
import ConfigTableOptions from './ConfigTableOptions';
import MatchmakingTableContainer from './MatchmakingTableContainer';

export type MatchmakingConfigTableProps = {
  universeConfigurations?: ConfigurationBriefInfo[];
  onEdit: (configId: string) => void;
  onApplyToPlaces: (configId: string, placeIds: number[]) => void;
  onDeleteConfigFromPlace: (placeId: number) => void;
  onDeleteConfig: (configId: string) => void;
};

const MatchmakingConfigTable = function MatchmakingConfigTableContainer({
  universeConfigurations,
  onEdit,
  onApplyToPlaces,
  onDeleteConfigFromPlace,
  onDeleteConfig,
}: MatchmakingConfigTableProps): React.JSX.Element {
  const { translate } = useTranslation();
  const [order, setOrder] = useState<Order>(Order.Asc);
  const [orderBy, setOrderBy] = useState<string>(ConfigurationHeader.Name);

  const handleEditClick = useCallback(
    (configId: string) => {
      onEdit(configId);
    },
    [onEdit],
  );

  const getPlaceChips = (configId: string) => {
    const currConfig = universeConfigurations?.find((config) => config.id === configId);
    if (currConfig?.appliedPlaces) {
      const placesList = Array.from(currConfig?.appliedPlaces.values());
      const visiblePlaces = placesList.slice(0, 2);
      const overFlowPlacesCount = placesList.length - 2;
      return placesList?.length > 0 ? (
        <Grid sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {visiblePlaces.map((place) => (
            <PlacesChip key={place.placeId} place={place} onDelete={onDeleteConfigFromPlace} />
          ))}
          {overFlowPlacesCount > 0 && (
            <Chip
              color='secondary'
              label={
                <Typography variant='chip'>
                  {translate('Label.ChipOverflow', {
                    overFlowPlacesCount: overFlowPlacesCount.toLocaleString(),
                  })}
                </Typography>
              }
            />
          )}
        </Grid>
      ) : (
        <Typography variant='body2'>{translate('Label.NoAppliedPlaces')}</Typography>
      );
    }
    return <Typography variant='body2'>{translate('Label.NoAppliedPlaces')}</Typography>;
  };

  const configHeaders: HeaderCell[] = Object.values(ConfigurationHeader).map((type) => {
    return {
      id: type,
      label: translate(configurationHeadersTranslationKeys[type]),
    };
  });
  const handleSortRequest = (property: string) => {
    const isAsc = orderBy === property && order === Order.Asc;
    setOrder(isAsc ? Order.Desc : Order.Asc);
    setOrderBy(property);
  };

  const sortedConfigurations = useMemo(() => {
    const sortNameFunction = (a: ConfigurationBriefInfo, b: ConfigurationBriefInfo) => {
      return comparator(a?.name, b?.name);
    };
    if (order === Order.Desc) {
      return universeConfigurations?.sort(sortNameFunction);
    }
    return universeConfigurations?.sort(sortNameFunction)?.toReversed();
  }, [order, universeConfigurations]);

  const getTableRows = () => {
    return sortedConfigurations?.map((config) => {
      const tableRow = Object.values(ConfigurationHeader).map((type) => {
        switch (type) {
          case ConfigurationHeader.Name:
            return (
              <TableCell>
                <Typography variant='body2'>{config?.name ?? ''}</Typography>
              </TableCell>
            );
          case ConfigurationHeader.AppliedPlaces:
            return <TableCell>{getPlaceChips(config?.id ?? '')}</TableCell>;
          case ConfigurationHeader.LastModified:
            return <TableCell>{config?.modifiedTime?.toLocaleString() ?? ''}</TableCell>;
          case ConfigurationHeader.Edit:
            return (
              <TableCell align='right'>
                <IconButton
                  onClick={() => handleEditClick(config?.id ?? '')}
                  aria-label='edit'
                  disableRipple
                  size='small'
                  color='secondary'>
                  <EditOutlinedIcon />
                </IconButton>
              </TableCell>
            );
          case ConfigurationHeader.Actions:
            return (
              <TableCell>
                <ConfigTableOptions
                  configId={config?.id ?? ''}
                  onApplyToPlaces={onApplyToPlaces}
                  onDeleteConfig={onDeleteConfig}
                />
              </TableCell>
            );
          default:
            return <TableCell />;
        }
      });
      return <TableRow key={config.id}>{tableRow}</TableRow>;
    });
  };

  return (
    <MatchmakingTableContainer
      tableTitle={translate('Label.Configurations')}
      rows={getTableRows() ?? []}
      order={order}
      orderBy={orderBy}
      headers={configHeaders}
      handleSortRequest={handleSortRequest}
    />
  );
};

export default MatchmakingConfigTable;
