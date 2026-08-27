import type { FunctionComponent, ReactNode } from 'react';
import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { CreatorTierEnum } from '@rbx/client-core-content-api/v1';
import { Alert } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Link, Typography } from '@rbx/ui';
import Authenticated from '@modules/authentication/Authenticated';
import { PageLoading } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import PublishingPermissionsTable from '../components/PublishingPermissionsTable';
import type { PublishPermissionRequirementView, PublishingTier } from '../constants/displayCopy';
import { idVerificationActionUrl } from '../constants/tiers';
import { usePublishPermissions } from '../hooks/usePublishPermissions';
import { mapPublishPermissionsToView } from '../utils/mapPublishPermissionsToView';

const learnMoreLinkChunks = [
  {
    opening: 'linkStart',
    closing: 'linkEnd',
    content: (chunks: ReactNode) => (
      <Link
        className='underline content-inherit'
        href='https://devforum.roblox.com/t/new-publishing-requirements-evaluation-process-for-games/4573166'
        target='_blank'>
        {chunks}
      </Link>
    ),
  },
];

const resolveTierCopy = (
  keys: Record<PublishingTier, string>,
  translate: (key: string) => string,
): Record<PublishingTier, string> => ({
  [CreatorTierEnum.Private]: translate(keys[CreatorTierEnum.Private]),
  [CreatorTierEnum.Trusted]: translate(keys[CreatorTierEnum.Trusted]),
  [CreatorTierEnum.Everyone]: translate(keys[CreatorTierEnum.Everyone]),
});

const PublishingPermissionsPageContent: FunctionComponent = () => {
  const router = useRouter();
  const { ready: areTranslationsReady, translate, translateHTML } = useTranslation();
  const overrideUserId = useMemo(() => {
    const rawOverrideOwnerId = router.query.override_ownerId;
    const overrideOwnerId = Array.isArray(rawOverrideOwnerId)
      ? rawOverrideOwnerId[0]
      : rawOverrideOwnerId;

    if (!overrideOwnerId) {
      return undefined;
    }

    const parsedOverrideOwnerId = Number(overrideOwnerId);
    if (!Number.isInteger(parsedOverrideOwnerId) || parsedOverrideOwnerId <= 0) {
      return undefined;
    }

    return parsedOverrideOwnerId;
  }, [router.query.override_ownerId]);

  const {
    data: publishPermissionsResponse,
    isPending,
    isError,
    refetch,
  } = usePublishPermissions({
    overrideUserId,
  });

  const publishPermissions = useMemo(
    () =>
      publishPermissionsResponse
        ? mapPublishPermissionsToView(publishPermissionsResponse)
        : undefined,
    [publishPermissionsResponse],
  );

  const tableProps = useMemo(() => {
    if (!publishPermissions) {
      return undefined;
    }

    const requirements: PublishPermissionRequirementView[] = publishPermissions.requirements.map(
      (requirement) => ({
        ...requirement,
        label: translate(requirement.labelKey),
        description: translate(requirement.descriptionKey),
        actionUrl: requirement.actionUrl,
      }),
    );

    return {
      ageBracket: publishPermissions.ageBracket,
      currentTier: publishPermissions.currentTier,
      tierOrder: publishPermissions.tierOrder,
      tierLabels: resolveTierCopy(publishPermissions.tierLabelKeys, translate),
      tierDescriptions: resolveTierCopy(publishPermissions.tierDescriptionKeys, translate),
      requirements,
    };
  }, [publishPermissions, translate]);

  if (!areTranslationsReady || isPending) {
    return <PageLoading />;
  }

  return (
    <Authenticated>
      {isError || !publishPermissions || !tableProps ? (
        <FailureView
          message={translate('Message.FailedToLoadPage')}
          buttonText={translate('Action.FailedToLoadPage')}
          onReload={() => refetch()}
        />
      ) : (
        <div className='flex flex-col gap-small'>
          <Typography variant='body1' color='secondary' className='text-body-medium'>
            {translateHTML('Description.PublishingPermissionsWithLearnMore', learnMoreLinkChunks)}
          </Typography>
          {publishPermissions.approvalBannerKey && (
            <Alert
              severity='Success'
              variant='Feedback'
              hasCloseAffordance={false}
              className='margin-top-medium'>
              {translate(publishPermissions.approvalBannerKey)}
            </Alert>
          )}
          {publishPermissions.showPlusEligibilityBanner && (
            <Alert
              severity='Success'
              variant='Feedback'
              hasCloseAffordance={false}
              primaryActionLabel={translate('Action.ViewDetails')}
              className='margin-top-medium'
              onPrimaryAction={() => {
                window.location.href = 'https://devforum.roblox.com/new-publishing-requirements';
              }}>
              {translate('Message.PlusSubscriptionEligibility')}
            </Alert>
          )}
          {publishPermissions.showParentLinkExpirationBanner && (
            <Alert
              severity='Warning'
              variant='Feedback'
              hasCloseAffordance={false}
              primaryActionLabel={translate('Action.Start')}
              className='margin-top-medium'
              onPrimaryAction={() => window.open(idVerificationActionUrl, '_blank')}>
              {translate('Message.LinkedParentGraduationV2')}
            </Alert>
          )}
          <PublishingPermissionsTable {...tableProps} />
        </div>
      )}
    </Authenticated>
  );
};

export default withTranslation(PublishingPermissionsPageContent, [
  TranslationNamespace.PublicPublish,
  TranslationNamespace.Navigation,
]);
