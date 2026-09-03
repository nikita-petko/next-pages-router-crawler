import { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import type { FormattedText } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export type SessionBrowserFilterLabels = {
  readonly hasBugReportLabel: FormattedText;
  readonly deviceRamLabel: FormattedText;
  readonly durationLabel: FormattedText;
  readonly minFpsLabel: FormattedText;
  readonly usedMemoryLabel: FormattedText;
  readonly exitReasonLabel: FormattedText;
};

const useSessionBrowserFilterLabels = (): SessionBrowserFilterLabels => {
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());

  return useMemo(
    () => ({
      hasBugReportLabel: tPendingTranslation(
        'Has bug report',
        'Filter for client sessions that include a bug report.',
        translationKey('Label.HasBugReport', TranslationNamespace.ServerManagement),
      ),
      deviceRamLabel: tPendingTranslation(
        'Memory capacity',
        'Filter for device RAM in megabytes.',
        translationKey('Label.MemoryCapacity', TranslationNamespace.ServerManagement),
      ),
      durationLabel: translate(
        translationKey(
          'Label.ClientSessionBrowserSessionDuration',
          TranslationNamespace.ServerManagement,
        ),
      ),
      minFpsLabel: translate(
        translationKey('Label.ClientSessionMetadataMinFps', TranslationNamespace.ServerManagement),
      ),
      usedMemoryLabel: translate(
        translationKey(
          'Label.ClientSessionBrowserMaxMemoryUsage',
          TranslationNamespace.ServerManagement,
        ),
      ),
      exitReasonLabel: tPendingTranslation(
        'Exit reason',
        'Filter for how a client session ended.',
        translationKey('Label.ExitReason', TranslationNamespace.ServerManagement),
      ),
    }),
    [tPendingTranslation, translate],
  );
};

export default useSessionBrowserFilterLabels;
