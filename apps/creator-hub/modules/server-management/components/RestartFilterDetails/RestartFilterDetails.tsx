import type { FunctionComponent } from 'react';
import type { RestartStatus } from '@rbx/client-server-management-service/v1';
import { useTranslation } from '@rbx/intl';
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@rbx/ui';
import useRestartFilterDetailsStyles from './RestartFilterDetails.styles';
import RestartImpactDetails from './RestartImpactDetails';
import RestartPlaceDetails from './RestartPlaceDetails';

export interface RestartFilterDetailsProps {
  update: RestartStatus;
}

const RestartFilterDetails: FunctionComponent<RestartFilterDetailsProps> = ({ update }) => {
  const { translate } = useTranslation();
  const { classes } = useRestartFilterDetailsStyles();

  const { accordionSummary, accordionDetails } = classes;

  return (
    <Accordion variant='outlined' disableGutters data-testid='restart-filter-details'>
      <AccordionSummary className={accordionSummary}>
        <Typography variant='h6'>{translate('RestartFilterDetails.Title')}</Typography>
      </AccordionSummary>
      <AccordionDetails className={accordionDetails}>
        <RestartImpactDetails update={update} />
        <RestartPlaceDetails update={update} />
      </AccordionDetails>
    </Accordion>
  );
};

export default RestartFilterDetails;
