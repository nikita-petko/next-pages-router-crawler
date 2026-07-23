import { useState, useCallback } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  ExpandMoreIcon,
  Typography,
} from '@rbx/ui';
import useFormAccordionStyles from './FormAccordion.styles';

interface AccordionFormContainerProps {
  header?: React.ReactNode;
  children?: React.ReactNode;
}

const FormAccordion = ({ header, children }: AccordionFormContainerProps) => {
  const {
    classes: { accordion },
  } = useFormAccordionStyles();

  const [open, setOpen] = useState<boolean>(true);

  const toggleExpand = useCallback(() => {
    setOpen(!open);
  }, [open]);

  return (
    <Grid className={accordion}>
      <Accordion defaultExpanded expanded={open}>
        <AccordionSummary
          expandIcon={
            <ExpandMoreIcon
              data-testid='accordion-Icon'
              onClick={toggleExpand}
              name='actions.truncationExpand'
            />
          }>
          <Typography variant='h4'>{header}</Typography>
        </AccordionSummary>
        <AccordionDetails>{children}</AccordionDetails>
      </Accordion>
    </Grid>
  );
};
export default FormAccordion;
