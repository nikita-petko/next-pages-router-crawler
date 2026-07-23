import React, { useCallback, useMemo, useState } from 'react';
import { Button, Chip } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Menu, MenuItem } from '@rbx/ui';
import {
  API_JOB_FUNCTION_LABELS,
  API_LOCATION_TYPE_LABELS,
  getUniqueJobFunctionOptions,
  isJobFunction,
} from '../../constants';
import type { JobFunction, JobsListJobsRequest, StudioViewModel } from '../../types';
import styles from '../shared/Layout.module.css';

type JobFiltersProps = {
  filters: JobsListJobsRequest;
  onChange: (filters: JobsListJobsRequest) => void;
  studios?: StudioViewModel[];
  postJobHref?: string;
};

type FilterOption<T extends string | number> = {
  value: T;
  label: string;
};

const MENU_ANCHOR_ORIGIN = { vertical: 'bottom', horizontal: 'left' } as const;
const MENU_TRANSFORM_ORIGIN = { vertical: 'top', horizontal: 'left' } as const;
const EMPTY_STUDIOS: StudioViewModel[] = [];

type MultiFilterMenuChipProps<T extends string | number> = {
  label: string;
  allLabel: string;
  options: Array<FilterOption<T>>;
  selected: T[];
  onToggle: (value: T) => void;
  onClear: () => void;
};

function MultiFilterMenuChip<T extends string | number>({
  label,
  allLabel,
  options,
  selected,
  onToggle,
  onClear,
}: MultiFilterMenuChipProps<T>) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const selectedSet = new Set(selected);
  const hasSelection = selected.length > 0;

  let displayLabel = allLabel;
  if (selected.length === 1) {
    const match = options.find((o) => o.value === selected[0]);
    displayLabel = match?.label ?? allLabel;
  } else if (selected.length > 1) {
    displayLabel = `${label} (${selected.length})`;
  }

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <button
        type='button'
        className={styles.chipTrigger}
        onClick={handleOpen}
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-label={label}>
        <Chip
          text={displayLabel}
          size='Medium'
          variant='Standard'
          isChecked={hasSelection}
          trailingIconName='icon-filled-chevron-large-down'
          className='pointer-events-none'
        />
      </button>
      <Menu
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        variant='menu'
        anchorOrigin={MENU_ANCHOR_ORIGIN}
        transformOrigin={MENU_TRANSFORM_ORIGIN}
        slotProps={{
          paper: {
            className: styles.filterMenuPaper,
          },
        }}>
        <MenuItem
          selected={!hasSelection}
          onClick={() => {
            onClear();
            handleClose();
          }}>
          {allLabel}
        </MenuItem>
        {options.map((option) => {
          const isSelected = selectedSet.has(option.value);
          return (
            <MenuItem
              key={String(option.value)}
              selected={isSelected}
              onClick={() => onToggle(option.value)}>
              {option.label}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}

const locationOptions: Array<FilterOption<string>> = Object.values(API_LOCATION_TYPE_LABELS)
  .filter((label, i, arr) => arr.indexOf(label) === i)
  .map((label) => ({ value: label, label }));

const JOB_FUNCTION_LABEL_TO_VALUES: Record<string, JobFunction[]> = {};
Object.entries(API_JOB_FUNCTION_LABELS).forEach(([value, label]) => {
  const jobFunction = Number(value);
  if (!isJobFunction(jobFunction)) {
    return;
  }
  if (!JOB_FUNCTION_LABEL_TO_VALUES[label]) {
    JOB_FUNCTION_LABEL_TO_VALUES[label] = [];
  }
  JOB_FUNCTION_LABEL_TO_VALUES[label].push(jobFunction);
});

const jobFunctionOptions: Array<FilterOption<JobFunction>> = getUniqueJobFunctionOptions().map(
  ([value, label]) => ({ value, label }),
);

function toggleArrayValue<T>(arr: T[], value: T): T[] | undefined {
  if (arr.includes(value)) {
    const next = arr.filter((v) => v !== value);
    return next.length > 0 ? next : undefined;
  }
  return [...arr, value];
}

export const JobFilters: React.FC<JobFiltersProps> = ({
  filters,
  onChange,
  studios = EMPTY_STUDIOS,
  postJobHref,
}) => {
  const { translate } = useTranslation();
  const studioOptions = useMemo(
    () => studios.map((studio) => ({ value: studio.id, label: studio.name ?? 'Studio' })),
    [studios],
  );

  const handleFunctionToggle = useCallback(
    (value: JobFunction) => {
      const label = API_JOB_FUNCTION_LABELS[value];
      const allValues = JOB_FUNCTION_LABEL_TO_VALUES[label] ?? [value];
      const current: JobFunction[] = filters._function ?? []; // eslint-disable-line no-underscore-dangle -- generated API field
      const isActive = allValues.some((v) => current.includes(v));
      const next = isActive
        ? current.filter((v) => !allValues.includes(v))
        : [...current, ...allValues];
      onChange({
        ...filters,
        _function: next.length > 0 ? next : undefined,
      });
    },
    [filters, onChange],
  );

  const handleLocationToggle = useCallback(
    (value: string) => {
      onChange({
        ...filters,
        location: toggleArrayValue(filters.location ?? [], value),
      });
    },
    [filters, onChange],
  );

  const handleStudioToggle = useCallback(
    (value: string) => {
      onChange({
        ...filters,
        studioId: toggleArrayValue(filters.studioId ?? [], value),
      });
    },
    [filters, onChange],
  );

  const handleReset = useCallback(() => {
    onChange({});
  }, [onChange]);

  const handleClearFunction = useCallback(() => {
    onChange({ ...filters, _function: undefined });
  }, [filters, onChange]);

  const handleClearLocation = useCallback(() => {
    onChange({ ...filters, location: undefined });
  }, [filters, onChange]);

  const handleClearStudio = useCallback(() => {
    onChange({ ...filters, studioId: undefined });
  }, [filters, onChange]);

  // eslint-disable-next-line no-underscore-dangle -- API schema uses _function for the field name
  const rawFunctions = filters._function ?? [];
  const activeFunctionValues = jobFunctionOptions
    .filter((opt) => {
      const group = JOB_FUNCTION_LABEL_TO_VALUES[opt.label] ?? [opt.value];
      return group.some((v) => rawFunctions.includes(v));
    })
    .map((opt) => opt.value);

  return (
    <div className={styles.filterBar} data-testid='job-filters'>
      <div className={styles.filterChips}>
        <MultiFilterMenuChip
          label={translate('Label.Function')}
          allLabel={translate('Label.AllPositions')}
          options={jobFunctionOptions}
          selected={activeFunctionValues}
          onToggle={handleFunctionToggle}
          onClear={handleClearFunction}
        />
        <MultiFilterMenuChip
          label={translate('Label.Location')}
          allLabel={translate('Label.AllLocations')}
          options={locationOptions}
          selected={filters.location ?? []}
          onToggle={handleLocationToggle}
          onClear={handleClearLocation}
        />
        <MultiFilterMenuChip
          label={translate('Label.Studio')}
          allLabel={translate('Label.AllStudios')}
          options={studioOptions}
          selected={filters.studioId ?? []}
          onToggle={handleStudioToggle}
          onClear={handleClearStudio}
        />
        <Button
          variant='Utility'
          size='Medium'
          onClick={handleReset}
          className={styles.filterResetButton}>
          <span className='text-body-medium'>{translate('Action.Reset')}</span>
        </Button>
      </div>
      {postJobHref ? (
        <Button
          as='a'
          href={postJobHref}
          variant='Emphasis'
          size='Medium'
          className={styles.postJobButton}>
          {translate('Action.PostAJob')}
        </Button>
      ) : null}
    </div>
  );
};

export default JobFilters;
