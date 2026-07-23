import { useTranslation } from '@rbx/intl';
import EmptyState from '../../components/EmptyState/EmptyState';

export default function AccessDeniedAgeOrReasonPage() {
  const { translate } = useTranslation();
  return (
    <EmptyState
      size='large'
      illustration='noPermissions'
      title={translate('Description.AccessDeniedAgeOrRegion')}
      description={translate('Label.AccessDeniedAgeOrRegion')}
    />
  );
}
