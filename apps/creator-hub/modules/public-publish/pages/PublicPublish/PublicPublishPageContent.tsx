import React, { FunctionComponent } from 'react';
import { Grid, Link, Typography } from '@rbx/ui';
import { PageLoading, urls } from '@modules/miscellaneous/common';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import EligibilityRow, { EligibilityStatus } from '@modules/eligibility/components/EligibilityRow';
import { useGetActivationEligibilityForUser } from '@modules/react-query/develop';
import Authenticated from '@modules/authentication/Authenticated';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';

const PublicPublishPageContent: FunctionComponent = () => {
  const { ready: areTranslationsReady, translate, translateHTML } = useTranslation();

  const {
    data: activationEligibility,
    isLoading,
    isError,
    refetch,
  } = useGetActivationEligibilityForUser();

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
      <Grid container>
        <Grid item mb={3} XSmall={12}>
          <Typography variant='h1' component='h1'>
            {translate('Heading.PublicPublish')}
          </Typography>
        </Grid>
        {!activationEligibility?.isEligible && (
          <Grid item mb={3} XSmall={12}>
            <Typography variant='h2' component='h2' mb={1}>
              {translate('Heading.PublishRequirements')}
            </Typography>
            <Typography variant='body1' component='p'>
              {translateHTML('Description.PublicPublishPrerequisites', [
                {
                  opening: 'strongStart',
                  closing: 'strongEnd',
                  content(chunks: React.ReactNode) {
                    return <strong>{chunks}</strong>;
                  },
                },
                {
                  opening: 'linkStart',
                  closing: 'linkEnd',
                  content(chunks: React.ReactNode) {
                    return (
                      <Link
                        href='https://create.roblox.com/docs/production/publishing/publish-experiences-and-places#make-experience-public'
                        target='_blank'>
                        {chunks}
                      </Link>
                    );
                  },
                },
              ])}
            </Typography>
          </Grid>
        )}
        {activationEligibility?.isEligible ? (
          <Grid container ml={2} mt={1} gap={2} XSmall={12}>
            <Grid item XSmall={12}>
              <EligibilityRow
                headerText={translate('Heading.EligibleToPublish')}
                descriptionText={translate('Description.EligibleToPublish')}
                status={EligibilityStatus.Completed}
              />
            </Grid>
          </Grid>
        ) : (
          <Grid container ml={2} mt={1} gap={4} XSmall={12}>
            <Grid item XSmall={12}>
              <EligibilityRow
                headerText={translate('Heading.IdVerifiedIncomplete')}
                descriptionText={translate('Description.IdVerified')}
                status={EligibilityStatus.Warning}
                linkText={translate('Action.VerifyId')}
                onClickLink={() => {
                  unifiedLoggerClient.logClickEvent({
                    eventName: 'clickVerifyId',
                  });
                  window.open(urls.www.getAccountSettingsUrl());
                }}
                isOpenInNewLink
              />
            </Grid>
            <Grid item XSmall={12}>
              <EligibilityRow
                headerText={translate('Heading.HasTransactionsIncomplete')}
                descriptionText={translate('Description.HasTransactions')}
                status={EligibilityStatus.Warning}
              />
            </Grid>
          </Grid>
        )}
      </Grid>
    </Authenticated>
  );
};

export default withTranslation(PublicPublishPageContent, [
  TranslationNamespace.PublicPublish,
  TranslationNamespace.Navigation,
]);
