import { useCallback, useMemo, useState } from 'react';
import type { ChartCardHeaderAction } from '@rbx/analytics-ui';
import { useFlag } from '@rbx/flags';
import { useTranslation } from '@rbx/intl';
import { MenuItem } from '@rbx/ui';
import { isCustomDashboardsEnabled as isCustomDashboardsEnabledFlag } from '@generated/flags/creatorAnalytics';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { customDashboardConfigFromUntabbed } from '@modules/experience-analytics/custom-dashboards/adapters/customDashboardFromUntabbed';
import AddToDashboardPickerCta from '@modules/experience-analytics/custom-dashboards/components/AddToDashboardPickerCta';
import { useDashboardsListQuery } from '@modules/experience-analytics/custom-dashboards/hooks/useDashboardsListQuery';
import { getChartRows } from '@modules/experience-analytics/custom-dashboards/layout/dashboardLayout';
import {
  useOptionalCanMutateCustomDashboards,
  useOptionalCustomDashboardsBackendState,
} from '@modules/experience-analytics/custom-dashboards/service/CustomDashboardServiceProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isMultiMetricChartConfig, type ChartConfig } from '../../types/RAQIV2ChartConfig';
import type RAQIV2ChartSpec from '../../types/RAQIV2ChartSpec';
import {
  CreatorAnalyticsPageMode,
  type CreatorAnalyticsUntabbedPageConfig,
} from '../../types/RAQIV2PageConfig';

function captureChartTile(config: ChartConfig, spec: RAQIV2ChartSpec) {
  if (isMultiMetricChartConfig(config)) {
    return null;
  }
  const source = {
    mode: CreatorAnalyticsPageMode.Untabbed,
    title: config.titleKey,
    description: { standard: config.titleKey },
    docLinks: [],
    resourceTypes: [spec.resource.type],
    timeRangeOptions: { type: 'None' },
    surfaceAnnotationOptions: {
      supportedAnnotationTypes: [],
      defaultAnnotationTypes: [],
      showAnnotationsControl: false,
    },
    filterDimensions: [],
    breakdownDimensions: [],
    body: [
      {
        ...config,
        overrides: {
          ...config.overrides,
          granularity: { override: spec.granularity },
          ...(spec.breakdown ? { breakdown: { override: spec.breakdown } } : {}),
          ...(spec.filter ? { filter: { override: spec.filter } } : {}),
        },
      },
    ],
  } satisfies CreatorAnalyticsUntabbedPageConfig;
  return getChartRows(customDashboardConfigFromUntabbed(source).config)[0]?.tiles[0] ?? null;
}

export function shouldShowAddChartToDashboardAction({
  areFlagsReady,
  isCustomDashboardsEnabled,
  canEditCustomDashboards,
  canSaveLocalCustomDashboards,
  hasCapturedTile,
  resourceType,
}: {
  readonly areFlagsReady: boolean;
  readonly isCustomDashboardsEnabled: boolean;
  readonly canEditCustomDashboards: boolean;
  readonly canSaveLocalCustomDashboards: boolean;
  readonly hasCapturedTile: boolean;
  readonly resourceType: string;
}): boolean {
  return (
    areFlagsReady &&
    isCustomDashboardsEnabled &&
    (canEditCustomDashboards || canSaveLocalCustomDashboards) &&
    hasCapturedTile &&
    resourceType === 'Universe'
  );
}

export function useAddChartToDashboardAction({
  config,
  spec,
}: {
  readonly config: ChartConfig | null;
  readonly spec: RAQIV2ChartSpec;
}): ChartCardHeaderAction | null {
  const [isOpen, setIsOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState<(() => void) | null>(null);
  const handleRequestOpenChange = useCallback((nextRequestOpen: (() => void) | null) => {
    setRequestOpen(() => nextRequestOpen);
  }, []);
  const universeId = spec.resource.type.toString() === 'Universe' ? spec.resource.id : 0;
  const { ready, value: isEnabled } = useFlag(isCustomDashboardsEnabledFlag, { universeId });
  const canMutateDashboards = useOptionalCanMutateCustomDashboards();
  const { isApiBacked } = useOptionalCustomDashboardsBackendState();
  const dashboardsListQuery = useDashboardsListQuery(universeId, {
    allowMissingProvider: true,
    enabled: isApiBacked,
  });
  const canEditCustomDashboards =
    isApiBacked && dashboardsListQuery.data?.canEditCustomDashboards === true;
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const label = tPendingTranslation(
    'Add to dashboard',
    'Button label that opens the custom dashboards picker from Explore Mode.',
    translationKey('Action.AddToDashboard', TranslationNamespace.Analytics),
  );
  const capturedTile = useMemo(
    () => (config ? captureChartTile(config, spec) : null),
    [config, spec],
  );

  return useMemo(
    () =>
      shouldShowAddChartToDashboardAction({
        areFlagsReady: ready,
        isCustomDashboardsEnabled: isEnabled === true,
        canEditCustomDashboards,
        canSaveLocalCustomDashboards: canMutateDashboards,
        hasCapturedTile: capturedTile !== null,
        resourceType: spec.resource.type.toString(),
      })
        ? ({
            id: 'add-to-dashboard',
            kind: 'custom',
            label,
            render: ({ closeMenu } = {}) => (
              <MenuItem
                onClick={() => {
                  requestOpen?.();
                  closeMenu?.();
                }}>
                {label}
              </MenuItem>
            ),
            renderOverlay: () => (
              <AddToDashboardPickerCta
                universeId={universeId}
                capturedTile={capturedTile}
                open={isOpen}
                onOpenChange={setIsOpen}
                onRequestOpenChange={handleRequestOpenChange}
                renderTrigger={() => null}
              />
            ),
          } satisfies ChartCardHeaderAction)
        : null,
    [
      capturedTile,
      canEditCustomDashboards,
      canMutateDashboards,
      handleRequestOpenChange,
      isEnabled,
      isOpen,
      label,
      ready,
      requestOpen,
      spec.resource.type,
      universeId,
    ],
  );
}
