import React, { FC, useCallback, useMemo } from 'react';
import { Grid, InfoOutlinedIcon, Link, Tooltip } from '@rbx/ui';
import { ChartResourceType, MultiSelect } from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import { resolveUrl } from '@rbx/env-utils';
import { getNewFilterValues } from './filterUtils';
import useAnalyticsPageControlBarStyles from './ExperienceAnalyticsPageControlBar.styles';
import { showMenuBelowSelector } from './FilterBarMultiSelector';
import useCurrentAnnotationsBundleProvider from '../../hooks/useCurrentAnnotationsBundleProvider';
import {
  AnnotationSelectableCategory,
  AnnotationCategoryLabelKey,
  AnnotationConfig,
  getAnnotationOptionsFromAnnotationTypes,
  type AnnotationOptions,
} from '../../constants/annotationConfig';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';

const benchmarkTermsLinkURL = resolveUrl(
  'creatorAnalyticsTermsOfUseUrl',
  process.env.targetEnvironment,
  process.env.buildTarget,
);

type AnalyticsPageAnnotationsControlProps = {
  isTooltipShown?: boolean;
  resourceType: ChartResourceType;
};

const AnalyticsPageAnnotationsControl: FC<AnalyticsPageAnnotationsControlProps> = ({
  isTooltipShown = false,
  resourceType,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();

  const {
    classes: { controlBarSelector, versionAnnotationsTooltipSpacing },
  } = useAnalyticsPageControlBarStyles();

  const {
    supportedAnnotationTypes,
    defaultAnnotationTypes,
    selectedAnnotationOptions,
    onAnnotationOptionsChange,
  } = useCurrentAnnotationsBundleProvider(resourceType);

  const tooltipLink = useMemo(() => {
    const tooltipText = translate(
      translationKey('Message.BenchmarkTermsOfService', TranslationNamespace.Analytics),
    );
    return (
      <Link
        target='_blank'
        color='inherit'
        href={benchmarkTermsLinkURL}
        className={versionAnnotationsTooltipSpacing}>
        <Tooltip title={tooltipText} arrow>
          <InfoOutlinedIcon fontSize='small' />
        </Tooltip>
      </Link>
    );
  }, [translate, versionAnnotationsTooltipSpacing]);

  const translateAnnotationOption = useCallback(
    (option: AnnotationOptions) => {
      if (option === 'None') {
        return translate(translationKey('Label.None', TranslationNamespace.Analytics));
      }

      if (isValidEnumValue(AnnotationSelectableCategory, option)) {
        return translate(AnnotationCategoryLabelKey[option]);
      }

      return translate(AnnotationConfig[option].labelKey);
    },
    [translate],
  );

  const options = useMemo(() => {
    return getAnnotationOptionsFromAnnotationTypes(supportedAnnotationTypes);
  }, [supportedAnnotationTypes]);

  const onChange = useCallback(
    (given: AnnotationOptions[]) => {
      const newValues = getNewFilterValues(
        selectedAnnotationOptions,
        given,
        'None',
        defaultAnnotationTypes,
      );

      onAnnotationOptionsChange(newValues as AnnotationOptions[]);
    },
    [selectedAnnotationOptions, defaultAnnotationTypes, onAnnotationOptionsChange],
  );

  if (supportedAnnotationTypes.length === 0) {
    return null;
  }

  return (
    <Grid item>
      <MultiSelect
        rootClassName={controlBarSelector}
        selectedOptions={selectedAnnotationOptions}
        options={options}
        label={translate(
          translationKey('Label.Dimension.Annotations', TranslationNamespace.Analytics),
        )}
        onChange={onChange}
        SelectProps={showMenuBelowSelector}
        formatOption={translateAnnotationOption}
      />
      {isTooltipShown && tooltipLink}
    </Grid>
  );
};
export default AnalyticsPageAnnotationsControl;
