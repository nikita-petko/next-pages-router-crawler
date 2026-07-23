import { useMemo } from 'react';
import { z } from 'zod';

import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

export const VERIFY_EMAIL_FIELD = 'email';

const useVerifyEmailSchema = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Account);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  return useMemo(
    () =>
      z.object({
        [VERIFY_EMAIL_FIELD]: z
          .email(translate('Validation.InvalidEmailFormat'))
          .min(
            1,
            translateMisc('Validation.FieldRequired', { fieldName: translate('Label.Email') }),
          ),
      }),
    [translate, translateMisc],
  );
};

export type VerifyEmailFieldValues = z.infer<ReturnType<typeof useVerifyEmailSchema>>;

export default useVerifyEmailSchema;
