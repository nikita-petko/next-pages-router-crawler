import {
  Typography,
  Accordion,
  AccordionSummary,
  ExpandMoreIcon,
  AccordionDetails,
  makeStyles,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import type { ContentStandardsQuestionAnswer } from '@rbx/clients/contentLicensingApi/v1';

import AmDivider from './AmDivider';
import { getLabelFromContentStandardQuestionAnswer } from '../utils/guidelinesAndRestrictions';

interface GenericStandardsAccordionProps {
  isAccordionOpen: boolean;
  setIsOpen: (open: boolean) => void;
  title: string;
  statementsToShow: ContentStandardsQuestionAnswer[];
}

const useStyles = makeStyles()(() => ({
  accordion: {
    border: 'none',
    '&:before': {
      display: 'none',
    },
  },
  accordionSummary: {
    minHeight: 'auto',
    padding: 0,
    '& .MuiAccordionSummary-content': {
      margin: '8px 0',
    },
    '&.Mui-expanded': {
      minHeight: 'auto',
      '& .MuiAccordionSummary-content': {
        margin: '8px 0',
      },
    },
  },
  accordionDetails: {
    padding: '0px 8px',
    display: 'flex',
    flexDirection: 'column',
  },
}));

/** Generic accordion component that displays a list of statements in a bulleted list */
const GenericStandardsAccordion = ({
  isAccordionOpen,
  setIsOpen,
  title,
  statementsToShow,
}: GenericStandardsAccordionProps) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();

  return (
    <div>
      <Accordion
        expanded={isAccordionOpen}
        onChange={() => setIsOpen(!isAccordionOpen)}
        variant='outlined'
        className={classes.accordion}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} className={classes.accordionSummary}>
          <Typography variant='body2' color='secondary'>
            <strong>{title}</strong>
          </Typography>
        </AccordionSummary>
        <AccordionDetails className={classes.accordionDetails}>
          {statementsToShow.map((statement) => (
            <Typography variant='body2' color='secondary' key={statement.questionId} gutterBottom>
              {translate('Label.BulletPointText', {
                text: translate(getLabelFromContentStandardQuestionAnswer(statement)),
              })}
            </Typography>
          ))}
        </AccordionDetails>
      </Accordion>
      <AmDivider />
    </div>
  );
};

export default GenericStandardsAccordion;
