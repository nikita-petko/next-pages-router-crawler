import { Button, Icon } from '@rbx/foundation-ui';
import { makeStyles } from '@rbx/ui';
import { useRouter } from 'next/router';
import { useCallback } from 'react';

import GenericNoDataPage from '@components/common/GenericNoDataPage';
import { AdIntegrationsDocsUrl } from '@constants/adIntegrationsUrls';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useAdAccountAutoCreateCreateAction from '@hooks/account/useAdAccountAutoCreateCreateAction';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

const useStyles = makeStyles()(() => ({
  pageContainer: {
    alignItems: 'flex-start',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
}));

const AdIntegrationsIcon = ({ className }: { className: string }) => (
  <Icon className={className} name='icon-regular-megaphone' size='XLarge' />
);

const AdIntegrationsLandingPage = () => {
  const router = useRouter();
  const { translate: translateAccount } = useNamespacedTranslation(TranslationNamespace.Account);
  const { translate: translateReport } = useNamespacedTranslation(TranslationNamespace.Report);
  const {
    classes: { pageContainer },
  } = useStyles();

  const navigateToCreate = useCallback(() => {
    router.push(Routes.AD_INTEGRATIONS_CREATE);
  }, [router]);
  const handleCreateClick = useAdAccountAutoCreateCreateAction(
    navigateToCreate,
    'adIntegrationsLanding',
  );

  return (
    <div className={pageContainer}>
      <GenericNoDataPage
        CustomIconComponent={AdIntegrationsIcon}
        outlined
        primaryButton={
          <Button onClick={handleCreateClick} size='Medium' variant='Emphasis'>
            {translateAccount('Action.RegisterAdIntegration')}
          </Button>
        }
        secondaryButton={
          <Button
            as='a'
            href={AdIntegrationsDocsUrl}
            rel='noopener noreferrer'
            size='Medium'
            target='_blank'
            variant='Standard'>
            {translateReport('Action.LearnMoreManage')}
          </Button>
        }
        subtitle={translateAccount('Description.AdIntegrationsLanding')}
        title={translateAccount('Heading.AdIntegrations')}
      />
    </div>
  );
};

export default AdIntegrationsLandingPage;
