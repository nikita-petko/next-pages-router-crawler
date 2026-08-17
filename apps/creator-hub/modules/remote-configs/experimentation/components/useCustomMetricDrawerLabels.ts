import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { CustomMetricCategory } from '../types/CustomMetric';
import { CustomMetricCalculation } from '../types/CustomMetricCalculation';
import type { PrimarySelectionField } from '../utils/customMetricDraft';

export type CustomMetricDrawerLabels = {
  addTitle: string;
  editTitle: string;
  definition: string;
  sourceLabel: string;
  sourcePlaceholder: string;
  categoryLabel: Record<CustomMetricCategory, string>;
  // Keyed by primary-selection field (currency / funnel / funnelStep /
  // customEvent) so each selection — including funnel step — has its own copy.
  primaryLabel: Record<PrimarySelectionField, string>;
  primaryPlaceholder: Record<PrimarySelectionField, string>;
  calculationLabel: string;
  calculationPlaceholder: string;
  calculationOption: Record<CustomMetricCalculation, string>;
  nameLabel: string;
  namePlaceholder: string;
  nameHint: string;
  save: string;
  cancel: string;
  resetAll: string;
};

/**
 * All user-facing copy for the custom-metric drawer body, resolved via
 * `tPendingTranslation` (copy isn't finalized, so the keys are intentionally
 * unregistered). Extracted from {@link CustomMetricDrawer} so the sizeable
 * per-category / per-calculation label maps don't clutter the render. Each
 * calculation and source keeps its own key so they can be localized
 * independently.
 */
const useCustomMetricDrawerLabels = (): CustomMetricDrawerLabels => {
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());

  return {
    addTitle: tPendingTranslation(
      'Add custom metric',
      'Title of the drawer when adding a new custom metric.',
      translationKey(
        'Title.ExperimentCreation.AddCustomMetricDrawer',
        TranslationNamespace.UniverseConfigAndExperimentation,
      ),
    ),
    editTitle: tPendingTranslation(
      'Edit custom metric',
      'Title of the drawer when editing an existing custom metric.',
      translationKey(
        'Title.ExperimentCreation.EditCustomMetric',
        TranslationNamespace.UniverseConfigAndExperimentation,
      ),
    ),
    definition: tPendingTranslation(
      'Definition',
      'Heading for the definition section of the custom metric drawer.',
      translationKey(
        'Label.ExperimentCreation.CustomMetricDefinition',
        TranslationNamespace.UniverseConfigAndExperimentation,
      ),
    ),
    sourceLabel: tPendingTranslation(
      'Source',
      'Label for the source (category) dropdown in the custom metric drawer.',
      translationKey(
        'Label.ExperimentCreation.CustomMetricSource',
        TranslationNamespace.UniverseConfigAndExperimentation,
      ),
    ),
    sourcePlaceholder: tPendingTranslation(
      'Select source',
      'Placeholder for the source dropdown in the custom metric drawer.',
      translationKey(
        'Placeholder.ExperimentCreation.CustomMetricSource',
        TranslationNamespace.UniverseConfigAndExperimentation,
      ),
    ),
    categoryLabel: {
      [CustomMetricCategory.Economy]: tPendingTranslation(
        'Economy',
        'Economy source option in the custom metric drawer.',
        translationKey(
          'Label.CustomMetricSource.Economy',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      ),
      [CustomMetricCategory.Funnel]: tPendingTranslation(
        'Funnel',
        'Funnel source option in the custom metric drawer.',
        translationKey(
          'Label.CustomMetricSource.Funnel',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      ),
      [CustomMetricCategory.Custom]: tPendingTranslation(
        'Custom',
        'Custom source option in the custom metric drawer.',
        translationKey(
          'Label.CustomMetricSource.Custom',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      ),
    },
    primaryLabel: {
      currency: tPendingTranslation(
        'Currency',
        'Label for the currency selection in the economy custom metric drawer.',
        translationKey(
          'Label.ExperimentCreation.CustomMetricCurrency',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      ),
      funnel: tPendingTranslation(
        'Funnel',
        'Label for the funnel selection in the funnel custom metric drawer.',
        translationKey(
          'Label.ExperimentCreation.CustomMetricFunnel',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      ),
      funnelStep: tPendingTranslation(
        'Funnel step',
        'Label for the funnel step selection in the funnel custom metric drawer.',
        translationKey(
          'Label.ExperimentCreation.CustomMetricFunnelStep',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      ),
      customEvent: tPendingTranslation(
        'Event type',
        'Label for the event type selection in the custom event metric drawer.',
        translationKey(
          'Label.ExperimentCreation.CustomMetricEventType',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      ),
    },
    primaryPlaceholder: {
      currency: tPendingTranslation(
        'Select currency',
        'Placeholder for the currency selection in the economy custom metric drawer.',
        translationKey(
          'Placeholder.ExperimentCreation.CustomMetricCurrency',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      ),
      funnel: tPendingTranslation(
        'Select funnel',
        'Placeholder for the funnel selection in the funnel custom metric drawer.',
        translationKey(
          'Placeholder.ExperimentCreation.CustomMetricFunnel',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      ),
      funnelStep: tPendingTranslation(
        'Select step',
        'Placeholder for the funnel step selection in the funnel custom metric drawer.',
        translationKey(
          'Placeholder.ExperimentCreation.CustomMetricFunnelStep',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      ),
      customEvent: tPendingTranslation(
        'Select event type',
        'Placeholder for the event type selection in the custom event metric drawer.',
        translationKey(
          'Placeholder.ExperimentCreation.CustomMetricEventType',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      ),
    },
    calculationLabel: tPendingTranslation(
      'Calculation',
      'Label for the calculation dropdown in the custom metric drawer.',
      translationKey(
        'Label.ExperimentCreation.CustomMetricCalculation',
        TranslationNamespace.UniverseConfigAndExperimentation,
      ),
    ),
    calculationPlaceholder: tPendingTranslation(
      'Select calculation',
      'Placeholder for the calculation dropdown in the custom metric drawer.',
      translationKey(
        'Placeholder.ExperimentCreation.CustomMetricCalculation',
        TranslationNamespace.UniverseConfigAndExperimentation,
      ),
    ),
    calculationOption: {
      [CustomMetricCalculation.AverageCustomValue]: tPendingTranslation(
        'Average Custom Value',
        'Custom-event calculation: average custom value across users who logged the event.',
        translationKey(
          'Label.CustomMetricCalculation.AverageCustomValue',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      ),
      [CustomMetricCalculation.AverageCustomValueAllUsers]: tPendingTranslation(
        'Average Custom Value over all Users',
        'Custom-event calculation: average custom value across all enrolled users.',
        translationKey(
          'Label.CustomMetricCalculation.AverageCustomValueAllUsers',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      ),
      [CustomMetricCalculation.CustomPenetration]: tPendingTranslation(
        'Custom Penetration %',
        'Custom-event calculation: share of enrolled users who logged the event at least once.',
        translationKey(
          'Label.CustomMetricCalculation.CustomPenetration',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      ),
      [CustomMetricCalculation.AverageNetCurrencyDelta]: tPendingTranslation(
        'Average Net Currency Delta',
        'Economy calculation: average net currency change (sources minus sinks) per user.',
        translationKey(
          'Label.CustomMetricCalculation.AverageNetCurrencyDelta',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      ),
      [CustomMetricCalculation.AverageCurrencySourceDelta]: tPendingTranslation(
        'Average Currency Source Delta',
        'Economy calculation: average currency gained (sources) per user.',
        translationKey(
          'Label.CustomMetricCalculation.AverageCurrencySourceDelta',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      ),
      [CustomMetricCalculation.AverageCurrencySinkDelta]: tPendingTranslation(
        'Average Currency Sink Delta',
        'Economy calculation: average currency spent (sinks) per user.',
        translationKey(
          'Label.CustomMetricCalculation.AverageCurrencySinkDelta',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      ),
      [CustomMetricCalculation.PerUserFunnelConversion]: tPendingTranslation(
        'Per-User Funnel Conversion %',
        'Funnel calculation: per-user funnel completion rate.',
        translationKey(
          'Label.CustomMetricCalculation.PerUserFunnelConversion',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      ),
      [CustomMetricCalculation.PerInstanceFunnelConversion]: tPendingTranslation(
        'Per-Instance Funnel Conversion %',
        'Funnel calculation: per-instance (session) funnel completion rate.',
        translationKey(
          'Label.CustomMetricCalculation.PerInstanceFunnelConversion',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      ),
    },
    nameLabel: tPendingTranslation(
      'Metric name',
      'Label for the metric name field in the custom metric drawer.',
      translationKey(
        'Label.ExperimentCreation.CustomMetricName',
        TranslationNamespace.UniverseConfigAndExperimentation,
      ),
    ),
    namePlaceholder: tPendingTranslation(
      'Metric name',
      'Placeholder for the metric name field in the custom metric drawer.',
      translationKey(
        'Placeholder.ExperimentCreation.CustomMetricName',
        TranslationNamespace.UniverseConfigAndExperimentation,
      ),
    ),
    nameHint: tPendingTranslation(
      'Auto-generated based on your selections. You can edit or reset this anytime.',
      'Helper text under the metric name field in the custom metric drawer.',
      translationKey(
        'Message.ExperimentCreation.CustomMetricNameHint',
        TranslationNamespace.UniverseConfigAndExperimentation,
      ),
    ),
    save: translate(translationKey('Action.Save', TranslationNamespace.Controls)),
    cancel: translate(translationKey('Action.Cancel', TranslationNamespace.Controls)),
    resetAll: tPendingTranslation(
      'Reset all',
      'Button that resets all fields in the custom metric drawer.',
      translationKey(
        'Action.ExperimentCreation.ResetCustomMetric',
        TranslationNamespace.UniverseConfigAndExperimentation,
      ),
    ),
  };
};

export default useCustomMetricDrawerLabels;
