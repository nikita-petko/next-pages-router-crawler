import React, { FunctionComponent } from 'react';
import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import { FeedbackBanner } from '@rbx/foundation-ui';
import { Grid, Link, Typography } from '@rbx/ui';
import {
  AgeVerificationUpsellBanner,
  AgeVerificationUpsellPage,
} from '@modules/age-verification-upsell/components/AgeVerificationUpsellBanner';
import { useAgeVerificationUpsellContext } from '@modules/age-verification-upsell/context/AgeVerificationUpsellContext';
import { useSettings } from '@modules/settings';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useCollaborators from '../hooks/useCollaborators';
import CollaboratorsList from './CollaboratorsList';

const SafetyCollaboratorsPage: FunctionComponent = () => {
  const { translate, translateHTML } = useTranslation();
  const router = useRouter();
  const {
    params: { enableImpactedExperiencesView },
  } = useIXPParameters(IXPLayers.CreatorDashboard);
  const universeId = Number(router.query.id);
  const collaboratorsData = useCollaborators(universeId);
  const isTrustedConnectionsRequired =
    collaboratorsData.isLoading ||
    collaboratorsData.error != null ||
    collaboratorsData.friends.length > 0 ||
    collaboratorsData.others.length > 0;
  const { isBannerEligible } = useAgeVerificationUpsellContext();
  const isShowingSuccessBanner = !isTrustedConnectionsRequired;

  const { settings } = useSettings();

  if (!enableImpactedExperiencesView) {
    return null;
  }

  return (
    <Grid
      container
      wrap='nowrap'
      direction='column'
      sx={{ display: 'flex', flexDirection: 'column' }}>
      {isBannerEligible && !isShowingSuccessBanner && (
        <AgeVerificationUpsellBanner trackingPage={AgeVerificationUpsellPage.Creations} />
      )}
      {isShowingSuccessBanner && (
        <div className='margin-bottom-medium'>
          <FeedbackBanner
            title={translate('Label.AllSetCollaborators')}
            layout='Inline'
            variant='Standard'
            severity='Success'
          />
        </div>
      )}
      {!isShowingSuccessBanner && (
        <Typography variant='body1' sx={{ marginBottom: '16px' }}>
          {translateHTML('Label.AddTrustedConnectionsToCollaborate2', [
            {
              opening: 'LinkStart',
              closing: 'LinkEnd',
              content(chunks) {
                return (
                  <Link
                    sx={{ color: 'inherit !important', textDecoration: 'underline' }}
                    href={settings.impactedExperiencesTrustedLearnMoreUrl}
                    target='_blank'
                    rel='noopener noreferrer'>
                    {chunks}
                  </Link>
                );
              },
            },
          ])}
        </Typography>
      )}
      {isTrustedConnectionsRequired && universeId > 0 && (
        <CollaboratorsList data={collaboratorsData} />
      )}
    </Grid>
  );
};

export default withTranslation(SafetyCollaboratorsPage, [TranslationNamespace.Creations]);
