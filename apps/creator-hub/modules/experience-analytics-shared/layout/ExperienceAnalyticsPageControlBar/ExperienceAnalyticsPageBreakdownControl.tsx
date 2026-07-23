import React, { useCallback, useMemo } from 'react';
import { MenuItem, Grid, Select, Tooltip } from '@rbx/ui';
import {
  TRAQIV2BreakdownDimension,
  isSupportedBreakdownDimension,
} from '@modules/clients/analytics';
import { TranslationKey, translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isDurationBucketDimension } from '../../constants/RAQIV2DurationBucketDimensions';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import {
  useAnalyticsCurrentBreakdownBundle,
  useAnalyticsCurrentBreakdownBundleUnfiltered,
} from '../../context/AnalyticsCurrentBreakdownBundleProvider';
import useAnalyticsPageControlBarStyles from './ExperienceAnalyticsPageControlBar.styles';
import getDimensionRenderer from '../../components/getDimensionRenderer';

const noBreakdown = '$__NONE__$'; // This should never be a RAQIV2 dimension name
const noBreakdownTranslationKey: TranslationKey = translationKey(
  'Label.None',
  TranslationNamespace.Analytics,
);
type UIBreakdownType = TRAQIV2BreakdownDimension | typeof noBreakdown;

const getMenuTranslationKey = (uiType: UIBreakdownType): TranslationKey => {
  if (uiType === noBreakdown) {
    return noBreakdownTranslationKey;
  }
  return getDimensionRenderer(uiType).name;
};

const getIsMenuItemSelected = (
  uiType: UIBreakdownType,
  breakdown: TRAQIV2BreakdownDimension[],
): boolean => {
  if (uiType === noBreakdown) {
    return breakdown.length === 0;
  }
  return breakdown.includes(uiType);
};

const ExperienceAnalyticsPageBreakdownControl = ({
  dimensions: givenBreakdownOrdering,
}: {
  dimensions: ReadonlyArray<TRAQIV2BreakdownDimension>;
}) => {
  const uiBreakdownOrder: UIBreakdownType[] = useMemo(
    () => [noBreakdown, ...givenBreakdownOrdering],
    [givenBreakdownOrdering],
  );

  const { translate } = useRAQIV2TranslationDependencies();
  const {
    classes: { controlBarSelector },
  } = useAnalyticsPageControlBarStyles();
  const { breakdown: pageBreakdownUnfiltered } = useAnalyticsCurrentBreakdownBundleUnfiltered();
  const { breakdown, setBreakdown } = useAnalyticsCurrentBreakdownBundle(givenBreakdownOrdering);
  const unsupportedBreakdown = useMemo(() => {
    return pageBreakdownUnfiltered.filter(
      (dimension) =>
        // duration bucket dimensions are not ui selectable, they are used for duration buckets
        // based metrics as opposed to time series based metrics
        !givenBreakdownOrdering.includes(dimension) && !isDurationBucketDimension(dimension),
    );
  }, [pageBreakdownUnfiltered, givenBreakdownOrdering]);
  const breakdownMenuItems = useMemo(() => {
    const result = uiBreakdownOrder.map((uiType: UIBreakdownType) => {
      const selected = getIsMenuItemSelected(uiType, breakdown);
      const menuTranslationKey = getMenuTranslationKey(uiType);
      return (
        <MenuItem key={uiType} value={uiType} selected={selected}>
          {translate(menuTranslationKey)}
        </MenuItem>
      );
    });
    unsupportedBreakdown.forEach((dimension) => {
      const tooltip = translate(
        translationKey('Description.UnsupportedBreakdown', TranslationNamespace.Analytics),
      );
      result.push(
        <Tooltip key={dimension} title={tooltip} placement='left'>
          <div>
            <MenuItem value={dimension} disabled>
              {translate(getDimensionRenderer(dimension).name)}
            </MenuItem>
          </div>
        </Tooltip>,
      );
    });
    return result;
  }, [breakdown, translate, uiBreakdownOrder, unsupportedBreakdown]);

  const onBreakdownChange = useCallback(
    ({ target: { value } }: React.ChangeEvent<{ value: string }>) => {
      if (value === noBreakdown) {
        setBreakdown([]);
        return;
      }
      if (isSupportedBreakdownDimension(value)) {
        setBreakdown([value]);
      }
    },
    [setBreakdown],
  );

  return (
    <Grid item>
      <Select
        label={translate(translationKey('Label.Control.Breakdown', TranslationNamespace.Analytics))}
        variant='outlined'
        className={controlBarSelector}
        data-testid='select'
        value={breakdown.length ? breakdown : noBreakdown}
        onChange={onBreakdownChange}>
        {breakdownMenuItems}
      </Select>
    </Grid>
  );
};
export default ExperienceAnalyticsPageBreakdownControl;
