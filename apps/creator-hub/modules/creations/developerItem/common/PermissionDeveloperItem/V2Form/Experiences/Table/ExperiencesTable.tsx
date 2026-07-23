import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@rbx/ui';
import PermissionThumbnail from '../../Shared/PermissionThumbnail';
import type { SharedSubjectDetails } from '../../Shared/types';
import { PermissionAccessLevel } from '../../Shared/types';
import useExperiencesTableStyles from './ExperiencesTable.styles';

export interface ExperiencesTableProps {
  proposedExperiences: SharedSubjectDetails[];
  handleRemoveProposedExperience: (experience: SharedSubjectDetails) => void;
}

const ExperiencesTable: FunctionComponent<React.PropsWithChildren<ExperiencesTableProps>> = ({
  proposedExperiences,
  handleRemoveProposedExperience,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { alreadyAddedButton, removeButton, removeButtonCell, tableContainer, tableRow },
  } = useExperiencesTableStyles();

  return (
    <Grid container data-testid='experiences-table'>
      <TableContainer classes={{ root: tableContainer }}>
        <Table size='medium' stickyHeader>
          <TableBody>
            {proposedExperiences.map((experience) => (
              <TableRow key={experience.subjectId} classes={{ root: tableRow }}>
                <TableCell>
                  <Grid container gap={1}>
                    <PermissionThumbnail subject={experience} />
                    <Grid item>
                      <Grid item>
                        <Typography variant='h6'>{experience.subjectName}</Typography>
                      </Grid>
                      <Grid item>
                        <Typography variant='body1'>{experience.subjectId}</Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                </TableCell>
                <TableCell classes={{ root: removeButtonCell }}>
                  {experience.storedAccessLevel === PermissionAccessLevel.USE ? (
                    <Button
                      disabled
                      color='primary'
                      variant='text'
                      classes={{ root: alreadyAddedButton }}>
                      {translate('Action.Added')}
                    </Button>
                  ) : (
                    <Button
                      variant='text'
                      onClick={() => handleRemoveProposedExperience(experience)}
                      classes={{ root: removeButton }}>
                      {translate('Action.Remove')}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Grid>
  );
};

export default ExperiencesTable;
