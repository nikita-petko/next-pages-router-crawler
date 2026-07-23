import type { FC } from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import { Grid } from '@rbx/ui';
import type { TranslationKeyToFormattedText } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useQueryBasedLabeledTimeRangesBundle from '../../context/useQueryBasedLabeledTimeRangesBundle';
import type { LabeledDateRange } from '../../types/LabeledDateRange';
import LabeledDateRangeSelector from './LabeledDateRangeSelector';
import useLabeledDateRangeSelectorStyles from './LabeledDateRangeSelector.styles';

type LabeledDateRangeSelectorsContainerProps = {
  translate: TranslationKeyToFormattedText;
  labeledDateRangeOptions: LabeledDateRange[];
  maximumDateRanges?: number;
  onChange: (selected: LabeledDateRange[]) => void;
};

const getDefaultTimeRanges = (dateRangeOptions: LabeledDateRange[]) => {
  const result = [];
  if (dateRangeOptions[0]) {
    result.push(dateRangeOptions[0]);
  } else {
    result.push({
      // the past week, unlabeled
      startTime: new Date(new Date().setDate(new Date().getDate() - 7)),
      endTime: new Date(),
    });
  }
  if (dateRangeOptions[1]) {
    result.push(dateRangeOptions[1]);
  }
  return result;
};

const LabeledDateRangeSelectorsContainer: FC<LabeledDateRangeSelectorsContainerProps> = ({
  translate,
  labeledDateRangeOptions,
  maximumDateRanges = 3,
  onChange,
}) => {
  const { labeledTimeRanges: timeRangeQuery, setLabeledTimeRangesQuery: setQueryParams } =
    useQueryBasedLabeledTimeRangesBundle();
  const {
    classes: { dateRangeSelectorContainer },
  } = useLabeledDateRangeSelectorStyles();

  // Note: since selectedTimeRanges is managed with the query string, we do not
  // mutate it directly on update, we make a new array and use setSelectedTimeRanges
  const handleDateRangeChange = useCallback(
    (index: number, newRange?: LabeledDateRange) => {
      let newSelectedRanges: LabeledDateRange[] = [];
      if (newRange) {
        newSelectedRanges = timeRangeQuery.toSpliced(index, 1, newRange);
      } else {
        newSelectedRanges = timeRangeQuery.toSpliced(index, 1);
      }
      setQueryParams(newSelectedRanges);
    },
    [setQueryParams, timeRangeQuery],
  );

  useEffect(() => {
    onChange(timeRangeQuery);
  }, [onChange, timeRangeQuery]);

  useEffect(() => {
    if (timeRangeQuery.length === 0) {
      setQueryParams(getDefaultTimeRanges(labeledDateRangeOptions));
    }
  }, [labeledDateRangeOptions, setQueryParams, timeRangeQuery]);

  const rangeSelectors = useMemo(() => {
    const selectors = timeRangeQuery.map((timeRange, index) => (
      <LabeledDateRangeSelector
        label={translate(translationKey('Label.DateRangeNumber', TranslationNamespace.Analytics), {
          number: (index + 1).toString(),
        })}
        key={`${timeRange.label ?? 'no label'} ${timeRange.startTime.valueOf()}-${timeRange.endTime.valueOf()}`}
        labeledDateRangeOptions={labeledDateRangeOptions}
        selectedOptions={timeRangeQuery}
        onChange={(value) => handleDateRangeChange(index, value)}
        translate={translate}
        value={timeRange}
        allowEmpty={index !== 0}
      />
    ));
    // Add an empty selector if we're below the max number of ranges
    if (selectors.length < maximumDateRanges) {
      selectors.push(
        <LabeledDateRangeSelector
          label={translate(
            translationKey('Label.DateRangeNumber', TranslationNamespace.Analytics),
            {
              number: (selectors.length + 1).toString(),
            },
          )}
          key='empty'
          labeledDateRangeOptions={labeledDateRangeOptions}
          selectedOptions={timeRangeQuery}
          onChange={(value) => handleDateRangeChange(selectors.length, value)}
          translate={translate}
          value={undefined}
          allowEmpty
        />,
      );
    }
    return selectors;
  }, [
    handleDateRangeChange,
    labeledDateRangeOptions,
    maximumDateRanges,
    timeRangeQuery,
    translate,
  ]);

  return (
    <Grid container className={dateRangeSelectorContainer}>
      {rangeSelectors}
    </Grid>
  );
};

export default LabeledDateRangeSelectorsContainer;
