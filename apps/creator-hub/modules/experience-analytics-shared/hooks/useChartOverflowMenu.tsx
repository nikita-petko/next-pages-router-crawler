import { useMemo } from 'react';
import type { ChartCardHeaderAction } from '@rbx/analytics-ui';
import { useFlag } from '@rbx/flags';
import { useTranslation } from '@rbx/intl';
import {
  isAssistantChartOverflowMenuEnabled as isAssistantChartOverflowMenuEnabledFlag,
  isChartOverflowMenuEnabled as isChartOverflowMenuEnabledFlag,
} from '@generated/flags/creatorAnalytics';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { ChartLocation } from '@modules/charts-generic/context/ChartLocation';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ChartOverflowMenu from '../components/ChartOverflowMenu';

type UseChartOverflowMenuParams = {
  readonly actions: readonly ChartCardHeaderAction[];
  readonly chartLocation?: ChartLocation;
};

const useChartOverflowMenu = ({
  actions,
  chartLocation,
}: UseChartOverflowMenuParams): ChartCardHeaderAction | undefined => {
  const { ready: isChartOverflowMenuReady, value: isChartOverflowMenuEnabledValue } = useFlag(
    isChartOverflowMenuEnabledFlag,
  );
  const {
    ready: isAssistantChartOverflowMenuReady,
    value: isAssistantChartOverflowMenuEnabledValue,
  } = useFlag(isAssistantChartOverflowMenuEnabledFlag);
  const isFetched = isChartOverflowMenuReady && isAssistantChartOverflowMenuReady;
  const isChartOverflowMenuEnabled = isChartOverflowMenuReady && isChartOverflowMenuEnabledValue;
  const isAssistantChartOverflowMenuEnabled =
    isAssistantChartOverflowMenuReady && isAssistantChartOverflowMenuEnabledValue;
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  const showMenu =
    isFetched &&
    (isChartOverflowMenuEnabled ||
      (isAssistantChartOverflowMenuEnabled && chartLocation === 'assistant'));

  const moreOptionsLabel = tPendingTranslation(
    'More options',
    'Aria label for the more options menu button.',
    translationKey('Action.ExploreMode.MoreOptions', TranslationNamespace.Analytics),
  );

  return useMemo(() => {
    if (!showMenu || !actions.length) {
      return undefined;
    }

    return {
      id: 'chart-overflow-menu',
      kind: 'menu',
      label: moreOptionsLabel,
      items: actions,
      testId: 'chart-overflow-menu-button',
      renderMenu: ({ action, items }) => <ChartOverflowMenu action={action} actions={items} />,
    };
  }, [actions, moreOptionsLabel, showMenu]);
};

export default useChartOverflowMenu;
