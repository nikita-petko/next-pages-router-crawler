import React from 'react';
import Link from 'next/link';
import { Button, Grid } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { EmptyState, EmptyStateBorder } from '@modules/miscellaneous/common/components';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { useRouter } from 'next/router';
import { CreateClaimsURL } from '../createClaims/CreateClaimsContainer';
import { ReportCodeUrlClaims } from '../reportCodes/ReportCodeContainer';

export interface EmptyClaimsViewProps {
  disableCreateClaim?: boolean;
}

/**
 * EmptyClaimsView shows some text explaining how to create a new claim and a button do it.
 *  */
const EmptyClaimsView = ({ disableCreateClaim }: EmptyClaimsViewProps) => {
  const router = useRouter();
  const { ready, translate } = useTranslation();

  const {
    isFetched: isIXPFetched,
    params: { enableInExperienceIpReporting },
  } = useIXPParameters(IXPLayers.RightsManager, { restoreInitialValueFromCache: true });

  if (!ready || !isIXPFetched) {
    return null;
  }

  return (
    <EmptyStateBorder>
      <EmptyState
        title={translate('Heading.CreateNewClaim')}
        size='small'
        description={translate('Label.FileAClaim')}>
        <Grid item sx={{ display: 'flex', gap: '8px' }}>
          <Button
            variant='contained'
            onClick={() => router.push(CreateClaimsURL)}
            disabled={disableCreateClaim}>
            {translate('Label.NewClaim')}
          </Button>
          {enableInExperienceIpReporting && (
            <Link href={ReportCodeUrlClaims} passHref legacyBehavior>
              <Button variant='contained' color='secondary'>
                {translate('Label.UseReportCode')}
              </Button>
            </Link>
          )}
        </Grid>
      </EmptyState>
    </EmptyStateBorder>
  );
};

export default withTranslation(EmptyClaimsView, [TranslationNamespace.RightsPortal]);
