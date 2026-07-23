import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Grid, Typography, Accordion, AccordionDetails, AccordionSummary } from '@rbx/ui';
import type { RoadMapAccordionDetails } from './hooks/useRoadMapTranslation';
import useRoadMapAccordionStyles from './RoadMapAccordion.styles';
import RoadMapAccordionContent from './RoadMapAccordionContent';

export type RoadMapAccordionProps = RoadMapAccordionDetails;

const RoadMapAccordion: FunctionComponent<React.PropsWithChildren<RoadMapAccordionProps>> = ({
  title,
  Icon,
  content,
  image,
  anchor,
}) => {
  const shouldScroll =
    typeof window !== 'undefined' && window.location.hash.replace('#', '') === anchor;
  const accordionRef = useRef<HTMLDivElement>(null);
  const {
    classes: { accordion, headerIcon },
  } = useRoadMapAccordionStyles();
  const [isExpanded, setIsExpanded] = useState(shouldScroll);

  const onClick = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  useEffect(() => {
    if (shouldScroll) {
      setIsExpanded(true);
    }

    if (shouldScroll && accordionRef.current) {
      accordionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  }, [shouldScroll]);

  return (
    <Accordion ref={accordionRef} classes={{ root: accordion }} expanded={isExpanded}>
      <AccordionSummary onClick={onClick}>
        <Icon classes={{ root: headerIcon }} />
        <Grid>
          <Typography variant='largeLabel1'>{title}</Typography>
        </Grid>
      </AccordionSummary>
      <AccordionDetails>
        <RoadMapAccordionContent content={content} image={image} isExpended={isExpanded} />
      </AccordionDetails>
    </Accordion>
  );
};

export default RoadMapAccordion;
