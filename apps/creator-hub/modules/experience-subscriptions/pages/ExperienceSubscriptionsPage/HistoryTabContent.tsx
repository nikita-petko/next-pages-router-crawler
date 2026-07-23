import { AnalyticsTabContentLayout } from '@modules/experience-analytics-shared';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ExperienceSubscriptionsHistoryTable from '../../components/ExperienceSubscriptionsHistoryTable';

function HistoryTabContent() {
  return (
    <AnalyticsTabContentLayout controls={[]}>
      <ExperienceSubscriptionsHistoryTable />
    </AnalyticsTabContentLayout>
  );
}

export default withTranslation(HistoryTabContent, [
  TranslationNamespace.ExperienceSubscriptions,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.Analytics,
]);
