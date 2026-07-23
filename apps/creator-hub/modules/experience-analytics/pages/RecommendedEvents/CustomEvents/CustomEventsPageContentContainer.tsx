import { LiveEventsDialogProvider } from '@modules/experience-analytics-shared';
import { RecommendedEventType } from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation } from '@rbx/intl';
import CustomEventsPageContent from './CustomEventsPageContent';

const CustomEventsPageContentContainer = () => {
  return (
    <LiveEventsDialogProvider defaultEventType={RecommendedEventType.CustomEvents}>
      <CustomEventsPageContent />
    </LiveEventsDialogProvider>
  );
};

export default withTranslation(CustomEventsPageContentContainer, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
]);
