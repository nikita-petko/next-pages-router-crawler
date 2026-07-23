import React, { FunctionComponent, useMemo } from 'react';
import { Link, Typography } from '@rbx/ui';
import { FeedbackBanner } from '@rbx/foundation-ui';
import { PageLoading } from '@modules/miscellaneous/common';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import Authenticated from '@modules/authentication/Authenticated';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { CreatorEligibilityEnum } from '@rbx/clients/coreContentApi';
import { useCreatorEligibility } from '../hooks/useCreatorEligibility';
import PublishingPermissionsTable from '../components/PublishingPermissionsTable';

const PublishingPermissionsPageContent: FunctionComponent = () => {
  const { ready: areTranslationsReady, translate, translateHTML } = useTranslation();
  const { data: completedRequirements, isLoading, isError, refetch } = useCreatorEligibility();

  const isEligibleForPlus = useMemo(() => {
    if (!completedRequirements) return false;
    return new Set(completedRequirements).has(CreatorEligibilityEnum.HasRobloxPremium);
  }, [completedRequirements]);

  if (!areTranslationsReady || isLoading) {
    return <PageLoading />;
  }

  if (isError) {
    return (
      <Authenticated>
        <FailureView
          message={translate('Message.FailedToLoadPage')}
          buttonText={translate('Action.FailedToLoadPage')}
          onReload={() => refetch()}
        />
      </Authenticated>
    );
  }

  return (
    <Authenticated>
      <div className='flex flex-col gap-small'>
        <Typography variant='h1' component='h1'>
          {translate('Heading.PublishingPermissions')}
        </Typography>
        <Typography variant='body1' color='secondary' className='text-body-medium'>
          {translateHTML('Description.PublishingPermissionsWithLearnMore', [
            {
              opening: 'linkStart',
              closing: 'linkEnd',
              content(chunks: React.ReactNode) {
                return (
                  <Link
                    href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/promotion/content-maturity`}
                    target='_blank'>
                    {chunks}
                  </Link>
                );
              },
            },
          ])}
        </Typography>
        {isEligibleForPlus && (
          <FeedbackBanner
            title=''
            description={translate('Message.PlusSubscriptionEligibility')}
            severity='Success'
            variant='Emphasis'
            layout='Inline'
            primaryActionLabel={translate('Action.ViewDetails')}
            className='margin-top-medium'
            onPrimaryAction={() => {
              window.location.href = 'https://devforum.roblox.com/new-publishing-requirements';
            }}
          />
        )}
        <PublishingPermissionsTable completedRequirements={completedRequirements ?? []} />
      </div>
    </Authenticated>
  );
};

export default withTranslation(PublishingPermissionsPageContent, [
  TranslationNamespace.PublicPublish,
  TranslationNamespace.Navigation,
]);
