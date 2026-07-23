import React, { FunctionComponent, useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import {
  GameServerFilters,
  ServerType,
  ServerStatus,
  NumberRange,
} from '../../../types/GameServerControls';
import FilterChip from './FilterChip';
import useFilterChipRowStyles from './FilterChipRow.styles';

export interface FilterChipRowProps {
  filter: GameServerFilters;
  setFilter: React.Dispatch<React.SetStateAction<GameServerFilters | undefined>>;
  validPlaceVersions?: string[];
}

type NumberRangeFilterKeys = {
  [K in keyof GameServerFilters]: GameServerFilters[K] extends NumberRange ? K : never;
}[keyof GameServerFilters];

const numberRangeValid = (range: NumberRange) => {
  return typeof range.min === 'number' || typeof range.max === 'number';
};

const numberRangeLabel = (range: NumberRange) => {
  const hasMin = typeof range.min === 'number';
  const hasMax = typeof range.max === 'number';

  if (hasMin && hasMax) return `${range.min} - ${range.max}`;
  if (hasMin) return `>= ${range.min}`;
  if (hasMax) return `<= ${range.max}`;
  return '';
};

const DEFAULT_SERVER_TYPES = {
  public: true,
  reserved: true,
  vip: true,
};

const DEFAULT_SERVER_STATUSES = {
  active: true,
  terminated: true,
};

const NUMBER_FILTERS: { key: NumberRangeFilterKeys; translationKey: string }[] = [
  { key: 'frameRate', translationKey: 'ServerListTable.Filter.FrameRate.Label' },
  { key: 'memoryUsed', translationKey: 'ServerListTable.Filter.MemoryUsed.Label' },
  { key: 'occupancy', translationKey: 'ServerListTable.Filter.Occupancy.Label' },
];

const toggleFilterBit = <T extends Record<string, boolean>>(current: T, key: keyof T, reset: T) => {
  const next = { ...current, [key]: false };
  const allFalse = Object.values(next).every((v) => !v);
  return allFalse ? reset : next;
};

const FilterChipRow: FunctionComponent<FilterChipRowProps> = ({
  filter,
  setFilter,
  validPlaceVersions,
}) => {
  const { translate } = useTranslation();
  const { classes } = useFilterChipRowStyles();

  const { filterChipContainer } = classes;

  const allServerTypes = Object.values(filter.serverType).every((v) => v);
  const allServerStatuses = Object.values(filter.serverStatus).every((v) => v);

  const removeServerType = useCallback(
    (type: keyof ServerType) => {
      setFilter((prev) => {
        if (!prev) return prev;
        const currentTypes = prev.serverType;
        if (!currentTypes[type]) return prev;
        return {
          ...prev,
          serverType: toggleFilterBit(prev.serverType, type, DEFAULT_SERVER_TYPES),
        };
      });
    },
    [setFilter],
  );

  const removeServerStatus = useCallback(
    (type: keyof ServerStatus) => {
      setFilter((prev) => {
        if (!prev) return prev;
        const currentStatuses = prev.serverStatus;
        if (!currentStatuses[type]) return prev;
        return {
          ...prev,
          serverStatus: toggleFilterBit(prev.serverStatus, type, DEFAULT_SERVER_STATUSES),
        };
      });
    },
    [setFilter],
  );

  const clearNumberRange = useCallback(
    (key: NumberRangeFilterKeys) => {
      setFilter((prev) =>
        prev ? { ...prev, [key]: { min: undefined, max: undefined } } : undefined,
      );
    },
    [setFilter],
  );

  return (
    <Grid container className={filterChipContainer} data-testid='filter-chip-row'>
      {filter.placeVersion &&
        filter.placeVersion.map((version) => (
          <FilterChip
            key={version}
            label={translate('ServerListTable.Filter.PlaceVersion.Chip', { version })}
            isValid={!validPlaceVersions || validPlaceVersions.includes(version)}
            onClick={() =>
              setFilter((prev) =>
                prev
                  ? {
                      ...prev,
                      placeVersion: (prev?.placeVersion ?? []).filter((v) => v !== version),
                    }
                  : undefined,
              )
            }
          />
        ))}
      {filter.engineVersion &&
        filter.engineVersion.map((version) => (
          <FilterChip
            key={version}
            label={translate('ServerListTable.Filter.EngineVersion.Chip', { version })}
            isValid={false}
            onClick={() =>
              setFilter((prev) =>
                prev
                  ? {
                      ...prev,
                      engineVersion: (prev?.engineVersion ?? []).filter((v) => v !== version),
                    }
                  : undefined,
              )
            }
          />
        ))}
      {filter.serverType && !allServerTypes && (
        <React.Fragment>
          {filter.serverType.public && (
            <FilterChip
              label={translate('ServerListTable.Filter.ServerType.Public')}
              isValid={false}
              onClick={() => removeServerType('public')}
            />
          )}
          {filter.serverType.reserved && (
            <FilterChip
              label={translate('ServerListTable.Filter.ServerType.Reserved')}
              isValid={false}
              onClick={() => removeServerType('reserved')}
            />
          )}
          {filter.serverType.vip && (
            <FilterChip
              label={translate('ServerListTable.Filter.ServerType.Vip')}
              isValid={false}
              onClick={() => removeServerType('vip')}
            />
          )}
        </React.Fragment>
      )}
      {filter.serverStatus && !allServerStatuses && (
        <React.Fragment>
          {filter.serverStatus.active && (
            <FilterChip
              label={translate('ServerListTable.Filter.ServerStatus.Active')}
              isValid={false}
              onClick={() => removeServerStatus('active')}
            />
          )}
          {filter.serverStatus.terminated && (
            <FilterChip
              label={translate('ServerListTable.Filter.ServerStatus.Terminated')}
              isValid={false}
              onClick={() => removeServerStatus('terminated')}
            />
          )}
        </React.Fragment>
      )}
      {NUMBER_FILTERS.map(({ key, translationKey }) => {
        const rangeValue = filter[key];

        if (!numberRangeValid(rangeValue)) return null;

        return (
          <FilterChip
            key={key}
            label={translate(translationKey, { range: numberRangeLabel(rangeValue) })}
            isValid={false}
            onClick={() => clearNumberRange(key)}
          />
        );
      })}
    </Grid>
  );
};

export default FilterChipRow;
