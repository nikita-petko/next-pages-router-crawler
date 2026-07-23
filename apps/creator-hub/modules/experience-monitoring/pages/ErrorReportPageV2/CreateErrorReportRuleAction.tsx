import type { FC } from 'react';
import { useCallback, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { AnalyticsPageAction } from '@modules/charts-generic/layout/AnalyticsPageAction';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useUniverseRegexesQuery } from '../../hooks/useUniverseRegexes';
import ErrorReportRuleFormDialog from './ErrorReportRuleFormDialog';

/**
 * Self-contained "Create rule" header action for the Error Report Rules tab.
 * Owns its own dialog open state and renders the create dialog; the rules
 * table refreshes via query invalidation on success, so no shared state with
 * the tab content is required.
 */
const CreateErrorReportRuleAction: FC = () => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { id: universeId } = useUniverseResource();
  const { data: rules, isSuccess } = useUniverseRegexesQuery({ universeId });
  const [isOpen, setIsOpen] = useState(false);

  const openDialog = useCallback(() => setIsOpen(true), []);
  const closeDialog = useCallback(() => setIsOpen(false), []);

  const label = translate(
    translationKey('Action.Button.CreateRule', TranslationNamespace.Analytics),
  );

  if (isSuccess && (rules?.length ?? 0) === 0) {
    return null;
  }

  return (
    <>
      <AnalyticsPageAction text={label} onClick={openDialog} />
      <ErrorReportRuleFormDialog open={isOpen} existingRules={rules} onClose={closeDialog} />
    </>
  );
};

export default CreateErrorReportRuleAction;
