import type { FC } from 'react';
import { useMemo } from 'react';
import { resolveUrl } from '@rbx/env-utils';
import { Grid, InfoOutlinedIcon, Link, Tooltip } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type ChartResourceType from '@modules/charts-generic/enums/ChartResourceType';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ChartConfiguratorAnnotationsControl from '../../components/chartConfigurator/ChartConfiguratorAnnotationsControl';
import { getAnnotationOptionsFromAnnotationTypes } from '../../constants/annotationConfig';
import useCurrentAnnotationsBundleProvider from '../../hooks/useCurrentAnnotationsBundleProvider';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import useAnalyticsPageControlBarStyles from './ExperienceAnalyticsPageControlBar.styles';

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
    classes: { foundationControlBarSelector, versionAnnotationsTooltipSpacing },
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

  const options = useMemo(
    () => getAnnotationOptionsFromAnnotationTypes(supportedAnnotationTypes),
    [supportedAnnotationTypes],
  );

  const defaultAnnotationOptions = useMemo(
    () => getAnnotationOptionsFromAnnotationTypes(defaultAnnotationTypes),
    [defaultAnnotationTypes],
  );

  if (supportedAnnotationTypes.length === 0) {
    return null;
  }

  return (
    <Grid item>
      <ChartConfiguratorAnnotationsControl
        className={foundationControlBarSelector}
        options={options}
        value={selectedAnnotationOptions}
        defaultValue={defaultAnnotationOptions}
        onChange={onAnnotationOptionsChange}
      />
      {isTooltipShown && tooltipLink}
    </Grid>
  );
};
export default AnalyticsPageAnnotationsControl;
