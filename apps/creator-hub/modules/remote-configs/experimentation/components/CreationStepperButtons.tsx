import { Button, Grid, Typography } from '@rbx/ui';
import { Flex } from '@modules/miscellaneous/common/components';
import React, { FC } from 'react';
import {
  translationKey,
  TranslationKey,
  useTranslationWrapper,
} from '@modules/analytics-translations';
import { useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const CreationStepperButtons: FC<{
  isCancelButtonDisabled?: boolean;
  cancelButtonVariant?: 'text' | 'contained';
  onCancel: () => void;
  isPrevButtonDisabled?: boolean;
  onPrev?: () => void;
  isSubmitButtonDisabled?: boolean;
  isSubmitButtonLoading?: boolean;
  submitButtonLabelTranslationKey?: TranslationKey;
  message?: string;
}> = ({
  onCancel,
  onPrev,
  isCancelButtonDisabled,
  cancelButtonVariant = 'text',
  isPrevButtonDisabled,
  isSubmitButtonDisabled,
  isSubmitButtonLoading,
  submitButtonLabelTranslationKey,
  message,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());

  return (
    <Grid item marginTop={4}>
      <Flex flexDirection='row' gap={8} justifyContent='flex-start'>
        <Button
          data-testid='cancel-button'
          variant={cancelButtonVariant}
          color='secondary'
          onClick={onCancel}
          disabled={isCancelButtonDisabled}>
          {translate(
            translationKey(
              'Action.ExperimentCreation.Cancel',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
        </Button>
        {onPrev && (
          <Button
            data-testid='back-button'
            variant='contained'
            color='secondary'
            onClick={onPrev}
            disabled={isPrevButtonDisabled}>
            {translate(
              translationKey(
                'Action.ExperimentCreation.Back',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
            )}
          </Button>
        )}
        <Button
          data-testid='submit-button'
          variant='contained'
          color='primaryBrand'
          disabled={isSubmitButtonDisabled}
          type='submit'
          loading={isSubmitButtonLoading}>
          {submitButtonLabelTranslationKey
            ? translate(submitButtonLabelTranslationKey)
            : translate(
                translationKey(
                  'Action.ExperimentCreation.Next',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              )}
        </Button>
        {message && (
          <Typography variant='body2' alignSelf='center' marginLeft='4px'>
            {message}
          </Typography>
        )}
      </Flex>
    </Grid>
  );
};
export default CreationStepperButtons;
