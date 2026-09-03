import { Alert } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { PresetStatus } from '../types';

const openGuidelinesDoc = () => {
  window.open('https://create.roblox.com/docs/chat/preset-system-guidelines', '_blank');
};

type PublishStatusBannerProps = {
  overallStatus: PresetStatus;
};

// TODO (EXPR-4049): Add error banner for publish failures (rate limit, server errors)
export function PublishStatusBanner({ overallStatus }: PublishStatusBannerProps) {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  if (overallStatus === 'PUBLISHING') {
    return (
      <Alert
        severity='Info'
        variant='Feedback'
        hasCloseAffordance={false}
        primaryActionLabel={tPendingTranslation(
          'Learn more',
          'A link to the Preset system guidelines.',
          translationKey('Action.LearnMore', TranslationNamespace.PresetChat),
        )}
        onPrimaryAction={openGuidelinesDoc}>
        {tPendingTranslation(
          'Your Quick Words are being reviewed.',
          'Info banner shown while Quick Words are being published',
          translationKey('Info.Publishing', TranslationNamespace.PresetChat),
        )}
      </Alert>
    );
  }

  if (overallStatus === 'FAILED_PUBLISH') {
    return (
      <Alert
        severity='Error'
        variant='Feedback'
        hasCloseAffordance={false}
        primaryActionLabel={tPendingTranslation(
          'Learn more',
          'A link to the Preset system guidelines.',
          translationKey('Action.LearnMore', TranslationNamespace.PresetChat),
        )}
        onPrimaryAction={openGuidelinesDoc}>
        {tPendingTranslation(
          "Some of your Quick Words weren't approved. Rewrite or delete those and publish again.",
          'Banner shown when some Quick Words fail safety review after publishing',
          translationKey('Error.FailedPublish', TranslationNamespace.PresetChat),
        )}
      </Alert>
    );
  }

  return null;
}
