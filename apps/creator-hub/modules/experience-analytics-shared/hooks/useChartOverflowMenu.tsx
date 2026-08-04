import { useMemo } from 'react';
import type { ChartCardHeaderAction } from '@rbx/analytics-ui';
import { useTranslation } from '@rbx/intl';
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
}: UseChartOverflowMenuParams): ChartCardHeaderAction | undefined => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  const moreOptionsLabel = tPendingTranslation(
    'More options',
    'Aria label for the more options menu button.',
    translationKey('Action.ExploreMode.MoreOptions', TranslationNamespace.Analytics),
  );

  return useMemo(() => {
    if (!actions.length) {
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
  }, [actions, moreOptionsLabel]);
};

export default useChartOverflowMenu;
