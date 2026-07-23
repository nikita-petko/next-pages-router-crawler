import { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { useSnackbar, Alert, Typography } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { ExperimentApiErrorType } from '../../api/universeExperimentationClientEnums';
import ExperimentOperationErrorTranslationKey from '../../utils/experimentOperationErrorTranslation';

const useShowErrorMessageInToast = () => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { enqueue } = useSnackbar();

  return useCallback(
    (error: ExperimentApiErrorType | FormattedText) => {
      enqueue({
        children: (
          <div>
            <Alert severity='error' variant='filled'>
              <Typography component='alert-description'>
                {isValidEnumValue(ExperimentApiErrorType, error)
                  ? translate(ExperimentOperationErrorTranslationKey[error])
                  : error}
              </Typography>
            </Alert>
          </div>
        ),
        autoHide: true,
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
      });
    },
    [enqueue, translate],
  );
};

export default useShowErrorMessageInToast;
