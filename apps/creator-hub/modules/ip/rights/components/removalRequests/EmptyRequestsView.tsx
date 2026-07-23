import Link from 'next/link';
import { useTranslation, withTranslation } from '@rbx/intl';
import { AddIcon, Button } from '@rbx/ui';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import EmptyStateBorder from '@modules/miscellaneous/components/EmptyState/EmptyStateBorder';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { CREATE_REMOVAL_REQUEST_HREF, REPORT_CODE_REMOVAL_REQUESTS_HREF } from '../../urls';

function EmptyRequestsView() {
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
        title={translate('Heading.CreateFirstRemovalRequest')}
        size='small'
        description={translate('Description.CreateFirstRemovalRequest')}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href={CREATE_REMOVAL_REQUEST_HREF} passHref legacyBehavior>
            <Button variant='contained'>
              <AddIcon sx={{ marginRight: '8px' }} />
              {translate('Label.NewRemovalRequest')}
            </Button>
          </Link>
          {enableInExperienceIpReporting && (
            <Link href={REPORT_CODE_REMOVAL_REQUESTS_HREF} passHref legacyBehavior>
              <Button variant='contained' color='secondary'>
                {translate('Label.UseReportCode')}
              </Button>
            </Link>
          )}
        </div>
      </EmptyState>
    </EmptyStateBorder>
  );
}

export default withTranslation(EmptyRequestsView, [TranslationNamespace.RightsPortal]);
