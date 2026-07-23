import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { FoundationLikeMultiSelect } from '@modules/charts-generic/components/FoundationLikeMultiSelect/FoundationLikeMultiSelect';
import {
  Menu,
  MenuItem,
  MenuSection,
} from '@modules/charts-generic/components/FoundationLikeMultiSelect/FoundationLikeMultiSelectMenu';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidArrayEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import granularityLabels from '../../constants/granularityLabels';
import { useAnalyticsCurrentGranularityBundle } from '../../context/AnalyticsCurrentGranularityProvider';
import type RAQIV2ChartContext from '../../types/RAQIV2ChartContext';
import type { PageGranularityOption } from '../../utils/getPageGranularityOptions';
import { UIGranularities } from '../../utils/seriesGranularities';
import useAnalyticsPageControlBarStyles from './ExperienceAnalyticsPageControlBar.styles';

type PageGranularityControlProps = {
  options: PageGranularityOption[];
  chartContext?: RAQIV2ChartContext;
  hidePartialSupportDescription?: boolean;
};

const PageGranularityControl: FC<PageGranularityControlProps> = ({
  options,
  chartContext,
  hidePartialSupportDescription = false,
}) => {
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { granularity: currentGranularityFromBundle, onChangeGranularity } =
    useAnalyticsCurrentGranularityBundle();
  const currentGranularity = chartContext?.granularity ?? currentGranularityFromBundle;
  const {
    classes: { foundationControlBarSelector },
  } = useAnalyticsPageControlBarStyles();

  const granularityMenuItems = useMemo(
    () =>
      options.map(({ granularity, ...opt }) => {
        const label = translate(granularityLabels[granularity]);

        if (!opt.isAllowed) {
          return <MenuItem key={granularity} value={granularity} title={label} disabled />;
        }

        if (opt.isPartial && !hidePartialSupportDescription) {
          const description = tPendingTranslation(
            'Some charts on this page do not support this time interval.',
            'Description on granularity options that only apply to some charts',
            translationKey('Description.PartialGranularitySupport', TranslationNamespace.Analytics),
          );
          return (
            <MenuItem
              key={granularity}
              value={granularity}
              title={label}
              description={description}
            />
          );
        }

        return <MenuItem key={granularity} value={granularity} title={label} />;
      }),
    [hidePartialSupportDescription, options, translate, tPendingTranslation],
  );

  const onGranularityChangeEvent = useCallback(
    (nextValues: string[]) => {
      const currentGranularityValue: string = currentGranularity;
      const newGranularity = nextValues
        .toReversed()
        .find((value) => value !== currentGranularityValue);
      if (newGranularity && isValidArrayEnumValue(UIGranularities, newGranularity)) {
        onChangeGranularity(newGranularity);
      }
    },
    [currentGranularity, onChangeGranularity],
  );

  const selectorLabel = translate(
    translationKey('Label.Granularity', TranslationNamespace.Analytics),
  );

  const formatGranularityValue = useCallback(
    ([value]: string[]) =>
      isValidArrayEnumValue(UIGranularities, value) ? translate(granularityLabels[value]) : '',
    [translate],
  );

  return (
    <Grid item>
      <FoundationLikeMultiSelect
        className={foundationControlBarSelector}
        label={selectorLabel}
        size='Medium'
        placeholder={selectorLabel}
        value={[currentGranularity]}
        onValueChange={onGranularityChangeEvent}
        formatValue={formatGranularityValue}>
        <Menu>
          <MenuSection>{granularityMenuItems}</MenuSection>
        </Menu>
      </FoundationLikeMultiSelect>
    </Grid>
  );
};

export default PageGranularityControl;
