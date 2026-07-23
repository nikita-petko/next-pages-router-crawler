import React, { useCallback } from 'react';
import { useSnackbar, Alert, Typography } from '@rbx/ui';
import { FormattedText, useTranslationWrapper } from '@modules/analytics-translations';
import { useTranslation } from '@rbx/intl';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import ExperimentOperationErrorTranslationKey from '../../utils/experimentOperationErrorTranslation';
import { ExperimentApiErrorType } from '../../api/universeExperimentationClientEnums';

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
