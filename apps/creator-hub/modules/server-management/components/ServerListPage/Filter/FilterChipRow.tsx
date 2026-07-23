import type { Dispatch, FunctionComponent, PropsWithChildren, SetStateAction } from 'react';
import { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import type {
  GameServerFilters,
  ServerType,
  ServerStatus,
  NumberRange,
} from '../../../types/GameServerControls';
import {
  ACTIVE_ONLY_SERVER_STATUS_FILTER,
  areAllServerStatusesSelected,
  areNoServerStatusesSelected,
  SERVER_STATUS_FILTER_KEYS,
  SERVER_STATUS_KEYS,
} from '../../../utils/serverStatus';
import FilterChip from './FilterChip';

export interface FilterChipRowProps {
  filter: GameServerFilters;
  setFilter: Dispatch<SetStateAction<GameServerFilters | undefined>>;
  showShutdownServers?: boolean;
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

  if (hasMin && hasMax) {
    return `${range.min} - ${range.max}`;
  }
  if (hasMin) {
    return `>= ${range.min}`;
  }
  if (hasMax) {
    return `<= ${range.max}`;
  }
  return '';
};

const DEFAULT_SERVER_TYPES = {
  public: true,
  reserved: true,
  vip: true,
  teamCreate: true,
  teamTest: true,
} satisfies ServerType;

const SERVER_TYPE_FILTERS = [
  { key: 'public', labelKey: 'ServerListTable.Filter.ServerType.Public' },
  { key: 'reserved', labelKey: 'ServerListTable.Filter.ServerType.Reserved' },
  { key: 'vip', labelKey: 'ServerListTable.Filter.ServerType.Vip' },
  {
    key: 'teamCreate',
    labelKey: 'ServerListTable.Filter.ServerType.TeamCreate',
  },
  { key: 'teamTest', labelKey: 'ServerListTable.Filter.ServerType.TeamTest' },
] as const satisfies readonly { key: keyof ServerType; labelKey: string }[];

const NUMBER_FILTERS = [
  {
    key: 'frameRate',
    chipLabelKey: 'ServerListTable.Filter.FrameRate.Label',
  },
  {
    key: 'memoryUsed',
    chipLabelKey: 'ServerListTable.Filter.MemoryUsed.Label',
  },
  {
    key: 'occupancy',
    chipLabelKey: 'ServerListTable.Filter.Occupancy.Label',
  },
] as const satisfies readonly {
  key: NumberRangeFilterKeys;
  chipLabelKey: string;
}[];

const toggleFilterBit = <T extends object>(current: T, key: keyof T, reset: T): T => {
  const next = { ...current, [key]: false };
  const allFalse = Object.values(next).every((v) => !v);
  return allFalse ? reset : next;
};

interface FilterGroupProps extends PropsWithChildren {
  label: string;
  chipCount: number;
}

const FilterGroup: FunctionComponent<FilterGroupProps> = ({ label, chipCount, children }) => {
  // always reserve the label row so adding a 2nd chip doesn't jump the group down
  return (
    <fieldset
      aria-label={label}
      className='flex flex-col gap-xxsmall padding-none margin-none stroke-none min-width-0'>
      <span
        className={`text-label-medium content-muted padding-left-[5px] padding-bottom-[5px] ${
          chipCount <= 1 ? 'invisible' : 'visible'
        }`}
        aria-hidden={chipCount <= 1}>
        {label}
      </span>
      <div className='flex items-center wrap gap-xsmall'>{children}</div>
    </fieldset>
  );
};

const FilterChipRow: FunctionComponent<FilterChipRowProps> = ({
  filter,
  setFilter,
  showShutdownServers = false,
}) => {
  const { translate } = useTranslation();

  const allServerTypes = Object.values(filter.serverType).every((v) => v);
  const noServerTypes = Object.values(filter.serverType).every((v) => !v);
  const showStatusChips =
    showShutdownServers &&
    !areNoServerStatusesSelected(filter.serverStatus) &&
    !areAllServerStatusesSelected(filter.serverStatus);

  const removeServerType = useCallback(
    (type: keyof ServerType) => {
      setFilter((prev) => {
        if (!prev) {
          return prev;
        }
        const currentTypes = prev.serverType;
        if (!currentTypes[type]) {
          return prev;
        }
        return {
          ...prev,
          serverType: toggleFilterBit(prev.serverType, type, DEFAULT_SERVER_TYPES),
        };
      });
    },
    [setFilter],
  );

  const clearEmptyServerTypes = useCallback(() => {
    setFilter((prev) => (prev ? { ...prev, serverType: { ...DEFAULT_SERVER_TYPES } } : undefined));
  }, [setFilter]);

  const removeServerStatus = useCallback(
    (type: keyof ServerStatus) => {
      setFilter((prev) => {
        if (!prev) {
          return prev;
        }
        const currentStatuses = prev.serverStatus;
        if (!currentStatuses[type]) {
          return prev;
        }
        return {
          ...prev,
          serverStatus: toggleFilterBit(currentStatuses, type, ACTIVE_ONLY_SERVER_STATUS_FILTER),
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

  const statusChips = showStatusChips
    ? SERVER_STATUS_FILTER_KEYS.filter((statusKey) => filter.serverStatus[statusKey]).map(
        (statusKey) => (
          <FilterChip
            key={statusKey}
            label={translate(SERVER_STATUS_KEYS[statusKey])}
            onClick={() => removeServerStatus(statusKey)}
          />
        ),
      )
    : [];

  const typeChips = noServerTypes
    ? [
        <FilterChip
          key='server-type-none'
          label={translate('Action.SelectAll')}
          onClick={clearEmptyServerTypes}
          trailingIconName='icon-regular-check'
        />,
      ]
    : !allServerTypes
      ? SERVER_TYPE_FILTERS.filter(({ key }) => filter.serverType[key]).map(({ key, labelKey }) => (
          <FilterChip key={key} label={translate(labelKey)} onClick={() => removeServerType(key)} />
        ))
      : [];

  const hasNumberChips = NUMBER_FILTERS.some(({ key }) => numberRangeValid(filter[key]));
  const hasAnyChips =
    filter.placeVersion.length > 0 ||
    filter.engineVersion.length > 0 ||
    typeChips.length > 0 ||
    statusChips.length > 0 ||
    hasNumberChips;

  if (!hasAnyChips) {
    return null;
  }

  return (
    <div className='flex wrap gap-medium'>
      {filter.placeVersion.length > 0 && (
        <FilterGroup
          label={translate('ServerListTable.Filter.PlaceVersion')}
          chipCount={filter.placeVersion.length}>
          {filter.placeVersion.map((version) => (
            <FilterChip
              key={version}
              label={translate('ServerListTable.Filter.PlaceVersion.Chip', {
                version,
              })}
              onClick={() =>
                setFilter((prev) =>
                  prev
                    ? {
                        ...prev,
                        placeVersion: prev.placeVersion.filter((value) => value !== version),
                      }
                    : undefined,
                )
              }
            />
          ))}
        </FilterGroup>
      )}
      {filter.engineVersion.length > 0 && (
        <FilterGroup
          label={translate('ServerListTable.Filter.EngineVersion')}
          chipCount={filter.engineVersion.length}>
          {filter.engineVersion.map((version) => (
            <FilterChip
              key={version}
              label={translate('ServerListTable.Filter.EngineVersion.Chip', {
                version,
              })}
              onClick={() =>
                setFilter((prev) =>
                  prev
                    ? {
                        ...prev,
                        engineVersion: prev.engineVersion.filter((value) => value !== version),
                      }
                    : undefined,
                )
              }
            />
          ))}
        </FilterGroup>
      )}
      {typeChips.length > 0 && (
        <FilterGroup
          label={translate('ServerListTable.Filter.ServerType')}
          chipCount={typeChips.length}>
          {typeChips}
        </FilterGroup>
      )}
      {statusChips.length > 0 && (
        <FilterGroup
          label={translate('ServerListTable.Filter.ServerStatus')}
          chipCount={statusChips.length}>
          {statusChips}
        </FilterGroup>
      )}
      {NUMBER_FILTERS.map(({ key, chipLabelKey }) => {
        const rangeValue = filter[key];
        if (!numberRangeValid(rangeValue)) {
          return null;
        }
        return (
          <FilterChip
            key={key}
            label={translate(chipLabelKey, {
              range: numberRangeLabel(rangeValue),
            })}
            onClick={() => clearNumberRange(key)}
          />
        );
      })}
    </div>
  );
};

export default FilterChipRow;
