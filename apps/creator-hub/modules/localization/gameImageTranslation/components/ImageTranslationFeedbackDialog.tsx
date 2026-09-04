import type { ChangeEvent, FunctionComponent } from 'react';
import { useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  CloseIcon,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Input,
  Radio,
  RadioGroup,
  Typography,
} from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { imageTranslationFeedbackReasons } from '../constants';
import useImageTranslationFeedbackDialogStyles from './ImageTranslationFeedbackDialog.styles';

export interface ImageTranslationFeedbackPayload {
  reasonId: string;
  additionalDetails: string;
}

export interface ImageTranslationFeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmitFeedback?: (payload: ImageTranslationFeedbackPayload) => void;
}

const ImageTranslationFeedbackDialog: FunctionComponent<ImageTranslationFeedbackDialogProps> = ({
  open,
  onClose,
  onSubmitFeedback,
}) => {
  const translation = useTranslation();
  const { translateWithNamespace } = translation;
  const [selectedReasonId, setSelectedReasonId] = useState<string | null>(null);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const {
    classes: {
      dialogPaper,
      dialogPaperWide,
      titleBar,
      divider,
      footer,
      feedbackSection,
      problemPrompt,
      requiredMark,
      radioList,
      radioRow,
      radio,
      detailsHeading,
      detailsInput,
    },
  } = useImageTranslationFeedbackDialogStyles();

  // Reset the form each time the dialog opens. Adjusting state during render (instead of an effect)
  // is the React-recommended pattern and avoids cascading effect renders.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSelectedReasonId(null);
      setAdditionalDetails('');
    }
  }

  const canSubmit = selectedReasonId !== null;

  const handleSubmit = (): void => {
    if (selectedReasonId === null) {
      return;
    }
    onSubmitFeedback?.({
      reasonId: selectedReasonId,
      additionalDetails: additionalDetails.trim(),
    });
    onClose();
  };

  return (
    <Dialog
      fullWidth
      open={open}
      PaperProps={{ className: `${dialogPaper} ${dialogPaperWide}` }}
      onClose={onClose}>
      <DialogTitle component='div' className={titleBar}>
        <Typography variant='subtitle1'>
          {translateWithNamespace(
            TranslationNamespace.GameImageTranslation,
            'Label.GiveRobloxFeedback',
          )}
        </Typography>
        <IconButton
          aria-label={translateWithNamespace(
            TranslationNamespace.GameStringTranslation,
            'Label.Close',
          )}
          edge='end'
          size='large'
          onClick={onClose}>
          <CloseIcon color='secondary' fontSize='large' />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <fieldset className={feedbackSection}>
          <Typography className={problemPrompt} component='legend' variant='largeLabel2'>
            {translateWithNamespace(
              TranslationNamespace.GameImageTranslation,
              'Description.FeedbackProblemPrompt',
            )}
            <Typography className={requiredMark} component='span' variant='largeLabel2'>
              *
            </Typography>
          </Typography>
          <RadioGroup
            className={radioList}
            value={selectedReasonId ?? ''}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setSelectedReasonId(event.target.value)
            }>
            {imageTranslationFeedbackReasons.map((option) => (
              <FormControlLabel
                key={option.id}
                className={radioRow}
                value={option.id}
                control={
                  <Radio
                    aria-label={translateWithNamespace(
                      TranslationNamespace.GameImageTranslation,
                      option.labelKey,
                    )}
                    className={radio}
                    color='primary'
                    size='medium'
                  />
                }
                label={
                  <Typography variant='body1'>
                    {translateWithNamespace(
                      TranslationNamespace.GameImageTranslation,
                      option.labelKey,
                    )}
                  </Typography>
                }
              />
            ))}
          </RadioGroup>

          <div className={detailsHeading}>
            <Typography component='label' variant='largeLabel2' htmlFor='image-feedback-details'>
              {translateWithNamespace(
                TranslationNamespace.GameImageTranslation,
                'Label.AdditionalDetails',
              )}
            </Typography>
          </div>
          <Input
            className={detailsInput}
            disableUnderline
            fullWidth
            id='image-feedback-details'
            minRows={4}
            multiline
            placeholder={translateWithNamespace(
              TranslationNamespace.GameImageTranslation,
              'Description.FeedbackDetailsPlaceholder',
            )}
            value={additionalDetails}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setAdditionalDetails(event.target.value)
            }
          />
        </fieldset>
      </DialogContent>

      <Divider className={divider} />
      <DialogActions className={footer}>
        <Button color='secondary' variant='outlined' onClick={onClose}>
          {translateWithNamespace(TranslationNamespace.GameStringTranslation, 'Label.Cancel')}
        </Button>
        <Button
          color='primaryBrand'
          disabled={!canSubmit}
          variant='contained'
          onClick={handleSubmit}>
          {translateWithNamespace(TranslationNamespace.GameImageTranslation, 'Action.Submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageTranslationFeedbackDialog;
