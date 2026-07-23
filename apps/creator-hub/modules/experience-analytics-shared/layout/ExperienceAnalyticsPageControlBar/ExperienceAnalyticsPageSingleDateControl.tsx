import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { DatePresetPopoverControl } from '@rbx/date-range-picker';
import type { TDatePresetOption } from '@rbx/date-range-picker';
import { DateTimePicker } from '@rbx/foundation-ui';
import type { TDateTimePickerLabelsSingleActions } from '@rbx/foundation-ui';
import { Grid } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { formatSingleDate } from '@modules/charts-generic/charts/formatters/timeFormatters';
import singleDateStrings from '@modules/charts-generic/constants/singleDateStrings';
import { useAnalyticsCurrentSingleDateBundle } from '@modules/charts-generic/context/AnalyticsQuerySingleDateBundleContext';
import useLocale from '@modules/charts-generic/context/useLocale';
import SingleDateType from '@modules/charts-generic/enums/SingleDateType';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import useAnalyticsPageControlBarStyles from './ExperienceAnalyticsPageControlBar.styles';

type ExperienceAnalyticsPageSingleDateControlProps = {
  singleDateOptions: SingleDateType[];
};

const ExperienceAnalyticsPageSingleDateControl: FC<
  ExperienceAnalyticsPageSingleDateControlProps
> = ({ singleDateOptions }) => {
  const locale = useLocale();
  const { translate } = useRAQIV2TranslationDependencies();
  const { date, onChangeDate, minStartDate, maxEndDate, singleDateType, onChangeDateType } =
    useAnalyticsCurrentSingleDateBundle();
  const {
    classes: { foundationControlBarSelector },
  } = useAnalyticsPageControlBarStyles();

  const presetOptions = useMemo(
    () => singleDateOptions.filter((t) => t !== SingleDateType.Custom),
    [singleDateOptions],
  );
  const supportsCustom = singleDateOptions.includes(SingleDateType.Custom);

  const presets = useMemo<TDatePresetOption[]>(
    () =>
      presetOptions.map((type) => ({
        key: type,
        label: translate(singleDateStrings[type]),
        selected: singleDateType === type,
        onSelect: () => onChangeDateType(type),
      })),
    [presetOptions, translate, singleDateType, onChangeDateType],
  );

  const triggerLabel = useMemo(() => {
    if (singleDateType === SingleDateType.Custom) {
      return formatSingleDate(locale, date);
    }
    return translate(singleDateStrings[singleDateType]);
  }, [singleDateType, locale, date, translate]);

  const applyPickedDate = useCallback(
    (selected: Date | null) => {
      if (selected) {
        onChangeDate(selected);
      }
    },
    [onChangeDate],
  );

  const dateLabel =
    translate(translationKey('Label.Date', TranslationNamespace.Analytics)) || 'Date';
  const customLabel =
    translate(translationKey('Label.DateCustom', TranslationNamespace.Analytics)) || 'Custom';

  const pickerLabels = useMemo<TDateTimePickerLabelsSingleActions>(
    () => ({
      previousMonth:
        translate(translationKey('Label.PreviousMonth', TranslationNamespace.Analytics)) ||
        'Previous month',
      nextMonth:
        translate(translationKey('Label.NextMonth', TranslationNamespace.Analytics)) ||
        'Next month',
      apply: translate(translationKey('Action.Apply', TranslationNamespace.Analytics)) || 'Apply',
      cancel:
        translate(translationKey('Action.Cancel', TranslationNamespace.Analytics)) || 'Cancel',
    }),
    [translate],
  );

  if (singleDateOptions?.length === 1) {
    return null;
  }

  return (
    <Grid item>
      <DatePresetPopoverControl
        label={dateLabel}
        triggerLabel={triggerLabel}
        presets={presets}
        customLabel={supportsCustom ? customLabel : undefined}
        customSelected={singleDateType === SingleDateType.Custom}
        className={foundationControlBarSelector}
        renderPicker={({ closePopover, backToPresets }) => (
          <DateTimePicker
            variant='Single'
            labels={pickerLabels}
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- useLocale returns the same locale strings supported by DateTimePicker, but with a wider app-level type.
            locale={locale as Parameters<typeof DateTimePicker>[0]['locale']}
            defaultDates={date}
            selectableDateRange={{ startDate: minStartDate, endDate: maxEndDate }}
            onChanged={(selected) => {
              applyPickedDate(selected);
              closePopover();
            }}
            onCancel={backToPresets}
          />
        )}
      />
    </Grid>
  );
};

export default ExperienceAnalyticsPageSingleDateControl;
