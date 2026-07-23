import type { FC } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCustomDashboardService } from '../service/CustomDashboardServiceProvider';

function useInternalSandboxBannerTranslations() {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  return {
    title: tPendingTranslation(
      'Internal sandbox',
      'Title for a custom dashboards banner shown to internal users in hybrid local-copy mode.',
      translationKey(
        'Banner.CustomDashboards.InternalSandbox.Title',
        TranslationNamespace.Analytics,
      ),
    ),
    description: tPendingTranslation(
      "Server dashboards are read-only. Edits create local copies that stay in this browser and never write to the creator's server dashboard.",
      'Description for a custom dashboards banner explaining internal local-copy sandbox behavior.',
      translationKey(
        'Banner.CustomDashboards.InternalSandbox.Description',
        TranslationNamespace.Analytics,
      ),
    ),
  };
}

const InternalSandboxBanner: FC = () => {
  const service = useCustomDashboardService();
  const t = useInternalSandboxBannerTranslations();

  if (!service.forkApiDashboardToLocal) {
    return null;
  }

  return (
    <aside className='radius-medium bg-surface-100 stroke-standard stroke-default padding-medium'>
      <div className='flex flex-col gap-xxsmall'>
        <p className='text-label-medium content-emphasis margin-none'>{t.title}</p>
        <p className='text-body-small content-muted margin-none'>{t.description}</p>
      </div>
    </aside>
  );
};

export default InternalSandboxBanner;
