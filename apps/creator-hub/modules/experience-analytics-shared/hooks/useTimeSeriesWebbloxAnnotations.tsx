import {
  CollectionsOutlinedIcon,
  EditOutlinedIcon,
  EventIcon,
  ImageOutlinedIcon,
  InfoOutlinedIcon,
  Link,
  PhonelinkSetupOutlinedIcon,
  SettingsOutlinedIcon,
  TIconProps,
  TuneIcon,
  Typography,
  WarningIcon,
} from '@rbx/ui';
import React, { useMemo, FunctionComponent, PropsWithChildren } from 'react';
import {
  AnnotationBenchmarkType,
  AnnotationType,
  AnnotationCustomMatchmakingChangeType,
  AnnotationEngineReleasePlatform,
} from '@modules/clients/analytics';
import { useTranslation } from '@rbx/intl';
import { ChartColor, TAnnotation } from '@rbx/analytics-ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  useTranslationWrapper,
  translationKey,
  TranslationKey,
} from '@modules/analytics-translations';
import { TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import { AlertAnnotationSeverity, TimeSeriesAnnotation } from '@modules/charts-generic';
import MiniImageCarousel from '../components/TimeSeriesAnnotationLabels/MiniImageCarousel';
import PlaceIconAnnotationTooltipContent from '../components/TimeSeriesAnnotationLabels/PlaceIconAnnotationTooltipContent';
import TextBasedAnnotationTooltipContent from '../components/TimeSeriesAnnotationLabels/TextBasedAnnotationTooltipContent';
import LiveEventAnnotationTooltipContent from '../components/TimeSeriesAnnotationLabels/LiveEventAnnotationTooltipContent';
import {
  EnrollmentIcon,
  UnenrollmentIcon,
} from '../components/TimeSeriesAnnotationLabels/MatchmakingAnnotationTooltipContent';
import { PlaceVideoIcon } from '../components/TimeSeriesAnnotationLabels/PlaceVideoAnnotationTooltipContent';
import ConfigVersionAnnotationTooltipContent from '../components/TimeSeriesAnnotationLabels/ConfigVersionAnnotationTooltipContent';
import { AnnotationConfig, MetricAnnotationType } from '../constants/annotationConfig';

const alertAnnotationSeverityToDisplayConfig: Record<
  AlertAnnotationSeverity,
  { color: ChartColor; icon: FunctionComponent<PropsWithChildren<TIconProps>> }
> = {
  [AlertAnnotationSeverity.Info]: { color: ChartColor.Blue, icon: InfoOutlinedIcon },
  [AlertAnnotationSeverity.Warning]: { color: ChartColor.Yellow, icon: WarningIcon },
  [AlertAnnotationSeverity.Error]: { color: ChartColor.Red, icon: WarningIcon },
};

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
              throw new Error(`Unhandled custom matchmaking change type: ${exhaustiveCheck}`);
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
              throw new Error(`Unhandled engine release platform type: ${exhaustiveCheck}`);
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
        case AnnotationType.RetentionCorhortDisclaimer: {
          validAnnotation.Icon = InfoOutlinedIcon;
          validAnnotation.end = givenEndDate.getTime();
          validAnnotation.rangeAnnotationConfig = {
            curtainColor: ChartColor.Blue,
            curtainStayOnChart: false,
          };
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
