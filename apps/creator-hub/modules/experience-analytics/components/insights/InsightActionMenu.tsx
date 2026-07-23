import React, { FC, useMemo } from 'react';
import {
  useRAQIV2TranslationDependencies,
  GenericActionMenu,
} from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { FormattedText } from '@modules/analytics-translations';

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
