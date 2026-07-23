import { useCallback, useMemo } from 'react';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { RAQIV2Dimension, RAQIV2UIPseudoDimension } from '@rbx/creator-hub-analytics-config';
import { Grid } from '@rbx/ui';
import type { TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { FoundationLikeMultiSelect } from '@modules/charts-generic/components/FoundationLikeMultiSelect/FoundationLikeMultiSelect';
import {
  Menu,
  MenuItem,
  MenuSection,
} from '@modules/charts-generic/components/FoundationLikeMultiSelect/FoundationLikeMultiSelectMenu';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import getDimensionRenderer from '../../components/getDimensionRenderer';
import { isDurationBucketDimension } from '../../constants/RAQIV2DurationBucketDimensions';
import {
  useAnalyticsCurrentBreakdownBundle,
  useAnalyticsCurrentBreakdownBundleUnfiltered,
} from '../../context/AnalyticsCurrentBreakdownBundleProvider';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import useAnalyticsPageControlBarStyles from './ExperienceAnalyticsPageControlBar.styles';

const noBreakdown = '$__NONE__$'; // This should never be a RAQIV2 dimension name
const noBreakdownTranslationKey: TranslationKey = translationKey(
  'Label.None',
  TranslationNamespace.Analytics,
);
type UIBreakdownType = TRAQIV2Dimension | typeof noBreakdown;

const isSupportedDimension = (value: string): value is TRAQIV2Dimension =>
  isValidEnumValue(RAQIV2Dimension, value) || isValidEnumValue(RAQIV2UIPseudoDimension, value);

const getMenuTranslationKey = (uiType: UIBreakdownType): TranslationKey => {
  if (uiType === noBreakdown) {
    return noBreakdownTranslationKey;
  }
  return getDimensionRenderer(uiType).name;
};

const ExperienceAnalyticsPageBreakdownControl = ({
  dimensions: givenBreakdownOrdering,
}: {
  dimensions: ReadonlyArray<TRAQIV2Dimension>;
}) => {
  const uiBreakdownOrder: UIBreakdownType[] = useMemo(
    () => [noBreakdown, ...givenBreakdownOrdering],
    [givenBreakdownOrdering],
  );

  const { translate } = useRAQIV2TranslationDependencies();
  const {
    classes: { foundationControlBarSelector },
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
      const menuTranslationKey = getMenuTranslationKey(uiType);
      return <MenuItem key={uiType} value={uiType} title={translate(menuTranslationKey)} />;
    });
    unsupportedBreakdown.forEach((dimension) => {
      result.push(
        <MenuItem
          key={dimension}
          value={dimension}
          title={translate(getDimensionRenderer(dimension).name)}
          disabled
        />,
      );
    });
    return result;
  }, [translate, uiBreakdownOrder, unsupportedBreakdown]);

  const onBreakdownChange = useCallback(
    (nextValues: string[]) => {
      const latestValue = nextValues.at(-1);
      if (!latestValue || latestValue === noBreakdown) {
        setBreakdown([]);
        return;
      }
      const nextDimension = nextValues
        .toReversed()
        .filter((value) => value !== noBreakdown)
        .find((value): value is TRAQIV2Dimension => isSupportedDimension(value));
      if (nextDimension) {
        setBreakdown([nextDimension]);
      }
    },
    [setBreakdown],
  );

  const selectedValue = breakdown.length ? breakdown[0] : noBreakdown;
  const label = translate(
    translationKey('Label.Control.Breakdown', TranslationNamespace.Analytics),
  );
  const formatValue = useCallback(
    ([value]: string[]) => {
      if (!value) {
        return '';
      }
      if (value === noBreakdown || isSupportedDimension(value)) {
        return translate(getMenuTranslationKey(value));
      }
      return value;
    },
    [translate],
  );

  return (
    <Grid item>
      <FoundationLikeMultiSelect
        className={foundationControlBarSelector}
        label={label}
        size='Medium'
        placeholder={label}
        value={[selectedValue]}
        onValueChange={onBreakdownChange}
        formatValue={formatValue}>
        <Menu>
          <MenuSection>{breakdownMenuItems}</MenuSection>
        </Menu>
      </FoundationLikeMultiSelect>
    </Grid>
  );
};
export default ExperienceAnalyticsPageBreakdownControl;
