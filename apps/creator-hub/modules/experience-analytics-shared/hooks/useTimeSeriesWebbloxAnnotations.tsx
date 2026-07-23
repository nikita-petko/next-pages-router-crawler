import type { FunctionComponent, PropsWithChildren } from 'react';
import { useMemo } from 'react';
import type { TAnnotation } from '@rbx/analytics-ui';
import { ChartColor } from '@rbx/analytics-ui';
import type { TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import { useTranslation } from '@rbx/intl';
import type { TIconProps } from '@rbx/ui';
import {
  BoltIcon,
  CollectionsOutlinedIcon,
  EditOutlinedIcon,
  EventIcon,
  ImageOutlinedIcon,
  InfoOutlinedIcon,
  Link,
  PhonelinkSetupOutlinedIcon,
  SettingsOutlinedIcon,
  TuneIcon,
  Typography,
  WarningIcon,
} from '@rbx/ui';
import type { TranslationKey } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { TimeSeriesAnnotation } from '@modules/charts-generic/charts/types/Annotations';
import { AlertAnnotationSeverity } from '@modules/charts-generic/charts/types/Annotations';
import {
  AnnotationBenchmarkType,
  AnnotationType,
  AnnotationCustomMatchmakingChangeType,
  AnnotationEnablementType,
  AnnotationEngineReleasePlatform,
} from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ConfigVersionAnnotationTooltipContent from '../components/TimeSeriesAnnotationLabels/ConfigVersionAnnotationTooltipContent';
import LiveEventAnnotationTooltipContent from '../components/TimeSeriesAnnotationLabels/LiveEventAnnotationTooltipContent';
import {
  EnrollmentIcon,
  UnenrollmentIcon,
} from '../components/TimeSeriesAnnotationLabels/MatchmakingAnnotationTooltipContent';
import MiniImageCarousel from '../components/TimeSeriesAnnotationLabels/MiniImageCarousel';
import PlaceIconAnnotationTooltipContent from '../components/TimeSeriesAnnotationLabels/PlaceIconAnnotationTooltipContent';
import { PlaceVideoIcon } from '../components/TimeSeriesAnnotationLabels/PlaceVideoAnnotationTooltipContent';
import TextBasedAnnotationTooltipContent from '../components/TimeSeriesAnnotationLabels/TextBasedAnnotationTooltipContent';
import { AnnotationConfig, MetricAnnotationType } from '../constants/annotationConfig';

const alertAnnotationSeverityToDisplayConfig: Record<
  AlertAnnotationSeverity,
  { color: ChartColor; icon: FunctionComponent<PropsWithChildren<TIconProps>> }
> = {
  [AlertAnnotationSeverity.Info]: { color: ChartColor.Blue, icon: InfoOutlinedIcon },
  [AlertAnnotationSeverity.Minor]: { color: ChartColor.White, icon: WarningIcon },
  [AlertAnnotationSeverity.Warning]: { color: ChartColor.Yellow, icon: WarningIcon },
  [AlertAnnotationSeverity.Error]: { color: ChartColor.Red, icon: WarningIcon },
};

// Pad the still-firing `ConfiguredAlertIncident` range end one minute past the
// chart's time-axis end so the range annotation's end-line falls off-screen
// (otherwise it would render as a visible boundary on the right edge).
const UNRESOLVED_INCIDENT_END_OFFSET_MS = 60_000;

const useTimeSeriesWebbloxAnnotations = ({
  timeSeriesAnnotations,
  timeAxisSpec: { endDate: givenEndDate },
  metric,
  latestDataTimestamp,
}: {
  timeSeriesAnnotations: TimeSeriesAnnotation[];
  metric?: TRAQIV2UIMetric;
  timeAxisSpec: {
    startDate: Date;
    endDate: Date;
  };
  latestDataTimestamp?: Date;
}): TAnnotation[] | undefined => {
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());

  return useMemo(() => {
    const validAnnotations: TAnnotation[] = [];
    timeSeriesAnnotations.forEach((annotation) => {
      const { perMetricConfigs, showForUnconfiguredMetrics } = AnnotationConfig[annotation.type];

      if (!showForUnconfiguredMetrics && (!metric || !perMetricConfigs[metric])) {
        return;
      }

      const validAnnotation: TAnnotation = {
        ...annotation,
        Icon: () => null,
        start: annotation.startUtc.getTime(),
      };

      switch (annotation.type) {
        case AnnotationType.PlaceIcon:
          validAnnotation.Icon = ImageOutlinedIcon;
          validAnnotation.tooltip = <PlaceIconAnnotationTooltipContent annotation={annotation} />;
          break;
        case AnnotationType.PlaceThumbnail:
          validAnnotation.Icon =
            annotation.imageUrls.length > 1 ? CollectionsOutlinedIcon : ImageOutlinedIcon;
          validAnnotation.tooltip = (
            <MiniImageCarousel imageUrls={annotation.imageUrls} imageWidth={115} imageHeight={64} />
          );
          break;
        case AnnotationType.LiveEvent: {
          validAnnotation.Icon = EventIcon;
          validAnnotation.tooltip = <LiveEventAnnotationTooltipContent annotation={annotation} />;
          break;
        }
        case AnnotationType.PlaceVideo: {
          validAnnotation.Icon = PlaceVideoIcon;
          validAnnotation.tooltip = (
            <TextBasedAnnotationTooltipContent
              text={translate(
                translationKey('Description.GamePreviewVideo.Live', TranslationNamespace.Analytics),
              )}
            />
          );
          break;
        }
        case AnnotationType.PlaceVersion:
          validAnnotation.Icon = EditOutlinedIcon;
          validAnnotation.tooltip = <TextBasedAnnotationTooltipContent text={annotation.text} />;
          break;
        case AnnotationType.ConfigVersion:
          validAnnotation.Icon = PhonelinkSetupOutlinedIcon;
          validAnnotation.tooltip = (
            <ConfigVersionAnnotationTooltipContent annotation={annotation} />
          );
          break;
        case AnnotationType.Benchmark: {
          validAnnotation.Icon = InfoOutlinedIcon;
          let tooltipKey: TranslationKey | null = null;
          if (annotation.to === AnnotationBenchmarkType.Similarity) {
            tooltipKey = translationKey(
              'Description.BenchmarkUpdate.Similarity',
              TranslationNamespace.Analytics,
            );
          } else if (annotation.to === AnnotationBenchmarkType.Genre) {
            tooltipKey = translationKey(
              'Description.BenchmarkUpdate.Genre',
              TranslationNamespace.Analytics,
            );
          }
          validAnnotation.tooltip = tooltipKey ? (
            <TextBasedAnnotationTooltipContent text={translate(tooltipKey)} />
          ) : null;
          break;
        }
        case AnnotationType.FunnelStepNameChange:
          break;
        case AnnotationType.CustomMatchmaking:
          switch (annotation.customMatchmakingChange) {
            case AnnotationCustomMatchmakingChangeType.Enrollment:
              validAnnotation.Icon = EnrollmentIcon;
              break;
            case AnnotationCustomMatchmakingChangeType.Unenrollment:
              validAnnotation.Icon = UnenrollmentIcon;
              break;
            case AnnotationCustomMatchmakingChangeType.WeightsUpdate:
              validAnnotation.Icon = TuneIcon;
              break;
            default: {
              const exhaustiveCheck: never = annotation.customMatchmakingChange;
              throw new Error(
                `Unhandled custom matchmaking change type: ${String(exhaustiveCheck)}`,
              );
            }
          }
          validAnnotation.tooltip = (
            <TextBasedAnnotationTooltipContent text={annotation.scoringConfigurationName} />
          );
          break;
        case AnnotationType.EngineRelease:
          validAnnotation.Icon = SettingsOutlinedIcon;
          switch (annotation.platform) {
            case AnnotationEngineReleasePlatform.Rcc:
              validAnnotation.tooltip = (
                <TextBasedAnnotationTooltipContent
                  text={translate(
                    translationKey('Description.EngineRelease.RCC', TranslationNamespace.Analytics),
                  )}
                />
              );
              break;
            case AnnotationEngineReleasePlatform.WindowsPlayer:
              validAnnotation.tooltip = (
                <TextBasedAnnotationTooltipContent
                  text={translate(
                    translationKey(
                      'Description.EngineRelease.WindowsPlayer',
                      TranslationNamespace.Analytics,
                    ),
                  )}
                />
              );
              break;
            case AnnotationEngineReleasePlatform.MacPlayer:
              validAnnotation.tooltip = (
                <TextBasedAnnotationTooltipContent
                  text={translate(
                    translationKey(
                      'Description.EngineRelease.MacPlayer',
                      TranslationNamespace.Analytics,
                    ),
                  )}
                />
              );
              break;
            default: {
              const exhaustiveCheck: never = annotation.platform;
              throw new Error(`Unhandled engine release platform type: ${String(exhaustiveCheck)}`);
            }
          }
          break;
        case AnnotationType.ClientCrashRateNotStableAlert:
        case AnnotationType.MemoryStoreRequestsAlert:
        case AnnotationType.MemoryStoreMemoryUsageAlert:
          validAnnotation.Icon = alertAnnotationSeverityToDisplayConfig[annotation.severity].icon;
          validAnnotation.end = annotation.endUtc.getTime();
          validAnnotation.rangeAnnotationConfig = {
            curtainColor: alertAnnotationSeverityToDisplayConfig[annotation.severity].color,
            curtainStayOnChart: true,
          };
          validAnnotation.tooltip = (
            <TextBasedAnnotationTooltipContent
              text={
                <Typography variant='body2'>{annotation.tooltipRenderer(translateHTML)}</Typography>
              }
            />
          );
          break;
        case AnnotationType.ConfiguredAlertIncident:
          validAnnotation.Icon = alertAnnotationSeverityToDisplayConfig[annotation.severity].icon;
          // For still-firing incidents the API returns no `endUtc`; clamp the
          // range to the chart's time-axis end rather than the synthetic
          // `endUtc = startUtc` fallback written by the adapter.
          validAnnotation.end = annotation.isUnresolved
            ? givenEndDate.getTime() + UNRESOLVED_INCIDENT_END_OFFSET_MS
            : annotation.endUtc.getTime();
          validAnnotation.rangeAnnotationConfig = {
            curtainColor: alertAnnotationSeverityToDisplayConfig[annotation.severity].color,
            curtainStayOnChart: true,
          };
          validAnnotation.tooltip = (
            <TextBasedAnnotationTooltipContent
              text={
                <Typography variant='body2'>{annotation.tooltipRenderer(translateHTML)}</Typography>
              }
            />
          );
          break;
        case AnnotationType.RetentionCorhortDisclaimer: {
          validAnnotation.Icon = InfoOutlinedIcon;
          validAnnotation.end = givenEndDate.getTime();
          validAnnotation.rangeAnnotationConfig = {
            curtainColor: ChartColor.Blue,
            curtainStayOnChart: false,
          };
          break;
        }
        case AnnotationType.ExtendedServicesEnablement: {
          // Hydration in UniverseAnnotationsClientProvider already filters to the
          // (service: 'rcc', resource: 'ccu-cores') cores-quota pair, so we render
          // unconditionally here. The `enablementType` tier (Standard = free vs
          // Extended = paid) and the `enabled` flag (started vs ended) select one
          // of four labels.
          validAnnotation.Icon = BoltIcon;
          let extendedServicesEnablementKey: string;
          switch (annotation.enablementType) {
            case AnnotationEnablementType.Standard:
              extendedServicesEnablementKey = annotation.enabled
                ? 'Description.ExtendedServicesEnablement.StandardQuotaStarted'
                : 'Description.ExtendedServicesEnablement.StandardQuotaEnded';
              break;
            case AnnotationEnablementType.Extended:
              extendedServicesEnablementKey = annotation.enabled
                ? 'Description.ExtendedServicesEnablement.ExtendedQuotaStarted'
                : 'Description.ExtendedServicesEnablement.ExtendedQuotaEnded';
              break;
            default: {
              const exhaustiveCheck: never = annotation.enablementType;
              throw new Error(`Unhandled enablement type: ${String(exhaustiveCheck)}`);
            }
          }
          validAnnotation.tooltip = (
            <TextBasedAnnotationTooltipContent
              text={translate(
                translationKey(extendedServicesEnablementKey, TranslationNamespace.Analytics),
              )}
            />
          );
          break;
        }
        case AnnotationType.Announcement: {
          validAnnotation.Icon = InfoOutlinedIcon;
          const link = annotation.links && annotation.links.length > 0 ? annotation.links[0] : null;
          const translatedContent = translateHTML(
            annotation.translationKey,
            link
              ? [
                  {
                    opening: 'linkStart',
                    closing: 'linkEnd',
                    content(chunks) {
                      return (
                        <Link href={link} target='_blank' rel='noopener noreferrer'>
                          {chunks}
                        </Link>
                      );
                    },
                  },
                ]
              : undefined,
          );

          validAnnotation.tooltip = (
            <TextBasedAnnotationTooltipContent
              text={<Typography variant='body2'>{translatedContent}</Typography>}
            />
          );
          break;
        }
        case AnnotationType.CreatorRegexChange: {
          validAnnotation.Icon = InfoOutlinedIcon;
          const tooltip = translate(
            translationKey(
              'Description.CreatorRegexChangeAnnotation',
              TranslationNamespace.Analytics,
            ),
          );
          validAnnotation.tooltip = <TextBasedAnnotationTooltipContent text={tooltip} />;
          break;
        }
        default: {
          const exhaustiveCheck: never = annotation;
          throw new Error('Exhaustive check:', exhaustiveCheck);
        }
      }

      if (metric && perMetricConfigs[metric]) {
        const perMetricConfig = perMetricConfigs[metric];
        switch (perMetricConfig.type) {
          case MetricAnnotationType.DateRangeShifted:
            validAnnotation.start += perMetricConfig.shiftValue;
            if (validAnnotation.end) {
              validAnnotation.end += perMetricConfig.shiftValue;
            }
            break;
          case MetricAnnotationType.DateRangeWithLatestDataTimestampToTimeAxisEnd:
            validAnnotation.end = givenEndDate.getTime();
            validAnnotation.start = latestDataTimestamp?.getTime() ?? validAnnotation.start;

            if (perMetricConfig.annotationTooltipKey) {
              validAnnotation.tooltip = (
                <TextBasedAnnotationTooltipContent
                  text={translate(perMetricConfig.annotationTooltipKey)}
                />
              );
            }
            break;
          case MetricAnnotationType.AlertMetricWithChartContext:
          case MetricAnnotationType.AlertMetricWithSeverityDimension:
            break;
          default: {
            const exhaustiveCheck: never = perMetricConfig;
            throw new Error('Exhaustive check:', exhaustiveCheck);
          }
        }
      }
      validAnnotations.push(validAnnotation);
    });
    return validAnnotations;
  }, [givenEndDate, latestDataTimestamp, metric, timeSeriesAnnotations, translate, translateHTML]);
};

export default useTimeSeriesWebbloxAnnotations;
