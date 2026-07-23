import React, { FC, ReactNode, useCallback } from 'react';
import {
  SingleDateType,
  singleDateStrings,
  useAnalyticsCurrentSingleDateBundle,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { MenuItem, Grid, Select } from '@rbx/ui';
import useRelativeSingleDatePickerCustomMenuItem, {
  useExperienceAnalyticsCurrentSingleDateString,
} from '../../components/CustomDatePickerMenuItem/useSingleDatePickerCustomMenuItem';
import useAnalyticsPageControlBarStyles from './ExperienceAnalyticsPageControlBar.styles';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';

type ExperienceAnalyticsPageSingleDateControlProps = {
  singleDateOptions: SingleDateType[];
};

const ExperienceAnalyticsPageSingleDateControl: FC<
  ExperienceAnalyticsPageSingleDateControlProps
> = ({ singleDateOptions }) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const { singleDateType, onChangeDateType } = useAnalyticsCurrentSingleDateBundle();
  const {
    classes: { controlBarSelector },
  } = useAnalyticsPageControlBarStyles();

  const concatenatedSingleDateString = useExperienceAnalyticsCurrentSingleDateString();

  const { CustomDatePickerMenuItem, selectProps, closeMenu } =
    useRelativeSingleDatePickerCustomMenuItem();

  const dateRangeMenuItems = singleDateOptions.map((item) => {
    if (item === SingleDateType.Custom) {
      return CustomDatePickerMenuItem;
    }
    return (
      <MenuItem key={item} value={item}>
        {translate(singleDateStrings[item])}
      </MenuItem>
    );
  });

  const getTextFieldValueForRangeType = useCallback(
    (currentDateType: unknown): ReactNode => {
      /**
       * NOTE(cmccarty@ 20230316): renderValue requires this input arg type to be Unknown,
       * but we actually want to make sure its a SingleDateType
       */
      const castedDateType: SingleDateType = currentDateType as SingleDateType;
      if (castedDateType === SingleDateType.Custom) {
        return concatenatedSingleDateString;
      }
      return translate(singleDateStrings[castedDateType]);
    },
    [concatenatedSingleDateString, translate],
  );

  const onDateTypeChange = useCallback(
    (event: React.ChangeEvent<{ value: string }>) => {
      const newDateType = event.target.value as SingleDateType;
      if (newDateType !== SingleDateType.Custom) {
        closeMenu();
      }
      onChangeDateType(newDateType);
    },
    [closeMenu, onChangeDateType],
  );
  const dateRangeLabel = translationKey('Label.Date', TranslationNamespace.Analytics);

  if (singleDateOptions?.length === 1) {
    return null;
  }

  return (
    <Grid item>
      <Select
        SelectProps={{
          ...selectProps,
          renderValue: getTextFieldValueForRangeType,
        }}
        label={translate(dateRangeLabel)}
        className={controlBarSelector}
        data-testid='select'
        value={singleDateType}
        onChange={onDateTypeChange}>
        {dateRangeMenuItems}
      </Select>
    </Grid>
  );
};

export default ExperienceAnalyticsPageSingleDateControl;
