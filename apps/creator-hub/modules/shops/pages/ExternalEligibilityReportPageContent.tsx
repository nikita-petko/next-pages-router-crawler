import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ExternalEligibilityReportTableContainer from '../external-eligibility/containers/ExternalEligibilityReportTableContainer';

type Props = { universeId: number };

function ExternalEligibilityReportPageContent({ universeId }: Props) {
  return (
    <main className='flex flex-col gap-large'>
      <ExternalEligibilityReportTableContainer universeId={universeId} />
    </main>
  );
}

export default withTranslation(ExternalEligibilityReportPageContent, [
  TranslationNamespace.Error,
  TranslationNamespace.Table,
  TranslationNamespace.Creations,
  TranslationNamespace.PersonalizedShop,
]);
