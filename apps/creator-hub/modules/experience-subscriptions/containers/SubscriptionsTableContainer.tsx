import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress, Typography } from '@rbx/ui';
import { EmptyGrid } from '@modules/miscellaneous/common';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { useRouter } from 'next/router';
import { useUniversePermissions } from '@modules/react-query/organizations';
import { useLoadInitialSubscriptions } from '../hooks/usePaginatedSubscriptions';
import SubscriptionsTable from '../components/SubscriptionsTable';
import SubscriptionsTableEmptyState from '../components/SubscriptionsTableEmptyState';

type Props = {
  universeId: number;
};

function SubscriptionsTableContainer({ universeId }: Props) {
  const { translate } = useTranslation();
  const { data: permissions, isLoading: isLoadingPermissions } = useUniversePermissions(universeId);
  const { isInitialLoading, isInitialError, isEmpty } = useLoadInitialSubscriptions({
    universeId,
  });

  const router = useRouter();

  if (isLoadingPermissions || isInitialLoading) {
    return (
      <EmptyGrid>
        <Typography color='secondary' align='center'>
          <CircularProgress />
        </Typography>
      </EmptyGrid>
    );
  }

  if (isInitialError) {
    return (
      <FailureView
        message={translate('Message.LoadItemsError', {
          itemType: translate('Label.Subscriptions'),
        })}
        onReload={router.reload}
      />
    );
  }

  if (permissions?.monetizeExperience === false) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (isEmpty) {
    return <SubscriptionsTableEmptyState />;
  }

  return <SubscriptionsTable universeId={universeId} />;
}

export default withTranslation(SubscriptionsTableContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.Navigation,
  TranslationNamespace.Table,
  TranslationNamespace.ExperienceSubscriptions,
]);
