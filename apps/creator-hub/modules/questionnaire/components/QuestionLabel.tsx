import React, { FunctionComponent, useState } from 'react';
import { Grid, makeStyles } from '@rbx/ui';
import { HelpInfo } from '@modules/clients/experienceQuestionnaire';
import useQuestionnaireV2Gate from '@modules/experience-questionnaire/hooks/useQuestionnaireV2Gate';
import { useTranslation } from '@rbx/intl';
import useMarkdownParser from '../parser/useMarkdownParser';
import HelpDialog from './HelpDialog';

const useQuestionLabelStyles = makeStyles()(() => ({
  questionText: {
    display: 'inline',
    '& p': {
      display: 'inline',
      margin: 0,
    },
  },
}));

export interface QuestionLabelProps {
  questionText: string;
  helpInfo?: HelpInfo | null;
}

const QuestionLabel: FunctionComponent<React.PropsWithChildren<QuestionLabelProps>> = ({
  questionText,
  helpInfo,
  children,
}) => {
  const { translate } = useTranslation();
  const { parseText } = useMarkdownParser();
  const { classes } = useQuestionLabelStyles();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { shouldUseV2: shouldUseQuestionnaireV2 } = useQuestionnaireV2Gate();

  const hasHelpInfo =
    shouldUseQuestionnaireV2 &&
    helpInfo &&
    (helpInfo.title || helpInfo.text || (helpInfo.examples && helpInfo.examples.length > 0));

  const handleOpenDialog = (event: React.MouseEvent) => {
    event.preventDefault();
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <React.Fragment>
      <Grid item>
        <div className='inline-flex items-center flex-wrap gap-[4px]'>
          <span className={classes.questionText}>
            {parseText(questionText.trim(), { includeLineBreaks: true })}
            {hasHelpInfo && (
              <button
                className='margin-left-[4px] text-body-medium content-default cursor-pointer'
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  textDecoration: 'underline',
                }}
                onClick={handleOpenDialog}
                type='button'>
                {translate('Label.ViewDetails')}
              </button>
            )}
          </span>
        </div>
        {children}
      </Grid>
      {hasHelpInfo && helpInfo && (
        <HelpDialog open={isDialogOpen} onClose={handleCloseDialog} helpInfo={helpInfo} />
      )}
    </React.Fragment>
  );
};

export default QuestionLabel;
