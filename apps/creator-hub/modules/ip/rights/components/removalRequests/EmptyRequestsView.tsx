import React from 'react';
import { AddIcon, Button } from '@rbx/ui';
import Link from 'next/link';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { EmptyStateBorder, EmptyState } from '@modules/miscellaneous/common/components';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { CreateRemovalRequestURL } from '../createRemovalRequest/CreateRemovalRequestContainer';
import { ReportCodeUrlRemovalRequests } from '../reportCodes/ReportCodeContainer';

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
          <Link href={CreateRemovalRequestURL} passHref legacyBehavior>
            <Button variant='contained'>
              <AddIcon sx={{ marginRight: '8px' }} />
              {translate('Label.NewRemovalRequest')}
            </Button>
          </Link>
          {enableInExperienceIpReporting && (
            <Link href={ReportCodeUrlRemovalRequests} passHref legacyBehavior>
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
