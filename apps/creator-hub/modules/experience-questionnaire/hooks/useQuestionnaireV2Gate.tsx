import { useMemo } from 'react';
import { useSettings, FeatureFlagName } from '@modules/settings';
import useSettingsWhitelist from '@modules/miscellaneous/hooks/useSettingsWhitelist';

const useQuestionnaireV2Gate = (): { shouldUseV2: boolean; isFetched: boolean } => {
  const { settings, isFetched } = useSettings();
  const inAllowlist = useSettingsWhitelist(
    FeatureFlagName.questionnaireV2Allowlist as keyof typeof settings,
  );

  const shouldUseV2 = useMemo(
    () => isFetched && (settings.questionnaireV2Q1Release || inAllowlist),
    [isFetched, settings.questionnaireV2Q1Release, inAllowlist],
  );

  return { shouldUseV2, isFetched };
};

export default useQuestionnaireV2Gate;
