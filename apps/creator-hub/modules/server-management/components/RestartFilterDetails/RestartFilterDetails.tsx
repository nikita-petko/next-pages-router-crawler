import React, { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { RestartStatus } from '@rbx/clients/serverManagementService';
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@rbx/ui';
import useRestartFilterDetailsStyles from './RestartFilterDetails.styles';
import RestartPlaceDetails from './RestartPlaceDetails';
import RestartImpactDetails from './RestartImpactDetails';

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
