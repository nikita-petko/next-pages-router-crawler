import React from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  TableCell,
  TableRow,
  TableHead,
  Typography,
  Table,
  TableBody,
} from '@rbx/ui';

export const DefinitionsTable = () => {
  const { translate } = useTranslation();

  return (
    <Accordion variant='outlined'>
      <AccordionSummary>
        <Typography>{translate('Title.CommerceImportantDefinitions')}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{translate('Label.Term')}</TableCell>
              <TableCell>{translate('Label.Description')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>{translate('Label.Metric.CommerceGMV')}</TableCell>
              <TableCell>{translate('Description.CommerceGMV')}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{translate('Label.Metric.CommerceQuantitySold')}</TableCell>
              <TableCell>{translate('Description.CommerceQuantitySold')}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{translate('Label.Metric.CommerceClicks')}</TableCell>
              <TableCell>{translate('Description.CommerceClicks')}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{translate('Label.Metric.CommerceCheckouts')}</TableCell>
              <TableCell>{translate('Description.CommerceCheckouts')}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{translate('Label.Metric.CommerceOrders')}</TableCell>
              <TableCell>{translate('Description.CommerceOrders')}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{translate('Title.CommerceUniqueProductEvents')}</TableCell>
              <TableCell>{translate('Description.CommerceUniqueEvents')}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </AccordionDetails>
    </Accordion>
  );
};

export default withTranslation(DefinitionsTable, [
  TranslationNamespace.Commerce,
  TranslationNamespace.Analytics,
]);
