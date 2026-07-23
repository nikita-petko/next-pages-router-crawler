import type { FunctionComponent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@rbx/foundation-ui';
import { useTranslation, Locale, useLocalization } from '@rbx/intl';
import { DateTimePicker, PickersUtilsProvider, TextField } from '@rbx/ui';
import ServerLogDateRangePopover from './ServerLogDateRangePopover';
import type { TDatePresetOption } from './ServerLogDateRangePopover';

const DATE_TIME_VIEWS = ['year', 'month', 'day', 'hours', 'minutes'] as const;

// The date adapter operates in local time, but we want the user to pick/read UTC,
// so we feed the picker a date whose local fields equal the stored date's UTC fields,
// and convert back on change. State always stores the true (UTC-intended) instant.
function toPickerDate(date: Date | null | undefined): Date | null {
  if (!date) {
    return null;
  }
  return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
}

function fromPickerDate(date: Date | null): Date | null {
  if (!date) {
    return null;
  }
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
}

export type ServerLogDateRangePreset = 'all' | 'last1Hour' | 'last1Day' | 'last7Days' | 'custom';

const PRESET_LABEL_KEYS = {
  all: 'ServerDetailsPage.Logs.DateRange.All',
  last1Hour: 'ServerDetailsPage.Logs.DateRange.LastHour',
  last1Day: 'ServerDetailsPage.Logs.DateRange.LastDay',
  last7Days: 'ServerDetailsPage.Logs.DateRange.LastWeek',
  custom: 'ServerDetailsPage.Logs.DateRange.Custom',
} as const satisfies Record<ServerLogDateRangePreset, string>;

export interface ServerLogDateRangeSelection {
  preset: ServerLogDateRangePreset;
  customStart?: Date;
  customEnd?: Date;
}

// Dates are stored as UTC-intended instants, so format in UTC to display the same fields that are stored.
const CUSTOM_DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
};

export interface ServerLogsDateRangeControlProps {
  label: string;
  options: ServerLogDateRangePreset[];
  value: ServerLogDateRangeSelection;
  onChange: (value: ServerLogDateRangeSelection) => void;
}

const ServerLogsDateRangeControl: FunctionComponent<ServerLogsDateRangeControlProps> = ({
  label,
  options,
  value,
  onChange,
}) => {
  const { translateWithNamespace } = useTranslation();

  const { locale } = useLocalization();
  const formatCustomDate = useCallback(
    (date: Date) =>
      new Intl.DateTimeFormat(locale ?? Locale.English, CUSTOM_DATE_FORMAT_OPTIONS).format(date),
    [locale],
  );

  const [draftStart, setDraftStart] = useState<Date | null>(value.customStart ?? null);
  const [draftEnd, setDraftEnd] = useState<Date | null>(value.customEnd ?? null);

  // Keep the draft custom range in sync with the committed selection so reopening the picker reflects the last applied range.
  const [prevCustomStart, setPrevCustomStart] = useState(value.customStart);
  const [prevCustomEnd, setPrevCustomEnd] = useState(value.customEnd);
  if (value.customStart !== prevCustomStart || value.customEnd !== prevCustomEnd) {
    setPrevCustomStart(value.customStart);
    setPrevCustomEnd(value.customEnd);
    setDraftStart(value.customStart ?? null);
    setDraftEnd(value.customEnd ?? null);
  }

  const presets = useMemo<TDatePresetOption[]>(
    () =>
      options
        .filter((option) => option !== 'custom')
        .map((preset) => ({
          key: preset,
          label: translateWithNamespace(
            'CreatorDashboard.ServerManagement',
            PRESET_LABEL_KEYS[preset],
          ),
          selected: value.preset === preset,
          onSelect: () => onChange({ preset }),
        })),
    [options, value.preset, onChange, translateWithNamespace],
  );

  const triggerLabel = useMemo(() => {
    if (value.preset === 'custom') {
      const { customStart, customEnd } = value;
      if (customStart && customEnd) {
        return `${formatCustomDate(customStart)} - ${formatCustomDate(customEnd)}`;
      }
      if (customStart) {
        return translateWithNamespace(
          'CreatorDashboard.ServerManagement',
          'ServerDetailsPage.Logs.DateRange.Custom.After',
          {
            date: formatCustomDate(customStart),
          },
        );
      }
      if (customEnd) {
        return translateWithNamespace(
          'CreatorDashboard.ServerManagement',
          'ServerDetailsPage.Logs.DateRange.Custom.Before',
          {
            date: formatCustomDate(customEnd),
          },
        );
      }
    }
    return translateWithNamespace(
      'CreatorDashboard.ServerManagement',
      PRESET_LABEL_KEYS[value.preset],
    );
  }, [value, formatCustomDate, translateWithNamespace]);

  const customAvailable = options.includes('custom');
  // Allow open-ended ranges (start may be after end only when one is missing). When both bounds are
  // cleared, Apply commits the "All" preset, but only when an existing custom range is being cleared —
  // otherwise there is nothing to apply.
  const bothCleared = !draftStart && !draftEnd;
  const canApply = bothCleared
    ? value.preset === 'custom'
    : !draftStart || !draftEnd || draftStart.getTime() <= draftEnd.getTime();
  const nowPickerDate = toPickerDate(new Date()) ?? undefined;

  return (
    <ServerLogDateRangePopover
      label={label}
      triggerLabel={triggerLabel}
      presets={presets}
      customLabel={
        customAvailable
          ? translateWithNamespace('CreatorDashboard.ServerManagement', PRESET_LABEL_KEYS.custom)
          : undefined
      }
      customSelected={value.preset === 'custom'}
      className='min-width-[220px]'
      renderPicker={({ closePopover, backToPresets }) => (
        <div className='flex flex-col gap-medium padding-medium min-width-[320px]'>
          <span className='text-body-small content-muted'>
            {translateWithNamespace('CreatorDashboard.ServerManagement', PRESET_LABEL_KEYS.custom)}
          </span>
          <div className='flex flex-row gap-small'>
            <PickersUtilsProvider>
              <div className='flex grow-1 flex-col gap-xsmall'>
                <DateTimePicker
                  value={toPickerDate(draftStart)}
                  onChange={(date) => setDraftStart(fromPickerDate(date))}
                  maxDate={toPickerDate(draftEnd) ?? undefined}
                  maxDateTime={nowPickerDate}
                  views={[...DATE_TIME_VIEWS]}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      id='server-logs-date-range-start'
                      fullWidth
                      size='small'
                      variant='outlined'
                      label={translateWithNamespace(
                        'CreatorDashboard.ServerManagement',
                        'ServerDetailsPage.Logs.DateRange.Custom.Start',
                      )}
                      inputProps={{ ...params.inputProps, readOnly: true }}
                      InputProps={{
                        ...params.InputProps,
                        sx: { '& .MuiIconButton-edgeEnd': { marginRight: 0 } },
                      }}
                    />
                  )}
                />
                <div className='flex flex-row justify-start'>
                  <Button
                    variant='Utility'
                    size='XSmall'
                    isDisabled={!draftStart}
                    onClick={() => setDraftStart(null)}>
                    {translateWithNamespace(
                      'CreatorDashboard.ServerManagement',
                      'ServerDetailsPage.Logs.DateRange.Custom.Reset',
                    )}
                  </Button>
                </div>
              </div>
              <div className='flex grow-1 flex-col gap-xsmall'>
                <DateTimePicker
                  value={toPickerDate(draftEnd)}
                  onChange={(date) => setDraftEnd(fromPickerDate(date))}
                  minDate={toPickerDate(draftStart) ?? undefined}
                  maxDateTime={nowPickerDate}
                  views={[...DATE_TIME_VIEWS]}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      id='server-logs-date-range-end'
                      fullWidth
                      size='small'
                      variant='outlined'
                      label={translateWithNamespace(
                        'CreatorDashboard.ServerManagement',
                        'ServerDetailsPage.Logs.DateRange.Custom.End',
                      )}
                      inputProps={{ ...params.inputProps, readOnly: true }}
                      InputProps={{
                        ...params.InputProps,
                        sx: { '& .MuiIconButton-edgeEnd': { marginRight: 0 } },
                      }}
                    />
                  )}
                />
                <div className='flex flex-row justify-start'>
                  <Button
                    variant='Utility'
                    size='XSmall'
                    isDisabled={!draftEnd}
                    onClick={() => setDraftEnd(null)}>
                    {translateWithNamespace(
                      'CreatorDashboard.ServerManagement',
                      'ServerDetailsPage.Logs.DateRange.Custom.Reset',
                    )}
                  </Button>
                </div>
              </div>
            </PickersUtilsProvider>
          </div>
          <div className='flex flex-row justify-between gap-small'>
            <Button variant='Standard' size='Small' onClick={backToPresets}>
              {translateWithNamespace(
                'CreatorDashboard.ServerManagement',
                'ServerDetailsPage.Logs.DateRange.Custom.Cancel',
              )}
            </Button>
            <Button
              variant='Emphasis'
              size='Small'
              isDisabled={!canApply}
              onClick={() => {
                if (!draftStart && !draftEnd) {
                  onChange({ preset: 'all' });
                } else {
                  onChange({
                    preset: 'custom',
                    customStart: draftStart ?? undefined,
                    customEnd: draftEnd ?? undefined,
                  });
                }
                closePopover();
              }}>
              {translateWithNamespace(
                'CreatorDashboard.ServerManagement',
                'ServerDetailsPage.Logs.DateRange.Custom.Apply',
              )}
            </Button>
          </div>
        </div>
      )}
    />
  );
};

export default ServerLogsDateRangeControl;
