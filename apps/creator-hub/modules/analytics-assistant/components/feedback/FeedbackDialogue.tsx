import type { FC } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { FeedbackRating } from '@rbx/conv-ai-provider';
import {
  Dialog,
  DialogTitle,
  Typography,
  DialogContent,
  Grid,
  Button,
  TextField,
  DialogActions,
  FormControlLabel,
  CircularProgress,
  Radio,
  FormControl,
  FormLabel,
  RadioGroup,
} from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { createAnalyticsAssistantFeedback } from '@modules/clients/analytics';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { FeedbackOption } from '../../constants/AssistantSummaryDisplayConfigs';
import AnalyticsAssistantVoteOptions from '../../types/AnalyticsAssistantVoteOptions';
import useFeedbackStyles from './FeedbackDialog.styles';

const ANALYTICS_ASSISTANT_VOTE_OPTION_VALUES = new Set<string>(
  Object.values(AnalyticsAssistantVoteOptions),
);

const isAnalyticsAssistantVoteOption = (value: string): value is AnalyticsAssistantVoteOptions =>
  ANALYTICS_ASSISTANT_VOTE_OPTION_VALUES.has(value);

const EMPTY_FEEDBACK_OPTIONS: FeedbackOption[] = [];

interface FeedbackSubmitArgs {
  rating: FeedbackRating;
  additionalDetails: string;
}

interface FeedbackDialogProps {
  open: boolean;
  rating: FeedbackRating;
  feedbackId: string;
  upvoteOptions?: FeedbackOption[];
  downvoteOptions?: FeedbackOption[];
  characterLimit: number;
  onClose: () => void;
  onSubmit?: (args: FeedbackSubmitArgs) => void;
}

interface FeedbackState {
  selectedOption?: AnalyticsAssistantVoteOptions;
  additionalDetails?: string;
}

const FeedbackDialog: FC<FeedbackDialogProps> = ({
  open,
  rating,
  feedbackId,
  upvoteOptions = EMPTY_FEEDBACK_OPTIONS,
  downvoteOptions = EMPTY_FEEDBACK_OPTIONS,
  characterLimit,
  onClose,
  onSubmit,
}) => {
  const {
    classes: { container, question, textarea, actions },
  } = useFeedbackStyles();

  const { translate, ready } = useRAQIV2TranslationDependencies();
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({});

  const handleRadioChange = useCallback((value: AnalyticsAssistantVoteOptions) => {
    setFeedbackState((prevState) => ({
      ...prevState,
      selectedOption: value,
    }));
  }, []);

  const handleTextChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFeedbackState((prevState) => ({
      ...prevState,
      additionalDetails: event.target.value,
    }));
  }, []);

  const isPositiveRating = useMemo(() => rating === FeedbackRating.Positive, [rating]);
  const subheading = useMemo(() => {
    const upvote = translationKey(
      'Feedback.Heading.Upvote',
      TranslationNamespace.AnalyticsAssistant,
    );
    const downvote = translationKey(
      'Feedback.Heading.Downvote',
      TranslationNamespace.AnalyticsAssistant,
    );
    const label = isPositiveRating ? upvote : downvote;
    return (
      <Typography variant='h6' component='label' color='primary'>
        {translate(label)}
      </Typography>
    );
  }, [isPositiveRating, translate]);

  const feedbackOptions = useMemo(() => {
    const options = isPositiveRating ? upvoteOptions : downvoteOptions;
    const radioButtons = options.map((option) => {
      const label = translate(option.translationKey);
      return (
        <FormControlLabel
          key={label}
          value={option.value}
          control={<Radio aria-label={label} />}
          label={label}
        />
      );
    });

    return (
      <FormControl>
        <FormLabel>{subheading}</FormLabel>
        {options.length > 0 ? (
          <RadioGroup
            value={feedbackState.selectedOption}
            onChange={(event) => {
              const value = event.target.value;
              if (isAnalyticsAssistantVoteOption(value)) {
                handleRadioChange(value);
              }
            }}>
            {radioButtons}
          </RadioGroup>
        ) : null}
      </FormControl>
    );
  }, [
    isPositiveRating,
    upvoteOptions,
    downvoteOptions,
    subheading,
    feedbackState.selectedOption,
    translate,
    handleRadioChange,
  ]);

  const isCharacterLimitExceeded = useMemo(() => {
    const currentLength = feedbackState.additionalDetails?.length ?? 0;
    return currentLength > characterLimit;
  }, [feedbackState.additionalDetails, characterLimit]);

  const optionalFeedback = useMemo(() => {
    const heading = translate(
      translationKey('Feedback.Heading.AdditionalDetails', TranslationNamespace.AnalyticsAssistant),
    );
    const description = translate(
      translationKey('Feedback.Description.Details', TranslationNamespace.AnalyticsAssistant),
    );
    const optionalFeedbackCharacterLimitError = translate(
      translationKey('Feedback.Error.CharacterLimit', TranslationNamespace.AnalyticsAssistant),
      { limit: characterLimit.toString() },
    );

    return (
      <Grid container direction='column'>
        <Grid item className={question}>
          <Typography variant='h6' component='label' color='primary'>
            {heading}
          </Typography>
        </Grid>
        <Grid item>
          <TextField
            className={textarea}
            value={feedbackState.additionalDetails}
            size='medium'
            variant='outlined'
            fullWidth
            multiline
            rows={4}
            label=''
            placeholder={description}
            id='feedback-text'
            onChange={handleTextChange}
            error={isCharacterLimitExceeded}
            helperText={isCharacterLimitExceeded ? optionalFeedbackCharacterLimitError : ''}
          />
        </Grid>
      </Grid>
    );
  }, [
    translate,
    characterLimit,
    question,
    textarea,
    feedbackState.additionalDetails,
    handleTextChange,
    isCharacterLimitExceeded,
  ]);

  const onAction = useCallback(
    (submit: boolean) => {
      if (submit) {
        const { selectedOption, additionalDetails } = feedbackState;
        const details = additionalDetails ?? '';

        if (onSubmit) {
          onSubmit({ rating, additionalDetails: details });
        } else {
          void createAnalyticsAssistantFeedback({
            url: window.location.href,
            feedbackId,
            feedbackOption: selectedOption ?? '',
            feedbackDetails: details,
          });
        }
      }
      onClose();
    },
    [feedbackId, feedbackState, onClose, onSubmit, rating],
  );

  return ready ? (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        className: container,
      }}>
      <DialogTitle>
        <Typography variant='h3'>
          {translate(
            translationKey('Feedback.Title.GiveFeedback', TranslationNamespace.AnalyticsAssistant),
          )}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ marginTop: '8px' }}>
        <Grid container direction='column' spacing={2}>
          <Grid item>{feedbackOptions}</Grid>
          <Grid item>{optionalFeedback}</Grid>
        </Grid>
      </DialogContent>
      <DialogActions className={actions}>
        <Button
          variant='contained'
          aria-label='Cancel'
          color='secondary'
          onClick={() => onAction(false)}
          disabled={false}>
          {translate(translationKey('Action.Cancel', TranslationNamespace.AnalyticsAssistant))}
        </Button>
        <Button
          variant='contained'
          color='primaryBrand'
          onClick={() => onAction(true)}
          disabled={isCharacterLimitExceeded}>
          {translate(translationKey('Action.Submit', TranslationNamespace.AnalyticsAssistant))}
        </Button>
      </DialogActions>
    </Dialog>
  ) : (
    <EmptyGrid>
      <CircularProgress />
    </EmptyGrid>
  );
};
export default FeedbackDialog;
