import React, { useState } from 'react';
import { Button, Chip } from '@rbx/foundation-ui';
import { Menu, MenuItem } from '@rbx/ui';
import styles from '../shared/Layout.module.css';
import { API_JOB_FUNCTION_LABELS, API_LOCATION_TYPE_LABELS } from '../../constants';
import type { JobFunction, JobsListJobsRequest, StudioViewModel } from '../../types';

const FILTER_MENU_MAX_HEIGHT = 320;

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
    <React.Fragment>
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
          trailing='icon-filled-chevron-large-down'
          className='pointer-events-none'
        />
      </button>
      <Menu
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            style: {
              minWidth: anchorEl?.offsetWidth ?? 'auto',
              maxHeight: FILTER_MENU_MAX_HEIGHT,
            },
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
    </React.Fragment>
  );
}

const locationOptions: Array<FilterOption<string>> = Object.values(API_LOCATION_TYPE_LABELS)
  .filter((label, i, arr) => arr.indexOf(label) === i)
  .map((label) => ({ value: label, label }));

const JOB_FUNCTION_LABEL_TO_VALUES: Record<string, JobFunction[]> = {};
Object.entries(API_JOB_FUNCTION_LABELS).forEach(([value, label]) => {
  if (!JOB_FUNCTION_LABEL_TO_VALUES[label]) {
    JOB_FUNCTION_LABEL_TO_VALUES[label] = [];
  }
  JOB_FUNCTION_LABEL_TO_VALUES[label].push(Number(value) as JobFunction);
});

const jobFunctionOptions: Array<FilterOption<JobFunction>> = Object.entries(
  JOB_FUNCTION_LABEL_TO_VALUES,
).map(([label, values]) => ({ value: values[0], label }));

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
  studios = [],
  postJobHref,
}) => {
  const studioOptions = studios.map((studio) => ({
    value: studio.id,
    label: studio.name ?? 'Studio',
  }));

  const handleFunctionToggle = (value: JobFunction) => {
    const label = API_JOB_FUNCTION_LABELS[value];
    const allValues = JOB_FUNCTION_LABEL_TO_VALUES[label] ?? [value];
    const current: JobFunction[] = filters._function ?? []; // eslint-disable-line no-underscore-dangle -- generated API field
    const isActive = allValues.some((v) => current.includes(v));
    const next = isActive
      ? current.filter((v) => !allValues.includes(v))
      : [...current, ...allValues];
    onChange({
      ...filters,
      // eslint-disable-next-line no-underscore-dangle -- generated API field
      _function: next.length > 0 ? next : undefined,
    });
  };

  const handleLocationToggle = (value: string) => {
    onChange({
      ...filters,
      location: toggleArrayValue(filters.location ?? [], value),
    });
  };

  const handleStudioToggle = (value: string) => {
    onChange({
      ...filters,
      studioId: toggleArrayValue(filters.studioId ?? [], value),
    });
  };

  const handleReset = () => {
    onChange({});
  };

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
          label='Function'
          allLabel='All positions'
          options={jobFunctionOptions}
          selected={activeFunctionValues}
          onToggle={handleFunctionToggle}
          onClear={() => onChange({ ...filters, _function: undefined })} // eslint-disable-line no-underscore-dangle -- generated API field
        />
        <MultiFilterMenuChip
          label='Location'
          allLabel='All locations'
          options={locationOptions}
          selected={filters.location ?? []}
          onToggle={handleLocationToggle}
          onClear={() => onChange({ ...filters, location: undefined })}
        />
        <MultiFilterMenuChip
          label='Studio'
          allLabel='All studios'
          options={studioOptions}
          selected={filters.studioId ?? []}
          onToggle={handleStudioToggle}
          onClear={() => onChange({ ...filters, studioId: undefined })}
        />
        <Button variant='Utility' size='Small' onClick={handleReset}>
          Reset
        </Button>
      </div>
      {postJobHref ? (
        <Button as='a' href={postJobHref} variant='Emphasis' size='Medium'>
          Post a job
        </Button>
      ) : null}
    </div>
  );
};

export default JobFilters;
