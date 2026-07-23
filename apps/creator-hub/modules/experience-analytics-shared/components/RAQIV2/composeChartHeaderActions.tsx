import { useCallback, useMemo, useState, type MouseEvent } from 'react';
import type { ChartCardHeaderAction } from '@rbx/analytics-ui';
import { useTranslation } from '@rbx/intl';
import { DownloadIcon } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type GenericCsvExporter from '@modules/charts-generic/charts/exporters/GenericCsvExporter';
import { useDownloadAction } from '@modules/charts-generic/charts/GenericChartExportButton';
import type { TimeSeriesAnnotation } from '@modules/charts-generic/charts/types/Annotations';
import type { ChartLocation } from '@modules/charts-generic/context/ChartLocation';
import { Link } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { ChartConfigOrPredefinedKey } from '../../constants/RAQIV2PredefinedChartConfig';
import useCreateAlertAction from '../../createAlert/useCreateAlertAction';
import emptyFunction from '../../emptyFunction';
import useExploreModeAction from '../../exploreMode/useExploreModeAction';
import useChartOverflowMenu from '../../hooks/useChartOverflowMenu';
import type RAQIV2ChartSpec from '../../types/RAQIV2ChartSpec';
import ChartOverflowMenu, {
  ChartSourceQueryDialog,
  ChartSourceQueryMenuItem,
} from '../ChartOverflowMenu';

export type ChartHeaderActionLayout = {
  readonly showExploreAction?: boolean;
  readonly showDownloadAction?: boolean;
  readonly showCreateAlertAction?: boolean;
};

const DEFAULT_LAYOUT: Required<ChartHeaderActionLayout> = {
  showExploreAction: true,
  showDownloadAction: true,
  showCreateAlertAction: true,
};

// Minimum number of secondary (non-explore) actions before they collapse into a
// single overflow / "More options" menu instead of rendering inline.
const MIN_ACTIONS_FOR_OVERFLOW_MENU = 2;

type UseExploreHeaderActionArgs = {
  readonly chartKeyOrConfig: ChartConfigOrPredefinedKey | null;
  readonly spec: RAQIV2ChartSpec;
  readonly visibleTimeSeriesAnnotations?: readonly TimeSeriesAnnotation[];
};

type UseDownloadHeaderActionArgs = {
  readonly kpiType: string;
  readonly exporter: GenericCsvExporter;
  readonly disabled?: boolean;
};

type UseDefaultChartHeaderActionsArgs = UseExploreHeaderActionArgs &
  UseDownloadHeaderActionArgs & {
    readonly chartLocation?: ChartLocation;
    readonly actionLayout?: ChartHeaderActionLayout;
  };

type ChartHeaderActionsByLayout = {
  readonly inlineAction: ChartCardHeaderAction;
  readonly menuAction: ChartCardHeaderAction;
};

type ExploreHeaderActionsByLayout = {
  readonly inlineAction?: ChartCardHeaderAction;
  readonly menuAction?: ChartCardHeaderAction;
};

export function useExploreHeaderAction({
  chartKeyOrConfig,
  spec,
  visibleTimeSeriesAnnotations,
}: UseExploreHeaderActionArgs): ExploreHeaderActionsByLayout {
  const exploreAction = useExploreModeAction(chartKeyOrConfig, spec, visibleTimeSeriesAnnotations);

  return useMemo(() => {
    if (!exploreAction) {
      return {};
    }

    const inlineAction: ChartCardHeaderAction = {
      id: 'explore',
      kind: 'button',
      label: exploreAction.label,
      onClick: exploreAction.onClick,
      tooltip: exploreAction.tooltip,
      renderButton: exploreAction.Wrapper
        ? ({ defaultButton }) => {
            const Wrapper = exploreAction.Wrapper;
            return Wrapper ? <Wrapper>{defaultButton}</Wrapper> : defaultButton;
          }
        : undefined,
    };

    const menuAction: ChartCardHeaderAction = exploreAction.href
      ? {
          id: 'explore',
          kind: 'link',
          label: exploreAction.label,
          href: exploreAction.href,
          tooltip: exploreAction.tooltip,
          testId: 'chart-overflow-explore',
        }
      : inlineAction;

    return { inlineAction, menuAction };
  }, [exploreAction]);
}

type UseCreateAlertHeaderActionArgs = {
  readonly spec: RAQIV2ChartSpec;
};

/**
 * Chart-header "Create alert" action. The deep link opens in a new browser tab
 * (inline button wraps the default button in a `target='_blank'` anchor; the
 * overflow entry is a `link` action carrying `target`/`rel`). Returns `{}` when
 * the user/universe/metric are not eligible, hiding the action entirely. The
 * metric and current selections are read from `spec`.
 */
export function useCreateAlertHeaderAction({
  spec,
}: UseCreateAlertHeaderActionArgs): ExploreHeaderActionsByLayout {
  const createAlertAction = useCreateAlertAction(spec);

  return useMemo(() => {
    if (!createAlertAction) {
      return {};
    }
    const { label, href } = createAlertAction;

    const inlineAction: ChartCardHeaderAction = {
      id: 'create-alert',
      kind: 'button',
      label,
      onClick: emptyFunction,
      testId: 'chart-create-alert-button',
      renderButton: ({ defaultButton }) => (
        <Link href={href} target='_blank' rel='noopener noreferrer' underline='none'>
          {defaultButton}
        </Link>
      ),
    };

    const menuAction: ChartCardHeaderAction = {
      id: 'create-alert',
      kind: 'link',
      label,
      href,
      target: '_blank',
      rel: 'noopener noreferrer',
      testId: 'chart-overflow-create-alert',
    };

    return { inlineAction, menuAction };
  }, [createAlertAction]);
}

export function useDownloadHeaderActions({
  kpiType,
  exporter,
  disabled,
}: UseDownloadHeaderActionArgs): ChartHeaderActionsByLayout {
  const downloadAction = useDownloadAction({ kpiType, exporter });
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const downloadCsvLabel = tPendingTranslation(
    'Download CSV',
    'Menu item label to download chart data as a CSV file.',
    translationKey('Action.ExploreMode.DownloadCsv', TranslationNamespace.Analytics),
  );

  return useMemo(
    () => ({
      inlineAction: {
        id: 'download',
        kind: 'button',
        label: downloadAction.tooltip ?? '',
        onClick: downloadAction.onClick,
        tooltip: downloadAction.tooltip,
        icon: <DownloadIcon fontSize='small' />,
        disabled,
        testId: 'chart-download-button',
      },
      menuAction: {
        id: 'download',
        kind: 'button',
        label: downloadCsvLabel,
        onClick: downloadAction.onClick,
        tooltip: downloadAction.tooltip,
        disabled,
        testId: 'chart-overflow-download-csv',
      },
    }),
    [disabled, downloadAction, downloadCsvLabel],
  );
}

export function useViewSourceQueryHeaderAction(spec: RAQIV2ChartSpec): ChartCardHeaderAction {
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const label = tPendingTranslation(
    'View source query',
    'Menu item label to view the source query for the chart.',
    translationKey('Action.ExploreMode.ViewSourceQuery', TranslationNamespace.Analytics),
  );
  const handleOpenSourceDialog = useCallback((event: MouseEvent, closeMenu?: () => void) => {
    event.stopPropagation();
    setSourceDialogOpen(true);
    closeMenu?.();
  }, []);
  const handleCloseSourceDialog = useCallback(() => {
    setSourceDialogOpen(false);
  }, []);

  return useMemo(
    () => ({
      id: 'view-source-query',
      kind: 'custom',
      label,
      render: ({ closeMenu } = {}) => (
        <ChartSourceQueryMenuItem onClick={(event) => handleOpenSourceDialog(event, closeMenu)} />
      ),
      renderOverlay: () => (
        <ChartSourceQueryDialog
          open={sourceDialogOpen}
          spec={spec}
          onClose={handleCloseSourceDialog}
        />
      ),
    }),
    [handleCloseSourceDialog, handleOpenSourceDialog, label, sourceDialogOpen, spec],
  );
}

export function useDefaultChartHeaderActions({
  chartKeyOrConfig,
  spec,
  kpiType,
  exporter,
  chartLocation,
  visibleTimeSeriesAnnotations,
  actionLayout,
  disabled,
}: UseDefaultChartHeaderActionsArgs): readonly ChartCardHeaderAction[] {
  const { showExploreAction, showDownloadAction, showCreateAlertAction } = {
    ...DEFAULT_LAYOUT,
    ...actionLayout,
  };
  const exploreActions = useExploreHeaderAction({
    chartKeyOrConfig,
    spec,
    visibleTimeSeriesAnnotations,
  });
  const createAlertActions = useCreateAlertHeaderAction({ spec });
  const downloadActions = useDownloadHeaderActions({ kpiType, exporter, disabled });
  const viewSourceAction = useViewSourceQueryHeaderAction(spec);

  const { translate } = useTranslationWrapper(useTranslation());
  const chartActionsMenuLabel = translate(
    translationKey('Action.ExploreMode.MoreOptions', TranslationNamespace.Analytics),
  );

  // Non-explore actions in display order, each carrying its inline-button and
  // menu-item variants. Explore always stays its own button; the remaining
  // actions collapse into a single insight-card style menu when there are 2+ of
  // them, otherwise a lone action renders inline.
  const secondaryActions = useMemo(() => {
    const result: {
      readonly inline: ChartCardHeaderAction;
      readonly menu: ChartCardHeaderAction;
    }[] = [];
    if (showCreateAlertAction && createAlertActions.inlineAction && createAlertActions.menuAction) {
      result.push({
        inline: createAlertActions.inlineAction,
        menu: createAlertActions.menuAction,
      });
    }
    if (showDownloadAction) {
      result.push({ inline: downloadActions.inlineAction, menu: downloadActions.menuAction });
    }
    return result;
  }, [
    createAlertActions.inlineAction,
    createAlertActions.menuAction,
    downloadActions.inlineAction,
    downloadActions.menuAction,
    showCreateAlertAction,
    showDownloadAction,
  ]);

  // Explore always renders as its own standalone inline button and never
  // collapses into the overflow / "More options" menu, even when the
  // chart-overflow-menu feature flags are enabled.
  const exploreInlineActions = useMemo(
    () => (showExploreAction && exploreActions.inlineAction ? [exploreActions.inlineAction] : []),
    [exploreActions.inlineAction, showExploreAction],
  );

  const inlineActions = useMemo(() => {
    if (secondaryActions.length >= MIN_ACTIONS_FOR_OVERFLOW_MENU) {
      const actionsMenu: ChartCardHeaderAction = {
        id: 'chart-actions-menu',
        kind: 'menu',
        label: chartActionsMenuLabel,
        items: secondaryActions.map((action) => action.menu),
        testId: 'chart-actions-menu-button',
        renderMenu: ({ action, items }) => <ChartOverflowMenu action={action} actions={items} />,
      };
      return [...exploreInlineActions, actionsMenu];
    }

    return [...exploreInlineActions, ...secondaryActions.map((action) => action.inline)];
  }, [chartActionsMenuLabel, exploreInlineActions, secondaryActions]);
  // Explore is intentionally excluded here so it stays a standalone button
  // rather than being folded into the overflow menu.
  const menuItems = useMemo(
    () =>
      [
        showCreateAlertAction ? createAlertActions.menuAction : undefined,
        showDownloadAction ? downloadActions.menuAction : undefined,
        viewSourceAction,
      ].filter((action): action is ChartCardHeaderAction => action !== undefined),
    [
      createAlertActions.menuAction,
      downloadActions.menuAction,
      showCreateAlertAction,
      showDownloadAction,
      viewSourceAction,
    ],
  );
  const overflowMenuAction = useChartOverflowMenu({
    actions: menuItems,
    chartLocation,
  });

  return useMemo(() => {
    return overflowMenuAction ? [...exploreInlineActions, overflowMenuAction] : inlineActions;
  }, [exploreInlineActions, inlineActions, overflowMenuAction]);
}
