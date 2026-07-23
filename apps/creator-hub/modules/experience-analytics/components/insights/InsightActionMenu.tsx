import type { FC } from 'react';
import { useMemo } from 'react';
import type { FormattedText } from '@modules/analytics-translations/types';
import GenericActionMenu from '@modules/experience-analytics-shared/components/GenericActionMenu';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const SNOOZE_DURATION = 14;

type InsightActionMenuProps = {
  onSnooze?: () => void;
  actionText?: FormattedText;
  useVerticalIcon?: boolean;
};

const InsightActionMenu: FC<InsightActionMenuProps> = ({
  onSnooze,
  actionText,
  useVerticalIcon = false,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const actions = useMemo(() => {
    if (!onSnooze) {
      return [];
    }

    return [
      {
        text:
          actionText ??
          translate(
            {
              key: 'Action.SnoozeV2',
              namespace: TranslationNamespace.Insights,
            },
            { value: SNOOZE_DURATION.toLocaleString() },
          ),
        onClick: onSnooze,
      },
    ];
  }, [actionText, onSnooze, translate]);

  if (!onSnooze) {
    return null;
  }

  return <GenericActionMenu actions={actions} useVerticalIcon={useVerticalIcon} />;
};

export default InsightActionMenu;
