import type { FunctionComponent } from 'react';
import React from 'react';
import type {
  V1Beta1AgeRecommendation as AgeRecommendation,
  V1Beta1CreatorOverrides as CreatorOverrides,
} from '@rbx/client-experience-guidelines-service/v1';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  Tooltip,
  Typography,
} from '@rbx/ui';

interface IncreaseMaturityButtonProps {
  disabled?: boolean;
  tooltipMsg?: string;
  onClick?: () => void;
}
const IncreaseMaturityButton: FunctionComponent<
  React.PropsWithChildren<IncreaseMaturityButtonProps>
> = ({ disabled, tooltipMsg, onClick }) => {
  const { translate } = useTranslation();

  let button = (
    <Button
      size='small'
      color='secondary'
      variant='contained'
      disabled={disabled}
      onClick={onClick}>
      {translate('Title.IncreaseMaturity') || 'Increase maturity'}
    </Button>
  );

  if (tooltipMsg !== undefined && disabled) {
    button = (
      <Tooltip data-testid='button-toolTip' title={tooltipMsg} arrow>
        <span>{button}</span>
      </Tooltip>
    );
  }

  return button;
};
interface IncreaseMaturityDialogProps {
  open: boolean;
  creatorOverrides: CreatorOverrides;
  onCancel: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  onSelectionChange: (event: React.ChangeEvent<HTMLInputElement>, value: string) => void;
  selected: string;
}

const IncreaseMaturityDialog: FunctionComponent<
  React.PropsWithChildren<IncreaseMaturityDialogProps>
> = ({ open, creatorOverrides, onCancel, onSubmit, isSubmitting, onSelectionChange, selected }) => {
  const { translate } = useTranslation();

  return (
    <Dialog open={open} maxWidth='Medium' onClose={onCancel}>
      <DialogTitle>
        {translate('Title.IncreaseMaturityDialog') ||
          'Please indicate your preferred Content Maturity'}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id='dialog-content-text-describe-id'>
          <Typography align='center'>
            {translate('Message.IncreaseMaturityDialog') ||
              'The content maturity label displayed for your experience will always be the higher label between the questionnaire result and the content maturity label selected here.'}
          </Typography>
        </DialogContentText>
        <RadioGroup value={selected} onChange={onSelectionChange}>
          {creatorOverrides?.allowedCreatorOverratedAgeRecommendations &&
            creatorOverrides?.allowedCreatorOverratedAgeRecommendations?.map(
              (ageRecommendation: AgeRecommendation) => {
                return (
                  <FormControlLabel
                    key={ageRecommendation.displayName}
                    value={ageRecommendation.minimumAge}
                    label={
                      <Typography variant='body1' color='primary'>
                        {ageRecommendation.displayName}
                      </Typography>
                    }
                    control={<Radio aria-label={ageRecommendation.displayName as string} />}
                  />
                );
              },
            )}
          <FormControlLabel
            value='-1'
            label={
              <Typography variant='body1' color='primary'>
                Use questionnaire result
              </Typography>
            }
            control={<Radio aria-label='Use questionnaire result' />}
          />
        </RadioGroup>
      </DialogContent>
      <DialogActions>
        <Button
          size='large'
          variant='contained'
          aria-label='Cancel'
          color='secondary'
          onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size='large'
          variant='contained'
          aria-label={translate('Button.Submit')}
          color='primaryBrand'
          loading={isSubmitting}
          onClick={onSubmit}>
          {translate('Button.Submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export { IncreaseMaturityButton, IncreaseMaturityDialog };
