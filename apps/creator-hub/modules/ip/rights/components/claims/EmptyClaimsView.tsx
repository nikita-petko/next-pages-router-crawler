import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, Grid } from '@rbx/ui';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import EmptyStateBorder from '@modules/miscellaneous/components/EmptyState/EmptyStateBorder';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { CREATE_CLAIMS_HREF, REPORT_CODE_CLAIMS_HREF } from '../../urls';

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
            onClick={() => router.push(CREATE_CLAIMS_HREF)}
            disabled={disableCreateClaim}>
            {translate('Label.NewClaim')}
          </Button>
          {enableInExperienceIpReporting && (
            <Link href={REPORT_CODE_CLAIMS_HREF} passHref legacyBehavior>
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
