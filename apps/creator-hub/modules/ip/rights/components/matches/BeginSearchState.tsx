import { useTranslation, withTranslation } from '@rbx/intl';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import EmptyStateBorder from '@modules/miscellaneous/components/EmptyState/EmptyStateBorder';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const BeginSearchState = ({ source }: { source: string }) => {
  const { translate, ready } = useTranslation();

  const title =
    source === 'avatar'
      ? translate('Heading.SearchAvatarResults')
      : translate('Heading.SearchDevelopmentResults');

  const description =
    source === 'avatar'
      ? translate('Description.SearchAvatarResults')
      : translate('Description.SearchDevelopmentResults');

  if (!ready) {
    return null;
  }
  return (
    <EmptyStateBorder>
      <EmptyState title={title} description={description} size='small' />
    </EmptyStateBorder>
  );
};

export default withTranslation(BeginSearchState, [TranslationNamespace.RightsPortal]);
