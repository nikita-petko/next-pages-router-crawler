import { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import type { FormattedText } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { UniverseSessionExitReason } from '@modules/clients/analytics/universeSessionMetadataApi';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export type ClientSessionStatusLabels = {
  readonly [UniverseSessionExitReason.Active]: FormattedText;
  readonly [UniverseSessionExitReason.Ended]: FormattedText;
  readonly [UniverseSessionExitReason.Crashed]: FormattedText;
};

// Consumers must register TranslationNamespace.ServerManagement.
const useClientSessionStatusLabels = (): ClientSessionStatusLabels => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  return useMemo(
    () => ({
      [UniverseSessionExitReason.Active]: tPendingTranslation(
        'Active',
        'Client session status when the session is ongoing.',
        translationKey('Label.ClientSessionStatus.Active', TranslationNamespace.ServerManagement),
      ),
      [UniverseSessionExitReason.Ended]: tPendingTranslation(
        'Ended',
        'Client session status when the session has finished.',
        translationKey('Label.ClientSessionStatus.Ended', TranslationNamespace.ServerManagement),
      ),
      [UniverseSessionExitReason.Crashed]: tPendingTranslation(
        'Crashed',
        'Client session status when the session crashed.',
        translationKey('Label.ClientSessionStatus.Crashed', TranslationNamespace.ServerManagement),
      ),
    }),
    [tPendingTranslation],
  );
};

export default useClientSessionStatusLabels;
