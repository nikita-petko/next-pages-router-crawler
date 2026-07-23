import React, { FunctionComponent, useState, useCallback } from 'react';
import {
  Typography,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CloseIcon,
  ReportProblemOutlinedIcon,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { PageLoading } from '@modules/miscellaneous/common';
import useManualFeedbackStyles from './ManualFeedback.styles';
import FeedbackCard from './FeedbackCard';
import { TranslationFeedback } from '../types';
import getTranslation from '../utils/testFeedbackUtils';

export interface ManualFeedbackProps {
  error: Error | null;
  isLoading: boolean;
  translationFeedback: TranslationFeedback[];
  onSave: (currentTranslation: string | null, isTranslationManual: boolean) => void;
}

const ManualFeedback: FunctionComponent<React.PropsWithChildren<ManualFeedbackProps>> = ({
  error,
  isLoading,
  translationFeedback,
  onSave,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { accordion, container, errorText },
  } = useManualFeedbackStyles();
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const toggleExpand = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  let content;
  if (isLoading) {
    content = <PageLoading />;
  } else if (error) {
    content = (
      <Grid container alignItems='center'>
        <ReportProblemOutlinedIcon fontSize='small' />
        <Typography className={errorText} variant='largeLabel2'>
          {getTranslation(
            translate('Message.FailedToFetchFeedback'),
            'Failed to fetch translation feedback. Please try again later.',
          )}
        </Typography>
      </Grid>
    );
  } else {
    content = (
      <Grid container direction='row' justifyContent='space-between'>
        {translationFeedback?.map((suggestion) => (
          <FeedbackCard
            cardLength={translationFeedback.length}
            key={suggestion.suggestion}
            translationFeedback={suggestion}
            onSave={onSave}
          />
        ))}
      </Grid>
    );
  }

  const translationFeedbackTitle = getTranslation(
    translate('Title.TranslationFeedback'),
    'Translation Feedback',
  );

  return (
    <Grid className={container}>
      <Accordion square={false} defaultExpanded expanded={isExpanded} className={accordion}>
        <AccordionSummary onClick={toggleExpand} expandIcon={<CloseIcon />}>
          <Grid container direction='row' justifyContent='space-between'>
            <Typography variant='subtitle2'>{translationFeedbackTitle}</Typography>
            <Typography color='secondary' variant='body2'>
              {getTranslation(translate('Label.Hide'), 'Hide')}
            </Typography>
          </Grid>
        </AccordionSummary>
        <AccordionDetails>{content}</AccordionDetails>
      </Accordion>
    </Grid>
  );
};

export default ManualFeedback;
