import type { FC } from 'react';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ReadOnlyDashboardSurface from '../../components/ReadOnlyDashboardSurface';
import useDashboardSynthesis from '../../synthesis/useDashboardSynthesis';
import { EMPTY_DASHBOARD_CONFIG } from '../../types';
import { getEditorWorkingCopy } from '../../workingCopy/editorWorkingCopy';

type DashboardPreviewPageProps = {
  readonly draftId: string | undefined;
  readonly onBackToEditor: () => void;
};

function usePreviewTranslations() {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  return {
    bannerTitle: tPendingTranslation(
      'Draft preview',
      'Banner title shown on the custom dashboard preview page while rendering the saved draft working copy.',
      translationKey('Banner.CustomDashboards.Preview.Title', TranslationNamespace.Analytics),
    ),
    backToEditorLabel: tPendingTranslation(
      'Back to editor',
      'Button label on the custom dashboard preview page that returns to the dashboard editor.',
      translationKey(
        'Action.CustomDashboards.Preview.BackToEditor',
        TranslationNamespace.Analytics,
      ),
    ),
    notAvailableTitle: tPendingTranslation(
      "There's nothing to preview.",
      'Headline shown on the custom dashboard preview page when there is no in-memory draft session to preview (for example, a stale or direct preview link).',
      translationKey(
        'Message.CustomDashboards.Preview.NotAvailable',
        TranslationNamespace.Analytics,
      ),
    ),
    notAvailableDescription: tPendingTranslation(
      'Open a dashboard in the editor and select Preview to see your working copy here.',
      'Body copy shown beneath the custom dashboard preview not-available headline, directing the user to start a preview from the editor.',
      translationKey(
        'Description.CustomDashboards.Preview.NotAvailable',
        TranslationNamespace.Analytics,
      ),
    ),
  };
}

const DashboardPreviewPage: FC<DashboardPreviewPageProps> = ({ draftId, onBackToEditor }) => {
  const t = usePreviewTranslations();
  // The preview always reflects the in-memory working copy resolved from the
  // `draftId` query param. We deliberately do not fall back to the persisted /
  // published document: doing so renders the published config under the
  // "Draft preview" banner for stale or direct preview links, which is
  // misleading. Without a valid draft session there is nothing to preview.
  const workingCopy = getEditorWorkingCopy(draftId);
  const config = workingCopy?.config ?? EMPTY_DASHBOARD_CONFIG;
  const synthesis = useDashboardSynthesis(config);

  if (!workingCopy) {
    return (
      <div className='flex flex-col gap-small'>
        <p className='text-heading-small content-emphasis margin-none'>{t.notAvailableTitle}</p>
        <p className='text-body-medium content-muted margin-none'>{t.notAvailableDescription}</p>
        <div className='flex flex-row'>
          <Button variant='Standard' size='Medium' onClick={onBackToEditor}>
            {t.backToEditorLabel}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ReadOnlyDashboardSurface
      config={config}
      synthesis={synthesis}
      header={
        <header className='flex flex-col gap-small padding-medium bg-surface-100 radius-medium width-full'>
          <div className='flex flex-col small:flex-row small:items-center small:justify-between gap-medium width-full'>
            <div className='flex flex-col gap-xsmall min-width-0'>
              <p className='text-heading-small content-emphasis margin-none'>{t.bannerTitle}</p>
            </div>
            <div className='flex flex-row items-center gap-small shrink-0'>
              <Button variant='Standard' size='Medium' onClick={onBackToEditor}>
                {t.backToEditorLabel}
              </Button>
            </div>
          </div>
        </header>
      }
    />
  );
};

export default DashboardPreviewPage;
