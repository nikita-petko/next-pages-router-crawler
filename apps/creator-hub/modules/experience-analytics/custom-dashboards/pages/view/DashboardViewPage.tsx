import { type FC, useCallback, useState } from 'react';
import { OverflowTitle } from '@rbx/analytics-ui';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useAuthentication } from '@modules/authentication/providers';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import CustomDashboardBreadcrumbRegistration from '../../components/CustomDashboardBreadcrumbRegistration';
import DashboardTitleActionHeader, {
  DASHBOARD_TITLE_ACTION_HEADER_ACTION_GROUP_CLASS,
} from '../../components/DashboardTitleActionHeader';
import InternalSandboxBanner from '../../components/InternalSandboxBanner';
import LocalCopyBadge from '../../components/LocalCopyBadge';
import ReadOnlyDashboardSurface from '../../components/ReadOnlyDashboardSurface';
import {
  useCanMutateCustomDashboards,
  useCustomDashboardService,
} from '../../service/CustomDashboardServiceProvider';
import useDashboardSynthesis from '../../synthesis/useDashboardSynthesis';
import { EMPTY_DASHBOARD_CONFIG } from '../../types';
import useDashboardDocumentQuery from '../edit/hooks/useDashboardDocumentQuery';

type DashboardViewPageProps = {
  readonly universeId: number;
  readonly dashboardId: string | undefined;
  readonly onBackToManage: () => void;
  readonly onEditDashboard: (dashboardId: string) => void;
};

function useDashboardViewTranslations() {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  return {
    editDashboardLabel: tPendingTranslation(
      'Edit',
      'Action label that opens the dashboard editor.',
      translationKey('Action.Edit', TranslationNamespace.Analytics),
    ),
    editAsLocalCopyLabel: tPendingTranslation(
      'Edit as local copy',
      'Button label on the custom dashboard view page shown to internal users for server dashboards; it creates a browser-local copy before opening the editor.',
      translationKey(
        'Action.CustomDashboards.View.EditAsLocalCopy',
        TranslationNamespace.Analytics,
      ),
    ),
    loadError: tPendingTranslation(
      "Couldn't load this dashboard.",
      'Inline error shown when the published custom dashboard view page cannot load the dashboard.',
      translationKey('Error.CustomDashboards.View.LoadFailed', TranslationNamespace.Analytics),
    ),
    localCopyError: tPendingTranslation(
      "Couldn't create a local copy.",
      'Inline error shown when an internal user tries to edit a server dashboard as a local copy and the copy fails.',
      translationKey('Error.CustomDashboards.View.LocalCopyFailed', TranslationNamespace.Analytics),
    ),
    loadErrorCtaLabel: tPendingTranslation(
      'Manage dashboards',
      'Button label on a failed custom dashboard view that returns to the dashboard list.',
      translationKey(
        'Action.CustomDashboards.View.BackToDashboards',
        TranslationNamespace.Analytics,
      ),
    ),
  };
}

const DashboardViewPage: FC<DashboardViewPageProps> = ({
  universeId,
  dashboardId,
  onBackToManage,
  onEditDashboard,
}) => {
  const t = useDashboardViewTranslations();
  const service = useCustomDashboardService();
  const canMutateDashboards = useCanMutateCustomDashboards();
  const { user } = useAuthentication();
  const documentQuery = useDashboardDocumentQuery(universeId, dashboardId);
  const document = documentQuery.data ?? null;
  const config = document?.config ?? EMPTY_DASHBOARD_CONFIG;
  const synthesis = useDashboardSynthesis(config);
  const [editError, setEditError] = useState<unknown>(null);

  const handleEditDashboard = useCallback(() => {
    if (!document || !canMutateDashboards) {
      return;
    }
    if (document.hybridOrigin !== 'server' || !service.forkApiDashboardToLocal) {
      onEditDashboard(document.id);
      return;
    }
    if (!user) {
      setEditError(new Error('User information is still loading.'));
      return;
    }
    service
      .forkApiDashboardToLocal(universeId, document.id, {
        createdByUserId: user.id,
        createdByUsername: user.name,
      })
      .then((localCopy) => {
        onEditDashboard(localCopy.id);
      })
      .catch((error: unknown) => {
        setEditError(error);
      });
  }, [canMutateDashboards, document, onEditDashboard, service, universeId, user]);

  if (documentQuery.isLoading) {
    return <output aria-busy='true' className='width-full min-height-[240px]' />;
  }

  if (documentQuery.isError || !document) {
    return (
      <div role='alert' className='flex flex-col gap-small'>
        <p className='text-body-medium content-muted margin-none'>{t.loadError}</p>
        <Button variant='Standard' size='Medium' onClick={onBackToManage}>
          {t.loadErrorCtaLabel}
        </Button>
      </div>
    );
  }

  return (
    <ReadOnlyDashboardSurface
      config={config}
      synthesis={synthesis}
      header={
        <header className='flex flex-col gap-medium width-full'>
          <CustomDashboardBreadcrumbRegistration dashboardName={document.name} />
          <InternalSandboxBanner />
          <DashboardTitleActionHeader
            title={
              <div className='flex items-center gap-small min-width-0 max-width-full'>
                <OverflowTitle
                  as='h1'
                  text={document.name}
                  className='text-heading-large content-emphasis margin-none text-truncate-end'
                />
                {document.hybridOrigin === 'localCopy' ? <LocalCopyBadge /> : null}
              </div>
            }
            actions={
              <>
                <div className={DASHBOARD_TITLE_ACTION_HEADER_ACTION_GROUP_CLASS}>
                  {canMutateDashboards ? (
                    <Button variant='Emphasis' size='Medium' onClick={handleEditDashboard}>
                      {document.hybridOrigin === 'server' && service.forkApiDashboardToLocal
                        ? t.editAsLocalCopyLabel
                        : t.editDashboardLabel}
                    </Button>
                  ) : null}
                </div>
                {editError ? (
                  <p role='alert' className='text-body-small content-system-alert margin-none'>
                    {t.localCopyError}
                  </p>
                ) : null}
              </>
            }
          />
        </header>
      }
    />
  );
};

export default DashboardViewPage;
