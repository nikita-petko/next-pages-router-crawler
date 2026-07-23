import React from 'react';
import LegalAgreements from '@modules/legal-agreements/components/LegalAgreements';
import { Grid } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

// LegalForm displays 3rd page of the dispute form that requires legal agreements and signature
function LegalForm() {
  const { ready, translate } = useTranslation();

  if (!ready) {
    return null;
  }
  return (
    <Grid container item XSmall={12} rowSpacing={2} direction='column'>
      <LegalAgreements
        isSignatureRequired
        signatureWidth='100%'
        legalStatements={[
          {
            text: translate('Description.DisputeStatement1'),
            id: 'reviewCheck',
          },
          {
            text: translate('Description.DisputeStatement2'),
            id: 'fraudCheck',
          },
        ]}
      />
    </Grid>
  );
}

export default withTranslation(LegalForm, [TranslationNamespace.RightsPortal]);
