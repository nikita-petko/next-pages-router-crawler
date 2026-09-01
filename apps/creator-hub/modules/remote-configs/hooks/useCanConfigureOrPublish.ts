import { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import type { FormattedText } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useUniversePermissions } from '@modules/react-query/organizations';

export type CanConfigureResult = {
  canConfigure: boolean;
  canPublish: boolean;
  configureErrorMessage: FormattedText | undefined;
  publishErrorMessage: FormattedText | undefined;
};

const useCanConfigureOrPublish = (): CanConfigureResult => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { canConfigure, gameDetails } = useCurrentGame();
  const { data: permissions } = useUniversePermissions(gameDetails?.id);

  return useMemo(() => {
    return {
      canConfigure: !!canConfigure,
      configureErrorMessage: canConfigure
        ? undefined
        : translate(
            translationKey(
              'Label.NoPermissionToConfigureUniverse',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          ),
      canPublish: !!permissions?.publish,
      publishErrorMessage: permissions?.publish
        ? undefined
        : translate(
            translationKey(
              'Label.NoPermissionToPublishUniverse',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          ),
    };
  }, [canConfigure, permissions?.publish, translate]);
};

export default useCanConfigureOrPublish;
