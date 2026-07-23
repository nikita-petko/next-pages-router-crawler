import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import LegalAgreements from '@modules/legal-agreements/components/LegalAgreements';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { PrivacyPolicyLink, TermsOfUseLink } from '../../../../common/TermsOfUseLink';

function LegalForm() {
  const { ready, translate, translateHTML } = useTranslation();

  if (!ready) {
    return null;
  }

  return (
    <Grid container direction='column' spacing={3} minWidth='400px' width='100%'>
      <Grid item container direction='column' width='100%' spacing={0}>
        <Grid item>
          <Typography variant='h3'>{translate('Heading.LegalAgreements')}</Typography>
        </Grid>
        <Grid item container direction='column' spacing={3}>
          <LegalAgreements
            description={`${translate('Description.LegalAgreements')}*`}
            isSignatureRequired
            legalStatements={[
              {
                text: translate('Label.LegalStatementAccuracy'),
                id: 'accurateCheck',
              },
              {
                text: (
                  <Typography>
                    {translateHTML('Label.IPPlatformTOSandPPAgreement', [
                      {
                        opening: 'tosLinkStart',
                        closing: 'tosLinkEnd',
                        content(chunks) {
                          return <TermsOfUseLink>{chunks}</TermsOfUseLink>;
                        },
                      },
                      {
                        opening: 'ppLinkStart',
                        closing: 'ppLinkEnd',
                        content(chunks) {
                          return <PrivacyPolicyLink>{chunks}</PrivacyPolicyLink>;
                        },
                      },
                    ])}
                  </Typography>
                ),
                id: 'touCheck',
              },
            ]}
          />
        </Grid>
      </Grid>
    </Grid>
  );
}

export default withTranslation(LegalForm, [TranslationNamespace.RightsPortal]);
