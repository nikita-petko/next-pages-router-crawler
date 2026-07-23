import React, { useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Button, Grid, RemoveCircleOutlineIcon, TableCell, TableRow, Typography } from '@rbx/ui';
import useMatchmakingContainerStyles from '../../container/MatchmakingContainer.styles';
import Order from '../../enums/Order';
import PlaceHeader from '../../enums/PlaceHeader';
import type { PlaceConfigurationInfo } from '../../types/ConfigurationInfo';
import type { HeaderCell } from '../../types/TableAttributes';
import comparator from '../../utils/TableUtils';
import { placeHeadersTranslationKeys } from '../../utils/translationGetter';
import MatchmakingTableContainer from './MatchmakingTableContainer';

export type MatchmakingPlacesTableProps = {
  placeConfigs?: PlaceConfigurationInfo[];
  onDeleteConfigFromPlace: (placeId: number) => void;
};

const MatchmakingPlacesTable = function MatchmakingPlacesTableContainer({
  placeConfigs,
  onDeleteConfigFromPlace,
}: MatchmakingPlacesTableProps): React.JSX.Element {
  const { translate } = useTranslation();
  const [order, setOrder] = useState<Order>(Order.Asc);
  const [orderBy, setOrderBy] = useState<string>(PlaceHeader.Name);
  const {
    classes: { image, imageName },
  } = useMatchmakingContainerStyles();

  const getPlaceIcons = (name: string, thumbnailUrl: string) => {
    return (
      <Grid container direction='row' justifyContent='flex-start'>
        <img className={image} src={thumbnailUrl} alt={name} />
        <Grid className={imageName}>{name}</Grid>
      </Grid>
    );
  };

  const placesHeaders: HeaderCell[] = Object.values(PlaceHeader).map((type) => {
    return {
      id: type,
      label: translate(placeHeadersTranslationKeys[type]),
    };
  });
  const handleSortRequest = (property: string) => {
    const isAsc = orderBy === property && order === Order.Asc;
    setOrder(isAsc ? Order.Desc : Order.Asc);
    setOrderBy(property);
  };

  const sortedConfigurations = useMemo(() => {
    const sortNameFunction = (a: PlaceConfigurationInfo, b: PlaceConfigurationInfo) => {
      return comparator(a?.placeName, b?.placeName);
    };
    if (order === Order.Desc) {
      return placeConfigs?.sort(sortNameFunction);
    }
    return placeConfigs?.sort(sortNameFunction)?.toReversed();
  }, [order, placeConfigs]);

  const getTableRows = () => {
    return !sortedConfigurations || sortedConfigurations.length === 0
      ? [
          <TableRow key='0'>
            <TableCell colSpan={5} align='center'>
              <Grid>{translate('Label.NoAppliedConfig')}</Grid>
            </TableCell>
          </TableRow>,
        ]
      : sortedConfigurations?.map((config) => {
          const tableRow = Object.values(PlaceHeader).map((type) => {
            switch (type) {
              case PlaceHeader.Name:
                return (
                  <TableCell>
                    <Typography variant='body2'>
                      {getPlaceIcons(config?.placeName ?? '', config?.thumbnailUrl ?? '')}
                    </Typography>
                  </TableCell>
                );
              case PlaceHeader.AppliedConfiguration:
                return (
                  <TableCell>
                    <Typography variant='body2'>{config?.configurationName ?? ''}</Typography>
                  </TableCell>
                );
              case PlaceHeader.LastModified:
                return <TableCell>{config?.modifiedTime?.toLocaleString() ?? ''}</TableCell>;
              case PlaceHeader.Delete:
                return (
                  <TableCell align='right'>
                    <Button
                      onClick={() => onDeleteConfigFromPlace(config?.placeId ?? 0)}
                      variant='text'
                      color='primary'
                      startIcon={<RemoveCircleOutlineIcon />}
                    />
                  </TableCell>
                );
              default:
                return <TableCell />;
            }
          });
          return <TableRow key={config.placeId}>{tableRow}</TableRow>;
        });
  };

  return (
    <MatchmakingTableContainer
      tableTitle={translate('Label.AppliedPlaces')}
      rows={getTableRows() ?? []}
      order={order}
      orderBy={orderBy}
      headers={placesHeaders}
      handleSortRequest={handleSortRequest}
    />
  );
};

export default MatchmakingPlacesTable;
