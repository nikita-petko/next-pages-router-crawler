import { useTranslation, withTranslation } from '@rbx/intl';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import EmptyStateBorder from '@modules/miscellaneous/components/EmptyState/EmptyStateBorder';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

/**
 * EmptyClaimsAgainstMeView shows some text explaining that you have no claims against you
 *  */
const EmptyClaimsAgainstMeView = () => {
  const { ready, translate } = useTranslation();

  if (!ready) {
    return null;
  }

  return (
    <EmptyStateBorder>
      <EmptyState
        title={translate('Heading.NoClaimsAgainstYou')}
        size='small'
        description={translate('Description.NoClaimsAgainstYou')}
      />
    </EmptyStateBorder>
  );
};

export default withTranslation(EmptyClaimsAgainstMeView, [TranslationNamespace.RightsPortal]);
