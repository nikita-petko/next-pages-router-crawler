import { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { UniverseSessionDataAvailability } from '@modules/clients/analytics/universeSessionMetadataApi';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export type ClientSessionDataAvailabilityLabels = Record<UniverseSessionDataAvailability, string>;

// Consumers must register TranslationNamespace.ServerManagement.
const useClientSessionDataAvailabilityLabels = (): ClientSessionDataAvailabilityLabels => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  return useMemo(
    () => ({
      [UniverseSessionDataAvailability.Logs]: tPendingTranslation(
        'Client logs',
        'Data availability label indicating a session has client logs.',
        translationKey(
          'Label.ClientSessionDataAvailability.Logs',
          TranslationNamespace.ServerManagement,
        ),
      ),
      [UniverseSessionDataAvailability.MicroProfiler]: tPendingTranslation(
        'MicroProfiler dump',
        'Data availability label indicating a session has a MicroProfiler dump.',
        translationKey(
          'Label.ClientSessionDataAvailability.MicroProfiler',
          TranslationNamespace.ServerManagement,
        ),
      ),
      [UniverseSessionDataAvailability.SceneAnalysisSnapshot]: tPendingTranslation(
        'Scene analysis snapshot',
        'Data availability label indicating a session has a scene analysis snapshot.',
        translationKey(
          'Label.ClientSessionDataAvailability.SceneAnalysisSnapshot',
          TranslationNamespace.ServerManagement,
        ),
      ),
    }),
    [tPendingTranslation],
  );
};

export default useClientSessionDataAvailabilityLabels;
